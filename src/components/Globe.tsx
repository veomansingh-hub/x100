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

// ─── SVG ring helpers ─────────────────────────────────────────────────────────
function ringPath(cx: number, cy: number, r: number) {
  const top = cy - r;
  return `M ${cx},${top} A ${r},${r} 0 1,1 ${cx - 0.001},${top} Z`;
}

const SEP    = '    ·    ';
const CHAR_W = 11.5;

// ─── Component ────────────────────────────────────────────────────────────────
export default function GlobeComponent({ albums }: { albums: Album[] }) {
  const { tracks, currentTrack, isPlaying, switchTrack, togglePlay } = useMusicContext();

  const globeEl      = useRef<any>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const textPathRef  = useRef<SVGTextPathElement>(null);

  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [globeSize, setGlobeSize]       = useState({ width: 0, height: 0 });
  const [rings, setRings]               = useState<any[]>([]);
  const [arcs, setArcs]                 = useState<any[]>([]);
  const [ringGeom, setRingGeom]         = useState({ cx: 0, cy: 0, r: 0 });
  const [isMobile, setIsMobile]         = useState(false);

  const locations = albums.filter(a => a.type === 'location' && a.lat && a.lng);

  // ─── Detect mobile ──────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ─── Resize observer on globe container ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries)
        setGlobeSize({ width: e.contentRect.width, height: e.contentRect.height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ─── Load geo data ───────────────────────────────────────────────────────
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

  // ─── Compute ring geometry from Three.js camera ───────────────────────────
  useEffect(() => {
    const compute = () => {
      if (!globeEl.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const cam = globeEl.current.camera();
      const c3 = new THREE.Vector3(0, 0, 0).project(cam);
      const cx = (c3.x * 0.5 + 0.5) * W;
      const cy = -(c3.y * 0.5 - 0.5) * H;
      const e3 = new THREE.Vector3(100, 0, 0).project(cam);
      const ex = (e3.x * 0.5 + 0.5) * W;
      setRingGeom({ cx, cy, r: Math.abs(ex - cx) * 1.16 });
    };
    const id  = setInterval(compute, 400);
    const tid = setTimeout(compute, 800);
    return () => { clearInterval(id); clearTimeout(tid); };
  }, [globeSize]);

  // ─── LYRIC RING ENGINE ────────────────────────────────────────────────────
  const offsetRef    = useRef(0);
  const targetOffset = useRef(0);
  const rafRef       = useRef<number | null>(null);

  const animateOffset = useCallback(() => {
    const diff = targetOffset.current - offsetRef.current;
    if (Math.abs(diff) > 0.02) {
      offsetRef.current += diff * 0.12;
      textPathRef.current?.setAttribute('startOffset', `${offsetRef.current.toFixed(2)}%`);
      rafRef.current = requestAnimationFrame(animateOffset);
    } else {
      offsetRef.current = targetOffset.current;
      textPathRef.current?.setAttribute('startOffset', `${offsetRef.current.toFixed(2)}%`);
    }
  }, []);

  useEffect(() => {
    const lyrics = currentTrack.lyrics;
    const handleTime = (e: CustomEvent) => {
      const { time, trackId } = e.detail;
      const tp = textPathRef.current;
      if (!tp || !lyrics?.length) return;
      if (trackId !== currentTrack.id || time < 0) { tp.innerHTML = ''; return; }

      let activeIdx = lyrics.findIndex(l => time >= l.start && time <= l.end);
      if (activeIdx === -1) {
        const next = lyrics.findIndex(l => l.start > time);
        activeIdx = next === -1 ? lyrics.length - 1 : Math.max(0, next - 1);
      }

      const r = ringGeom.r || 300;
      const circum = 2 * Math.PI * r;
      const charsInRing = circum / CHAR_W;
      const windowHalf  = Math.max(3, Math.floor((charsInRing * 0.9) / 2 / 28));
      const winStart = Math.max(0, activeIdx - windowHalf);
      const winEnd   = Math.min(lyrics.length - 1, activeIdx + windowHalf);

      let html = '';
      let totalChars = 0;
      let activeCharStart = 0;
      let activeCharEnd   = 0;

      for (let i = winStart; i <= winEnd; i++) {
        const line     = lyrics[i];
        const isActive = i === activeIdx;
        if (isActive) activeCharStart = totalChars;

        if (isActive && line.words?.length) {
          for (const w of line.words) {
            const isCurrent = time >= w.start && time <= w.end;
            const fill   = isCurrent ? '#000' : '#1a1a1a';
            const weight = isCurrent ? 700 : 450;
            html += `<tspan fill="${fill}" font-weight="${weight}">${escXml(w.text)} </tspan>`;
            totalChars += w.text.length + 1;
          }
        } else {
          const op = Math.max(0.07, 0.26 - Math.abs(i - activeIdx) * 0.06);
          html += `<tspan fill="rgba(0,0,0,${op.toFixed(2)})">${escXml(line.text)}</tspan>`;
          totalChars += line.text.length;
        }

        if (isActive) activeCharEnd = totalChars;
        html += `<tspan fill="rgba(0,0,0,0.07)">${escXml(SEP)}</tspan>`;
        totalChars += SEP.length;
      }

      tp.innerHTML = html;

      const activeMid = (activeCharStart + activeCharEnd) / 2;
      const newTarget = -(activeMid / totalChars) * 100;
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

  // ─── Music button click ───────────────────────────────────────────────────
  const handleMusicClick = (trackId: string) => {
    if (trackId === currentTrack.id) togglePlay();
    else switchTrack(trackId);
  };

  // ─── Globe canvas + lyric ring (shared between mobile and desktop) ────────
  const globeAndRing = (
    <div ref={containerRef} className="relative w-full h-full">
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

      {/* Lyric Ring SVG */}
      {ringGeom.r > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={globeSize.width}
          height={globeSize.height}
          style={{ zIndex: 25, overflow: 'visible' }}
        >
          <defs>
            <path id="lyric-ring-path" d={ringPath(ringGeom.cx, ringGeom.cy, ringGeom.r)} />
          </defs>
          <circle cx={ringGeom.cx} cy={ringGeom.cy} r={ringGeom.r}
            fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={1} />
          <text style={{
            fontFamily: 'ui-serif, Georgia, "Palatino Linotype", serif',
            fontSize: isMobile ? '13px' : 'clamp(13px, 1.4vw, 21px)',
            letterSpacing: '0.03em',
          }}>
            <textPath ref={textPathRef} href="#lyric-ring-path" startOffset="0%" />
          </text>
        </svg>
      )}
    </div>
  );

  // ─── Music buttons (reusable) ─────────────────────────────────────────────
  const musicButtons = (
    <div className={isMobile
      ? 'flex flex-col gap-2'
      : 'hidden'
    }>
      {tracks.map(track => {
        const isActive  = currentTrack.id === track.id;
        const isPlaying_ = isActive && isPlaying;
        return (
          <button
            key={track.id}
            onClick={() => handleMusicClick(track.id)}
            className="flex items-center gap-2 text-left group"
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 border transition-all ${
              isPlaying_ ? 'bg-black border-black' :
              isActive   ? 'bg-white border-black' :
                           'bg-white border-black/20'
            }`} />
            <span
              className="font-sans uppercase tracking-widest select-none transition-colors"
              style={{
                fontSize: '10px',
                color: isActive ? '#111' : '#aaa',
                fontWeight: isActive ? 500 : 300,
              }}
            >
              {isPlaying_ ? `▶ ${track.title}` : track.title}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">

        {/* Background graticule */}
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-0"
          style={{ stroke: 'rgba(0,0,0,0.04)', strokeWidth: 1, fill: 'none' }}>
          <ellipse cx="50%" cy="50%" rx="48%" ry="100%" />
          <ellipse cx="50%" cy="50%" rx="30%" ry="100%" />
          <line x1="0" y1="30%" x2="100%" y2="30%" />
          <line x1="0" y1="50%" x2="100%" y2="50%" />
          <line x1="0" y1="70%" x2="100%" y2="70%" />
        </svg>

        {/* ── NAME + SUBTITLE ── */}
        <div className="relative z-10 px-6 pt-10 pb-2">
          <h1 className="font-serif font-bold text-[2.4rem] leading-tight tracking-tight text-[#111]">
            Man Singh Gurjar
          </h1>
          <p className="text-sm tracking-[0.2em] uppercase text-[#888] mt-1 font-sans">
            A Head Full of Dreams
          </p>
        </div>

        {/* ── GLOBE ROW: music left + globe right ── */}
        <div className="relative z-10 flex items-stretch" style={{ height: '72vw' }}>

          {/* Music buttons — left of globe */}
          <div className="flex-shrink-0 flex flex-col justify-center gap-3 pl-6 pr-3"
               style={{ width: '28vw' }}>
            {tracks.map(track => {
              const isActive   = currentTrack.id === track.id;
              const isPlaying_ = isActive && isPlaying;
              return (
                <button
                  key={track.id}
                  onClick={() => handleMusicClick(track.id)}
                  className="flex items-center gap-1.5 text-left"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 border transition-all ${
                    isPlaying_ ? 'bg-black border-black' :
                    isActive   ? 'bg-white border-black' :
                                 'bg-white border-black/20'
                  }`} />
                  <span className="font-sans uppercase select-none transition-colors leading-tight"
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      color: isActive ? '#111' : '#bbb',
                      fontWeight: isActive ? 500 : 300,
                    }}>
                    {isPlaying_ && <span className="mr-0.5">▶</span>}
                    {track.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Globe — fills remaining width */}
          <div className="flex-1 relative">
            {globeAndRing}
          </div>
        </div>

        {/* ── ALBUM LIST ── */}
        <div className="relative z-10 px-6 pt-4 pb-24">
          <ul className="flex flex-col gap-3">
            {locations.map(album => (
              <li key={album.id}>
                <Link
                  href={`/places/${album.slug}`}
                  className="text-[#555] hover:text-black transition-colors text-lg font-sans
                             flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-red-600 transition-all group-hover:w-3" />
                  {album.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="fixed bottom-3 right-4 z-50 text-[#bbb] text-[10px] tracking-widest font-sans pointer-events-none">
          &copy; {new Date().getFullYear()}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
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
      <div className="relative z-50 w-[44vw] md:w-[38vw] lg:w-[36vw] max-w-[540px]
                      flex-shrink-0 flex flex-col justify-center pl-[8vw] pr-6 pointer-events-none">
        <div className="mb-10 sm:mb-14">
          <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight
                         text-[#111] pointer-events-auto whitespace-nowrap">
            {siteConfig.siteName}
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase text-[#999] mt-2 font-sans pointer-events-auto">
            A Head Full of Dreams
          </p>
        </div>
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
        {globeAndRing}
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-8 right-8 md:bottom-12 md:right-[5vw] z-50
                         pointer-events-none text-[#999] font-sans text-xs tracking-widest">
        &copy; {new Date().getFullYear()}
      </footer>
    </section>
  );
}

function escXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
