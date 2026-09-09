'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import * as topojson from 'topojson-client';
import { Album } from '@/data/albums';
import { siteConfig } from '@/data/config';
import Link from 'next/link';
import { useMusicContext } from '@/contexts/MusicContext';
import { LyricLine } from '@/data/lyrics';
import dynamic from 'next/dynamic';

const GlobeGL = dynamic(() => import('react-globe.gl'), { ssr: false });

// ─── Ring config: each ring = one orbital plane ─────────────────────────────
// CSS 3D transform on the wrapper div makes the flat SVG circle look like
// a tilted orbital ring around the globe.
const RING_CONFIGS = [
  { rotateX: 72, rotateZ: 0,   baseOffset: 25 }, // primary equatorial
  { rotateX: 65, rotateZ: 28,  baseOffset: 60 }, // tilted up-right
  { rotateX: 78, rotateZ: -22, baseOffset: 45 }, // tilted down-left
  { rotateX: 68, rotateZ: 52,  baseOffset: 15 }, // diagonal
];

const WINDOW_BACK  = 1;
const WINDOW_SIZE  = 5; // total visible lines

export default function GlobeComponent({ albums }: { albums: Album[] }) {
  const { currentTrack } = useMusicContext();

  const globeEl    = useRef<any>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // One ref per ring's <textPath> and one ref per word set
  const textPathRefs   = useRef<(SVGTextPathElement | null)[]>([]);
  const ringGroupRefs  = useRef<(SVGGElement | null)[]>([]);

  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [globeSize, setGlobeSize]       = useState({ width: 800, height: 800 });
  const [rings, setRings]               = useState<any[]>([]);
  const [arcs, setArcs]                 = useState<any[]>([]);

  const locations = albums.filter(a => a.type === 'location' && a.lat && a.lng);

  // ─── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setGlobeSize({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ─── Load geo + arcs ──────────────────────────────────────────────────────
  useEffect(() => {
    import('@/data/land-110m.json').then((topo: any) => {
      const data = topo.default || topo;
      setLandPolygons((topojson.feature(data, data.objects.land as any) as any).features);
    });
    const newArcs = [];
    for (let i = 0; i < locations.length - 1; i++) {
      newArcs.push({
        startLat: locations[i].lat!, startLng: locations[i].lng!,
        endLat: locations[i + 1].lat!, endLng: locations[i + 1].lng!,
        color: ['#cc0000', '#ff0000'],
      });
    }
    setArcs(newArcs);
  }, [albums]);

  // ─── Globe setup ──────────────────────────────────────────────────────────
  const polygonMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffffff', opacity: 0.8, transparent: true, depthWrite: false,
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

  // ─── LYRIC RING ENGINE ───────────────────────────────────────────────────
  // Runs at 60fps via music-time events.
  // For each visible lyric slot, we:
  //   1. Choose which lyric line it shows
  //   2. Render that line's words as <tspan> inside a <textPath>
  //   3. Update textPath startOffset to keep active text in the readable front arc
  //   4. Update word tspan fills for current-word highlighting

  useEffect(() => {
    const lyrics = currentTrack.lyrics;

    const handleTime = (e: CustomEvent) => {
      const { time, trackId } = e.detail;

      if (trackId !== currentTrack.id || time < 0 || !lyrics?.length) {
        ringGroupRefs.current.forEach(g => { if (g) g.style.opacity = '0'; });
        return;
      }

      // Find active line index
      let activeIdx = lyrics.findIndex(l => time >= l.start && time <= l.end);
      if (activeIdx === -1) {
        const nextIdx = lyrics.findIndex(l => l.start > time);
        activeIdx = nextIdx === -1 ? lyrics.length - 1 : Math.max(0, nextIdx - 1);
      }

      // Lyric window: WINDOW_BACK lines before active, rest after
      const winStart = Math.max(0, activeIdx - WINDOW_BACK);
      const winEnd   = Math.min(lyrics.length - 1, winStart + WINDOW_SIZE - 1);

      // Assign lines to rings
      for (let slot = 0; slot < RING_CONFIGS.length; slot++) {
        const lineIdx   = winStart + slot;
        const groupEl   = ringGroupRefs.current[slot];
        const tpEl      = textPathRefs.current[slot];

        if (!groupEl || !tpEl) continue;

        if (lineIdx > winEnd) {
          groupEl.style.opacity = '0';
          continue;
        }

        const line     = lyrics[lineIdx];
        const isActive = lineIdx === activeIdx;
        const dist     = Math.abs(lineIdx - activeIdx);

        // Build the text content with tspan per word
        // We do this by directly setting innerHTML on the textPath
        const wordSpans = line.words.map((w, wi) => {
          const isCurrentWord = isActive && time >= w.start && time <= w.end;
          const fill   = isCurrentWord ? '#000000' : isActive ? '#111111' : '#aaaaaa';
          const weight = isCurrentWord ? '650' : isActive ? '480' : '300';
          return `<tspan fill="${fill}" font-weight="${weight}">${w.text}</tspan><tspan fill="transparent"> </tspan>`;
        }).join('');

        tpEl.innerHTML = wordSpans;

        // Animate startOffset: active line stays near the front (bottom of flattened ring ≈ readable zone)
        // We use time-based drift + a nudge toward the "front" for the active line
        const cfg = RING_CONFIGS[slot];
        const driftPct = (time * 2.0 * (slot % 2 === 0 ? 1 : -1)) % 100;
        let offset = (cfg.baseOffset + driftPct + 100) % 100;

        // For the active line, bias toward the front-facing arc (around 75% of a ring viewed in perspective)
        if (isActive) {
          const lineDuration = line.end - line.start;
          const progress = Math.min(1, (time - line.start) / (lineDuration * 0.15));
          const frontTarget = 75;
          const currentDeg = offset;
          // Lerp toward front
          const diff = ((frontTarget - currentDeg + 150) % 100) - 50;
          offset = (currentDeg + diff * progress + 100) % 100;
        }

        tpEl.setAttribute('startOffset', `${offset.toFixed(1)}%`);

        // Opacity by distance from active
        const opacity = isActive ? 1 : dist === 1 ? 0.28 : 0.13;
        groupEl.style.opacity = opacity.toString();
      }
    };

    window.addEventListener('music-time', handleTime as EventListener);
    return () => window.removeEventListener('music-time', handleTime as EventListener);
  }, [currentTrack]);

  // ─── Globe interaction ────────────────────────────────────────────────────
  const handleMouseEnter = (album: Album) => {
    if (globeEl.current && album.lat && album.lng) {
      globeEl.current.pointOfView({ lat: album.lat, lng: album.lng, altitude: 1.5 }, 1000);
      setRings([{ lat: album.lat, lng: album.lng, maxR: 6, propagationSpeed: 1.2, repeatPeriod: 1500 }]);
    }
  };
  const handleMouseLeave = () => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: 70, altitude: 2.4 }, 1000);
      setRings([]);
    }
  };

  const colorInterpolator = (t: number) => `rgba(204,0,0,${Math.sqrt(1 - t)})`;

  // ─── SVG ring path helper (full ellipse as two arcs) ────────────────────
  // cx,cy = center, rx/ry = axes of ellipse
  function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
    return [
      `M ${cx - rx},${cy}`,
      `A ${rx},${ry} 0 1,1 ${cx + rx},${cy}`,
      `A ${rx},${ry} 0 1,1 ${cx - rx},${cy}`,
    ].join(' ');
  }

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

      {/* LEFT UI */}
      <div className="relative z-50 w-[44vw] md:w-[38vw] lg:w-[36vw] max-w-[540px] flex-shrink-0
                      flex flex-col justify-center pl-[8vw] pr-6 pointer-events-none">
        <h1 className="font-bold mb-10 sm:mb-16 text-4xl md:text-5xl lg:text-6xl font-serif
                       tracking-tight text-[#111] pointer-events-auto whitespace-nowrap">
          {siteConfig.siteName}
        </h1>
        <ul className="flex flex-col gap-2 text-xl md:text-2xl lg:text-3xl font-sans pointer-events-auto">
          {locations.map(album => (
            <li key={album.id} className="group"
                onMouseEnter={() => handleMouseEnter(album)}
                onMouseLeave={handleMouseLeave}>
              <Link href={`/places/${album.slug}`}
                    className="text-[#555] hover:text-[#000] transition-colors relative inline-block">
                {album.title}
                <span className="absolute left-0 -bottom-px w-0 h-px bg-red-600 transition-all group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* GLOBE + LYRIC RINGS */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ left: '28vw' }}>
        <div ref={containerRef} className="absolute inset-0">

          {/* Globe canvas at z-index 20 */}
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
                polygonCapMaterial={polygonMaterial}
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
                ringColor={() => colorInterpolator}
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

          {/* LYRIC RINGS — SVG rings with CSS 3D perspective per ring
              Each ring wrapper div gets perspective + rotateX + rotateZ
              to create a tilted orbital plane appearance.
              z-index: back rings (slots 1,3) = 8 (behind globe canvas at 20)
                       front rings (slots 0,2) = 30 (in front of globe canvas) */}
          {RING_CONFIGS.map((cfg, slot) => (
            <div
              key={`ring-${currentTrack.id}-${slot}`}
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: slot % 2 === 0 ? 30 : 8,
                perspective: '700px',
                perspectiveOrigin: '50% 50%',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `rotateX(${cfg.rotateX}deg) rotateZ(${cfg.rotateZ}deg)`,
                  transformOrigin: '50% 50%',
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 1000 1000"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <path
                      id={`orbit-path-${slot}`}
                      d={ellipsePath(500, 500, 340, 340)}
                    />
                  </defs>

                  <g
                    ref={el => { ringGroupRefs.current[slot] = el; }}
                    style={{
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <text
                      style={{
                        fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                        fontSize: 'clamp(13px, 1.6vw, 22px)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <textPath
                        ref={el => { textPathRefs.current[slot] = el; }}
                        href={`#orbit-path-${slot}`}
                        startOffset="25%"
                        dangerouslySetInnerHTML={{ __html: '' }}
                      />
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          ))}

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
