'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import * as topojson from 'topojson-client';
import { Album } from '@/data/albums';
import { siteConfig } from '@/data/config';
import Link from 'next/link';
import { useMusicContext } from '@/contexts/MusicContext';
import dynamic from 'next/dynamic';

const GlobeGL = dynamic(() => import('react-globe.gl'), { ssr: false });

// ─── Orbital planes configuration ───────────────────────────────────────────
// Each orbit gets a tilt (inclination) and a phase offset so lines spread out
const ORBITAL_PLANES = [
  { tilt: 25 * (Math.PI / 180), phaseOffset: 0,           direction: 1  },
  { tilt: 40 * (Math.PI / 180), phaseOffset: Math.PI/4,   direction: -1 },
  { tilt: 55 * (Math.PI / 180), phaseOffset: Math.PI/2,   direction: 1  },
  { tilt: 30 * (Math.PI / 180), phaseOffset: 3*Math.PI/4, direction: -1 },
  { tilt: 45 * (Math.PI / 180), phaseOffset: Math.PI,     direction: 1  },
];

// Lines visible in the active window
const WINDOW_SIZE = 5; // previous + active + next 3
const WINDOW_BACK = 1; // how many before active

export default function GlobeComponent({ albums }: { albums: Album[] }) {
  const { currentTrack } = useMusicContext();

  const globeEl = useRef<any>(undefined);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 800 });
  const [rings, setRings] = useState<any[]>([]);
  const [arcs, setArcs] = useState<any[]>([]);

  const locations = albums.filter(a => a.type === 'location' && a.lat && a.lng);

  // ─── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeContainerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setGlobeSize({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    obs.observe(globeContainerRef.current);
    return () => obs.disconnect();
  }, []);

  // ─── Load geo data ───────────────────────────────────────────────────────
  useEffect(() => {
    import('@/data/land-110m.json').then((topo: any) => {
      const data = topo.default || topo;
      const polygons = (topojson.feature(data, data.objects.land as any) as any).features;
      setLandPolygons(polygons);
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
    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.5;
    g.controls().enableDamping = true;
    g.controls().dampingFactor = 0.05;
    g.controls().enableZoom = false;
    g.pointOfView({ lat: 20, lng: 70, altitude: 2.4 });
  }, [globeEl.current]);

  // ─── LYRIC ORBIT ENGINE ───────────────────────────────────────────────────
  // This runs on every music-time event (60fps via rAF in MusicContext).
  // It calculates 3D positions in orbital space, projects them to 2D screen coords,
  // and directly mutates the DOM refs — zero React re-renders.
  useEffect(() => {
    const handleTime = (e: CustomEvent) => {
      const { time, trackId } = e.detail;
      const g = globeEl.current;
      const container = globeContainerRef.current;
      if (!g || !container) return;

      const lyrics = currentTrack.lyrics;
      if (!lyrics || lyrics.length === 0) {
        lyricRefs.current.forEach(el => { if (el) el.style.opacity = '0'; });
        return;
      }

      // Reset if track changed or time is -1
      if (trackId !== currentTrack.id || time < 0) {
        lyricRefs.current.forEach(el => { if (el) el.style.opacity = '0'; });
        return;
      }

      // Find active line
      const camera = g.camera();
      const r = g.getGlobeRadius?.() ?? 100;
      const rect = container.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      let activeIdx = lyrics.findIndex(l => time >= l.start && time <= l.end);
      if (activeIdx === -1) {
        // Between lines — find the next one
        const nextIdx = lyrics.findIndex(l => l.start > time);
        activeIdx = nextIdx === -1 ? lyrics.length - 1 : Math.max(0, nextIdx - 1);
      }

      // Render window: WINDOW_BACK before active, rest after
      const windowStart = Math.max(0, activeIdx - WINDOW_BACK);
      const windowEnd   = Math.min(lyrics.length - 1, windowStart + WINDOW_SIZE - 1);

      // Hide all lines outside the window
      lyricRefs.current.forEach((el, i) => {
        if (!el) return;
        const lineIdx = i;
        if (lineIdx < windowStart || lineIdx > windowEnd) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        }
      });

      // Position visible lines
      const visibleCount = windowEnd - windowStart + 1;
      let visibleSlot = 0;

      for (let lineIdx = windowStart; lineIdx <= windowEnd; lineIdx++) {
        const el = lyricRefs.current[lineIdx];
        if (!el) continue;

        const line = lyrics[lineIdx];
        const plane = ORBITAL_PLANES[visibleSlot % ORBITAL_PLANES.length];
        visibleSlot++;

        const isActive = lineIdx === activeIdx;

        // Orbit radius: tight around globe (1.12–1.22x)
        const orbitR = r * (isActive ? 1.22 : 1.14);

        // Calculate orbit angle:
        // Active line is pinned to front (angle = 0 → positive Z) for its duration.
        // Other lines orbit slowly.
        let angle: number;
        if (isActive) {
          // Smooth the line into the front over the first 20% of its duration
          const lineDuration = line.end - line.start;
          const lineProgress = Math.min(1, (time - line.start) / (lineDuration * 0.2));
          // ease toward Math.PI/2 (front center of orbit)
          const targetAngle = Math.PI / 2;
          const driftAngle = plane.phaseOffset + time * 0.04 * plane.direction;
          angle = driftAngle + (targetAngle - driftAngle) * lineProgress;
        } else {
          // Other lines drift slowly
          const slotOffset = (lineIdx - activeIdx) * (Math.PI / 3);
          angle = plane.phaseOffset + slotOffset + time * 0.04 * plane.direction;
        }

        // 3D position on tilted orbit
        const x3d = Math.cos(angle) * orbitR;
        const zFlat = Math.sin(angle) * orbitR;
        const y3d = zFlat * Math.sin(plane.tilt);
        const z3d = zFlat * Math.cos(plane.tilt);

        // Determine depth: positive z3d = front (camera-facing)
        const isInFront = z3d >= 0;

        // Project to screen using Three.js
        const pos = new THREE.Vector3(x3d, y3d, z3d);
        pos.project(camera);

        const screenX = (pos.x * 0.5 + 0.5) * W;
        const screenY = -(pos.y * 0.5 - 0.5) * H;

        // Skip if way off-screen
        if (screenX < -200 || screenX > W + 200 || screenY < -100 || screenY > H + 100) {
          el.style.opacity = '0';
          continue;
        }

        // ── Visual hierarchy ──────────────────────────────────────
        let opacity: number;
        let color: string;
        let fontWeight: string;
        let textShadow: string;
        let zIndex: number;

        if (isActive) {
          opacity = isInFront ? 0.95 : 0.35;
          color = '#111111';
          fontWeight = '500';
          textShadow = isInFront ? '0 1px 4px rgba(255,255,255,0.9)' : 'none';
          zIndex = isInFront ? 30 : 8;
        } else {
          // Fade by distance from active (before = slightly lighter)
          const dist = Math.abs(lineIdx - activeIdx);
          opacity = isInFront
            ? (dist === 1 ? 0.32 : 0.18)
            : (dist === 1 ? 0.12 : 0.07);
          color = '#888888';
          fontWeight = '350';
          textShadow = 'none';
          zIndex = isInFront ? 25 : 5;
        }

        // Fade out lines that are too far left (protect the UI column)
        const leftGuard = Math.max(0, Math.min(1, (screenX - 60) / 120));
        opacity *= leftGuard;

        // Apply to DOM directly
        el.style.opacity = opacity.toString();
        el.style.color = color;
        el.style.fontWeight = fontWeight;
        el.style.textShadow = textShadow;
        el.style.zIndex = zIndex.toString();
        el.style.transform = `translate(${screenX}px, ${screenY}px) translate(-50%, -50%)`;
        el.style.pointerEvents = 'none';

        // ── Word highlighting ─────────────────────────────────────
        if (isActive && isInFront && line.words?.length) {
          const wordSpans = el.querySelectorAll<HTMLSpanElement>('[data-word]');
          wordSpans.forEach((span, wi) => {
            const word = line.words[wi];
            if (!word) return;
            const isCurrentWord = time >= word.start && time <= word.end;
            span.style.color = isCurrentWord ? '#000000' : '#333333';
            span.style.fontWeight = isCurrentWord ? '650' : '500';
          });
        }
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

  return (
    <section className="fixed inset-0 bg-white text-black overflow-hidden flex">

      {/* ── BACKGROUND GRATICULE ────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{ stroke: 'rgba(0,0,0,0.04)', strokeWidth: 1, fill: 'none' }}
      >
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

      {/* ── LEFT UI COLUMN ──────────────────────────────────────────────── */}
      <div className="relative z-50 w-[44vw] md:w-[38vw] lg:w-[36vw] max-w-[540px] flex-shrink-0 flex flex-col justify-center pl-[8vw] pr-6 pointer-events-none">
        <h1 className="font-bold mb-10 sm:mb-16 text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-[#111] pointer-events-auto whitespace-nowrap">
          {siteConfig.siteName}
        </h1>
        <ul className="flex flex-col gap-2 text-xl md:text-2xl lg:text-3xl font-sans pointer-events-auto">
          {locations.map(album => (
            <li
              key={album.id}
              className="group"
              onMouseEnter={() => handleMouseEnter(album)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={`/places/${album.slug}`}
                className="text-[#555] hover:text-[#000] transition-colors relative inline-block"
              >
                {album.title}
                <span className="absolute left-0 -bottom-px w-0 h-px bg-red-600 transition-all group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ── GLOBE + LYRIC ORBIT SCENE ──────────────────────────────────── */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ left: '28vw' }}>
        <div ref={globeContainerRef} className="absolute inset-0">

          {/* Globe canvas — z-index 20 (sandwiched between lyric layers) */}
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

          {/* DOM Billboard Lyrics — positioned by the orbit engine above */}
          {currentTrack.lyrics.map((line, i) => (
            <div
              key={`${currentTrack.id}-${i}`}
              ref={el => { lyricRefs.current[i] = el; }}
              className="absolute left-0 top-0 will-change-transform pointer-events-none select-none"
              style={{
                opacity: 0,
                fontSize: 'clamp(14px, 1.5vw, 24px)',
                fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.25s ease, color 0.2s ease',
              }}
            >
              {line.words.map((word, wi) => (
                <React.Fragment key={wi}>
                  <span
                    data-word
                    style={{ transition: 'color 0.1s, font-weight 0.1s' }}
                  >
                    {word.text}
                  </span>
                  {wi < line.words.length - 1 && ' '}
                </React.Fragment>
              ))}
            </div>
          ))}

        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="absolute bottom-8 right-8 md:bottom-12 md:right-[5vw] z-50 pointer-events-none text-[#999] font-sans text-xs tracking-widest">
        &copy; {new Date().getFullYear()}
      </footer>

    </section>
  );
}
