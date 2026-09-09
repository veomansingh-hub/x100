'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import GlobeGL, { GlobeMethods } from 'react-globe.gl';
import * as topojson from 'topojson-client';
import { Album } from '@/data/albums';
import { siteConfig } from '@/data/config';
import Link from 'next/link';
import { LYRIC_LINES } from './BackgroundMusic';

export default function Globe({ albums }: { albums: Album[] }) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1000 
  });
  
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [rings, setRings] = useState<any[]>([]);
  const [arcs, setArcs] = useState<any[]>([]);
  
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);

  const locations = albums.filter(a => a.type === 'location' && a.lat && a.lng);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    import('@/data/land-110m.json').then((topo: any) => {
      const data = topo.default || topo;
      const polygons = (topojson.feature(data, data.objects.land as any) as any).features;
      setLandPolygons(polygons);
    }).catch(e => console.error("TopoJSON error:", e));

    const newArcs = [];
    for (let i = 0; i < locations.length - 1; i++) {
      newArcs.push({
        startLat: locations[i].lat!,
        startLng: locations[i].lng!,
        endLat: locations[i+1].lat!,
        endLng: locations[i+1].lng!,
        color: ['#cc0000', '#ff0000']
      });
    }
    setArcs(newArcs);
  }, [albums]);

  const polygonMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffffff',
    opacity: 0.8,
    transparent: true,
    depthWrite: false
  }), []);

  useEffect(() => {
    if (!globeEl.current) return;
    const g = globeEl.current;
    
    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.5;
    g.controls().enableDamping = true;
    g.controls().dampingFactor = 0.05;
    g.controls().enableZoom = false;
    
    g.pointOfView({ lat: 20, lng: 70, altitude: 2.2 });

    const scene = g.scene();
    const radius = g.getGlobeRadius();

    const innerGeo = new THREE.SphereGeometry(radius - 0.5, 64, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.85,
      transparent: true,
      depthWrite: false
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerSphere);

    return () => {
      scene.remove(innerSphere);
      innerGeo.dispose();
      innerMat.dispose();
    };
  }, [globeEl.current]);

  const wordsData = useMemo(() => {
    const data: { word: string; line: any; lineIdx: number; wIdx: number; totalWords: number }[] = [];
    LYRIC_LINES.forEach((line, lineIdx) => {
      const words = line.text.split(' ');
      words.forEach((word, wIdx) => {
        data.push({ word, line, lineIdx, wIdx, totalWords: words.length });
      });
    });
    return data;
  }, []);

  useEffect(() => {
    const handleTime = (e: any) => {
      const t = e.detail;
      const isMobile = window.innerWidth < 768;
      const baseRadius = isMobile ? 180 : 360; 
      
      wordsData.forEach((d, i) => {
        const el = wordRefs.current[i];
        if (!el) return;
        
        const midTime = d.line.start + d.line.duration / 2;
        const speed = 0.15; 
        
        const orbitIndex = d.lineIdx % 5;
        const tiltX = (35 + (orbitIndex % 3) * 10) * (Math.PI / 180);
        const direction = orbitIndex % 2 === 0 ? 1 : -1;
        
        let lineProgress = 0;
        if (t >= d.line.start - 0.5 && t <= d.line.end + 0.5) {
          if (t < d.line.start) lineProgress = (t - (d.line.start - 0.5)) / 0.5;
          else if (t > d.line.end) lineProgress = 1 - (t - d.line.end) / 0.5;
          else lineProgress = 1;
        }
        
        const bulge = Math.max(0, 1 - Math.abs(t - midTime) / 6);
        const radius = baseRadius + orbitIndex * (isMobile ? 15 : 25) + bulge * (isMobile ? 30 : 50);
        
        const wordOffset = (d.wIdx - d.totalWords / 2) * (isMobile ? 0.35 : 0.25); 
        const angle = Math.PI / 2 + (t - midTime) * speed * direction + wordOffset;
        
        let x = Math.cos(angle) * radius;
        let z = Math.sin(angle) * radius;
        
        let yRot = -z * Math.sin(tiltX) + (orbitIndex - 2) * (isMobile ? 20 : 40);
        let zRot = z * Math.cos(tiltX);
        
        let opacity = zRot > 0 ? 0.45 : 0.15;
        let color = '#b8b8b8';
        let fontWeight = 300;
        let textShadow = 'none';
        
        if (lineProgress > 0) {
          color = '#111111';
          fontWeight = 450;
          opacity = (zRot > 0 ? 0.45 : 0.15) + (1 - (zRot > 0 ? 0.45 : 0.15)) * lineProgress;
          textShadow = `0 0 3px rgba(255,255,255,${0.95 * lineProgress}), 0 0 15px rgba(255,255,255,${0.6 * lineProgress})`;
        }

        const wordDur = d.line.duration / d.totalWords;
        const wordStart = d.line.start + d.wIdx * wordDur;
        if (t >= wordStart && t < wordStart + wordDur) {
           fontWeight = 550;
           color = '#000000';
        }
        
        el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${yRot}px, ${zRot}px)`;
        el.style.opacity = opacity.toString();
        el.style.color = color;
        el.style.fontWeight = fontWeight.toString();
        el.style.textShadow = textShadow;
        el.style.zIndex = zRot > 0 ? '30' : '5'; 
      });
    };
    
    window.addEventListener('music-time', handleTime);
    return () => window.removeEventListener('music-time', handleTime);
  }, [wordsData]);

  const handleMouseEnter = (album: Album) => {
    setActiveAlbumId(album.id);
    if (globeEl.current && album.lat && album.lng) {
      globeEl.current.pointOfView({ lat: album.lat, lng: album.lng, altitude: 1.5 }, 1000);
      setRings([{ lat: album.lat, lng: album.lng, maxR: 6, propagationSpeed: 1.2, repeatPeriod: 1500 }]);
    }
  };

  const handleMouseLeave = () => {
    setActiveAlbumId(null);
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: 70, altitude: 2.2 }, 1000);
      setRings([]);
    }
  };

  const colorInterpolator = (t: number) => `rgba(204,0,0,${Math.sqrt(1 - t)})`;

  return (
    <section className="fixed inset-0 bg-white text-black overflow-hidden selection:bg-black selection:text-white">
      
      {/* BACKGROUND PROJECTION GRID */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ stroke: 'rgba(0,0,0,0.04)', strokeWidth: 1, fill: 'none' }}>
        <ellipse cx="50%" cy="50%" rx="48%" ry="100%" />
        <ellipse cx="50%" cy="50%" rx="36%" ry="100%" />
        <ellipse cx="50%" cy="50%" rx="24%" ry="100%" />
        <ellipse cx="50%" cy="50%" rx="12%" ry="100%" />
        <line x1="0" y1="50%" x2="100%" y2="50%" />
        <line x1="0" y1="35%" x2="100%" y2="35%" />
        <line x1="0" y1="65%" x2="100%" y2="65%" />
        <line x1="0" y1="20%" x2="100%" y2="20%" />
        <line x1="0" y1="80%" x2="100%" y2="80%" />
        <circle cx="20%" cy="30%" r="1" fill="rgba(0,0,0,0.1)" stroke="none" />
        <circle cx="80%" cy="70%" r="1" fill="rgba(0,0,0,0.1)" stroke="none" />
        <circle cx="70%" cy="20%" r="1" fill="rgba(0,0,0,0.1)" stroke="none" />
      </svg>

      {/* 3D SCENE CONTAINER (GLOBE + LYRICS) */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}>
        
        {/* DOM LYRICS BILLBOARDS */}
        <div className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[5vw]">
          <div className="relative w-0 h-0" style={{ transformStyle: 'preserve-3d' }}>
            {wordsData.map((d, i) => (
              <div 
                key={`${d.lineIdx}-${d.wIdx}`}
                ref={el => { wordRefs.current[i] = el; }}
                className="absolute font-serif tracking-[0.04em] whitespace-nowrap will-change-transform"
                style={{ 
                  fontSize: 'clamp(15px, 1.6vw, 28px)',
                  transition: 'opacity 0.2s linear, color 0.2s linear, text-shadow 0.2s linear',
                  opacity: 0,
                  zIndex: 5,
                  // We remove left-1/2 top-1/2 because the parent is 0x0 centered,
                  // so the translate(-50%, -50%) will perfectly center it on the globe!
                }}
              >
                {d.word}
              </div>
            ))}
          </div>
        </div>

        {/* GLOBE CANVAS (Sandwiched between z-index 5 and 30) */}
        <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 20 }}>
          <div className="flex items-center justify-center lg:justify-end lg:pr-[5vw] h-full w-full">
            <GlobeGL
              ref={globeEl as any}
              width={windowSize.width}
              height={windowSize.height}
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
              polygonSideColor={() => 'rgba(255, 255, 255, 0)'}
              polygonStrokeColor={() => '#444'}
              pointsData={locations.map(a => ({ lat: a.lat!, lng: a.lng!, radius: 0.15, album: a }))}
              pointColor={() => '#cc0000'}
              pointAltitude={0.01}
              pointRadius={point => (point as { radius: number }).radius}
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
          </div>
        </div>
      </div>
      
      {/* UI CONTENT LAYER */}
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <h1 className="font-bold mb-12 sm:mb-20 text-3xl md:text-5xl lg:text-6xl font-serif tracking-tight text-[#111] drop-shadow-sm">
          {siteConfig.siteName}
        </h1>

        <ul className="flex flex-col items-start tracking-tight text-xl md:text-3xl lg:text-4xl font-sans pointer-events-auto gap-2">
          {locations.map(album => (
            <li
              key={album.id}
              className="max-w-fit group flex items-center gap-4"
              onMouseEnter={() => handleMouseEnter(album)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={`/places/${album.slug}`}
                className="text-[#555] hover:text-[#000] transition-colors relative"
              >
                {album.title}
                <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-red-600 transition-all group-hover:w-full"></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <footer className="absolute bottom-8 right-8 md:bottom-16 md:right-16 z-30 pointer-events-none text-[#555] font-sans text-sm md:text-base tracking-widest uppercase">
        <p className="m-0 p-0">&copy; {new Date().getFullYear()}</p>
      </footer>
    </section>
  );
}
