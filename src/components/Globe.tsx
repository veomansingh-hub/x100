'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import * as topojson from 'topojson-client';
import { Album } from '@/data/albums';
import { siteConfig } from '@/data/config';
import Link from 'next/link';
import { useMusicContext } from '@/contexts/MusicContext';
import dynamic from 'next/dynamic';

const GlobeGL = dynamic(() => import('react-globe.gl'), { ssr: false });

// ─── SVG lyric ring helpers ───────────────────────────────────────────────────

/** Creates a clockwise full-circle SVG path starting at the TOP (12 o'clock). */
function ringPath(cx: number, cy: number, r: number) {
  const top = cy - r;
  // Two arcs to form the full circle (SVG can't express a full arc in one command)
  return [
    `M ${cx},${top}`,
    `A ${r},${r} 0 1,1 ${cx - 0.001},${top}`,
    `Z`,
  ].join(' ');
}

/** Separator between lyric lines in the ring */
const SEP = '    ·    ';
/** Approximate rendered width of one character (serif 22px) */
const CHAR_W = 11.8;

// ─── Component ───────────────────────────────────────────────────────────────
export default function GlobeComponent({ albums }: { albums: Album[] }) {
  const { currentTrack } = useMusicContext();

  const globeEl       = useRef<any>(undefined);
  const containerRef  = useRef<HTMLDivElement>(null);
  const textPathRef   = useRef<SVGTextPathElement>(null);
  const svgRef        = useRef<SVGSVGElement>(null);

  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [globeSize, setGlobeSize]       = useState({ width: 800, height: 800 });
  const [rings, setRings]               = useState<any[]>([]);
  const [arcs, setArcs]                 = useState<any[]>([]);
  // Dynamic ring geometry: cx, cy in SVG px coords, r = ring radius
  const [ringGeom, setRingGeom] = useState({ cx: 0, cy: 0, r: 0 });

  const locations = albums.filter(a => a.type === 'location' && a.lat && a.lng);

  // ─── Resize ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries)
        setGlobeSize({ width: e.contentRect.width, height: e.contentRect.height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ─── Load geo ────────────────────────────────────────────────────────────
  useEffect(() => {
    import('@/data/land-110m.json').then((topo: any) => {
      const d = topo.default || topo;
      setLandPolygons((topojson.feature(d, d.objects.land as any) as any).features);
    });
    const a: any[] = [];
    for (let i = 0; i < locations.length - 1; i++)
      a.push({
        startLat: locations[i].lat!, startLng: locations[i].lng!,
        endLat: locations[i + 1].lat!, endLng: locations[i + 1].lng!,
        color: ['#cc0000', '#ff0000'],
      });
    setArcs(a);
  }, [albums]);

  // ─── Globe setup ─────────────────────────────────────────────────────────
  const polyMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffffff', opacity: 0.85, transparent: true, depthWrite: false,
  }), []);

  useEffect(() => {
    if (!globeEl.current) return;
    const g = globeEl.current;
    g.controls().autoRotate      = true;
    g.controls().autoRotateSpeed = 0.5;
    g.controls().enableDamping   = true;
    g.controls().dampingFactor   = 0.05;
    g.controls().enableZoom      = false;
    g.pointOfView({ lat: 20, lng: 70, altitude: 2.4 });
  }, [globeEl.current]);

  // ─── Compute ring geometry from Three.js camera projection ───────────────
  // Runs every 500ms to track globe as it auto-rotates/changes view
  useEffect(() => {
    const compute = () => {
      if (!globeEl.current || !containerRef.current) return;
      const g    = globeEl.current;
      const rect = containerRef.current.getBoundingClientRect();
      const W    = rect.width;
      const H    = rect.height;
      const cam  = g.camera();

      // Globe center (0,0,0) → screen
      const c3 = new THREE.Vector3(0, 0, 0).project(cam);
      const cx = (c3.x * 0.5 + 0.5) * W;
      const cy = -(c3.y * 0.5 - 0.5) * H;

      // Globe edge (radius=100 in react-globe.gl) → screen
      const e3 = new THREE.Vector3(100, 0, 0).project(cam);
      const ex = (e3.x * 0.5 + 0.5) * W;

      const screenR = Math.abs(ex - cx);
      // Lyric ring sits just outside the globe: +15% padding
      setRingGeom({ cx, cy, r: screenR * 1.15 });
    };

    const id = setInterval(compute, 400);
    // Also run once when globe is ready
    const init = setTimeout(compute, 800);
    return () => { clearInterval(id); clearTimeout(init); };
  }, [globeSize]);

  // ─── LYRIC RING ENGINE ───────────────────────────────────────────────────
  // Runs at ~60fps via music-time events from MusicContext.
  // Directly mutates the SVG textPath innerHTML and startOffset.
  // Zero React state updates in the hot path.

  const offsetRef    = useRef(0);   // current animated startOffset (%)
  const targetOffset = useRef(0);   // where we want to get to
  const rafRef       = useRef<number | null>(null);

  // Animate offset with lerp
  const animateOffset = useCallback(() => {
    const diff = targetOffset.current - offsetRef.current;
    if (Math.abs(diff) > 0.02) {
      offsetRef.current += diff * 0.12;
      if (textPathRef.current)
        textPathRef.current.setAttribute('startOffset', `${offsetRef.current.toFixed(2)}%`);
      rafRef.current = requestAnimationFrame(animateOffset);
    } else {
      offsetRef.current = targetOffset.current;
      if (textPathRef.current)
        textPathRef.current.setAttribute('startOffset', `${offsetRef.current.toFixed(2)}%`);
    }
  }, []);

  useEffect(() => {
    const lyrics = currentTrack.lyrics;

    const handleTime = (e: CustomEvent) => {
      const { time, trackId } = e.detail;
      const tp = textPathRef.current;
      if (!tp || !lyrics?.length) return;

      if (trackId !== currentTrack.id || time < 0) {
        tp.innerHTML = '';
        return;
      }

      // ── Find active line ────────────────────────────────────────────────
      let activeIdx = lyrics.findIndex(l => time >= l.start && time <= l.end);
      if (activeIdx === -1) {
        const next = lyrics.findIndex(l => l.start > time);
        activeIdx = next === -1 ? lyrics.length - 1 : Math.max(0, next - 1);
      }

      // ── Build ring text ─────────────────────────────────────────────────
      // We put ALL lines in the ring (up to 16 around the circle).
      // The ring circumference = 2π * r (in px).
      // Each char ≈ CHAR_W px wide.
      const r          = ringGeom.r || 320;
      const circum     = 2 * Math.PI * r;
      const charsInRing= circum / CHAR_W;

      // Determine a window centred on active that fills roughly the ring
      const windowHalf = Math.floor((charsInRing * 0.95) / 2 / (28 + SEP.length));
      const winStart   = Math.max(0, activeIdx - windowHalf);
      const winEnd     = Math.min(lyrics.length - 1, activeIdx + windowHalf);

      let html = '';
      let totalChars = 0;
      let activeCharStart = 0;
      let activeCharEnd   = 0;

      for (let i = winStart; i <= winEnd; i++) {
        const line     = lyrics[i];
        const isActive = i === activeIdx;

        if (isActive) activeCharStart = totalChars;

        if (isActive && line.words?.length) {
          // Per-word tspan for highlighting
          let lineHtml = '';
          for (const w of line.words) {
            const isCurrent = time >= w.start && time <= w.end;
            const fill   = isCurrent ? '#000000' : '#1a1a1a';
            const weight = isCurrent ? 700 : 450;
            lineHtml += `<tspan fill="${fill}" font-weight="${weight}">${escapeXml(w.text)} </tspan>`;
            totalChars += w.text.length + 1;
          }
          html += lineHtml;
        } else {
          // Inactive: pale, single tspan
          const opacity = Math.max(0.08, 0.28 - Math.abs(i - activeIdx) * 0.06);
          html += `<tspan fill="rgba(0,0,0,${opacity.toFixed(2)})">${escapeXml(line.text)}</tspan>`;
          totalChars += line.text.length;
        }

        if (isActive) activeCharEnd = totalChars;

        // Separator
        html += `<tspan fill="rgba(0,0,0,0.08)">${escapeXml(SEP)}</tspan>`;
        totalChars += SEP.length;
      }

      // ── Update DOM ──────────────────────────────────────────────────────
      tp.innerHTML = html;

      // ── Rotate ring so active line is at TOP (0%) ───────────────────────
      const activeMidChar  = (activeCharStart + activeCharEnd) / 2;
      const activePct      = (activeMidChar / totalChars) * 100;
      // To put activePct at position 0 (top), shift by -activePct
      const newTarget = -activePct;
      // Only re-animate if the target changed meaningfully
      if (Math.abs(newTarget - targetOffset.current) > 0.5) {
        targetOffset.current = newTarget;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animateOffset);
      }
    };

    window.addEventListener('music-time', handleTime as EventListener);
    return () => {
      window.removeEventListener('music-time', handleTime as EventListener);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentTrack, ringGeom, animateOffset]);

  // ─── Globe interaction ────────────────────────────────────────────────────
  const handleEnter = (album: Album) => {
    if (globeEl.current && album.lat && album.lng) {
      globeEl.current.pointOfView({ lat: album.lat, lng: album.lng, altitude: 1.5 }, 1000);
      setRings([{ lat: album.lat, lng: album.lng, maxR: 6, propagationSpeed: 1.2, repeatPeriod: 1500 }]);
    }
  };
  const handleLeave = () => {
    globeEl.current?.pointOfView({ lat: 20, lng: 70, altitude: 2.4 }, 1000);
    setRings([]);
  };
  const arcInterp = (t: number) => `rgba(204,0,0,${Math.sqrt(1 - t)})`;

  return (
    <section className="fixed inset-0 bg-white text-black overflow-hidden flex">

      {/* BACKGROUND GRATICULE */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{ stroke: 'rgba(0,0,0,0.04)', strokeWidth: 1, fill: 'none' }}>
        <ellipse cx="50%" cy="50%" rx="48%" ry="100%" />
        <ellipse cx="50%" cy="50%" rx="36%" ry="100%" />
        <ellipse cx="50%" cy="50%" rx="24%" ry="100%" />
        <ellipse cx="50%" cy="50%" rx="12%" ry="100%" />
        <line x1="0" y1="50%" x2="100%" y2="50%" />
        <line x1="0" y1="35%" x2="100%" y2="35%" />
        <line x1="0" y1="65%" x2="100%" y2="65%" />
        <line x1="0" y1="20%" x2="100%" y2="20%" />
        <line x1="0" y1="80%" x2="100%" y2="80%" />
      </svg>

      {/* LEFT COLUMN */}
      <div className="relative z-50 w-[44vw] md:w-[38vw] lg:w-[36vw] max-w-[540px] flex-shrink-0
                      flex flex-col justify-center pl-[8vw] pr-6 pointer-events-none">
        <h1 className="font-bold mb-10 sm:mb-16 text-4xl md:text-5xl lg:text-6xl font-serif
                       tracking-tight text-[#111] pointer-events-auto whitespace-nowrap">
          {siteConfig.siteName}
        </h1>
        <ul className="flex flex-col gap-2 text-xl md:text-2xl lg:text-3xl font-sans pointer-events-auto">
          {locations.map(album => (
            <li key={album.id} className="group"
              onMouseEnter={() => handleEnter(album)} onMouseLeave={handleLeave}>
              <Link href={`/places/${album.slug}`}
                className="text-[#555] hover:text-[#000] transition-colors relative inline-block">
                {album.title}
                <span className="absolute left-0 -bottom-px w-0 h-px bg-red-600 transition-all group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* GLOBE + LYRIC RING */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ left: '28vw' }}>
        <div ref={containerRef} className="absolute inset-0">

          {/* Globe canvas */}
          <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 20 }}>
            {globeSize.width > 0 && (
              <GlobeGL
                ref={globeEl as any}
                width={globeSize.width}
                height={globeSize.height}
                rendererConfig={{ antialias: true, alpha: true }}
                animateIn={false}
                backgroundColor="rgba(0,0,0,0)"
                showGlobe={false}
                showAtmosphere={false}
                showGraticules={false}
                polygonsData={landPolygons}
                polygonCapMaterial={polyMat}
                polygonsTransitionDuration={0}
                polygonAltitude={() => 0}
                polygonSideColor={() => 'rgba(255,255,255,0)'}
                polygonStrokeColor={() => '#444'}
                pointsData={locations.map(a => ({ lat: a.lat!, lng: a.lng! }))}
                pointColor={() => '#cc0000'}
                pointAltitude={0.01}
                pointRadius={0.18}
                pointsMerge={true}
                ringsData={rings}
                ringColor={() => arcInterp}
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                arcsData={arcs}
                arcColor={() => '#cc0000'}
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={2500}
              />
            )}
          </div>

          {/* SINGLE LYRIC RING — SVG overlay, zIndex 25 (in front of globe) */}
          {ringGeom.r > 0 && (
            <svg
              ref={svgRef}
              className="absolute inset-0 pointer-events-none"
              width={globeSize.width}
              height={globeSize.height}
              style={{ zIndex: 25, overflow: 'visible' }}
            >
              <defs>
                <path
                  id="lyric-ring-path"
                  d={ringPath(ringGeom.cx, ringGeom.cy, ringGeom.r)}
                />
              </defs>

              {/* Debug ring outline (very faint) */}
              <circle
                cx={ringGeom.cx}
                cy={ringGeom.cy}
                r={ringGeom.r}
                fill="none"
                stroke="rgba(0,0,0,0.04)"
                strokeWidth={1}
              />

              <text
                style={{
                  fontFamily: 'ui-serif, Georgia, "Palatino Linotype", serif',
                  fontSize: 'clamp(14px, 1.5vw, 22px)',
                  letterSpacing: '0.03em',
                }}
              >
                <textPath
                  ref={textPathRef}
                  href="#lyric-ring-path"
                  startOffset="0%"
                />
              </text>
            </svg>
          )}

        </div>
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-8 right-8 md:bottom-12 md:right-[5vw] z-50
                         pointer-events-none text-[#999] font-sans text-xs tracking-widest">
        &copy; {new Date().getFullYear()}
      </footer>
    </section>
  );
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
