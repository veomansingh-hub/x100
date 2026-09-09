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
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 800 });
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [rings, setRings] = useState<any[]>([]);
  const [arcs, setArcs] = useState<any[]>([]);

  const locations = albums.filter(a => a.type === 'location' && a.lat && a.lng);

  // Measure container for accurate Three.js projection
  useEffect(() => {
    if (!globeContainerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setGlobeSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(globeContainerRef.current);
    return () => obs.disconnect();
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

    // Foggy inner sphere for true depth occlusion
    const innerGeo = new THREE.SphereGeometry(radius - 0.5, 64, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.9,
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

  // Synchronized DOM Projection Engine
  useEffect(() => {
    let animationFrameId: number;
    const handleTime = (e: any) => {
      const t = e.detail;
      const g = globeEl.current;
      const container = globeContainerRef.current;
      if (!g || !container) return;

      const camera = g.camera();
      const r = g.getGlobeRadius();
      const { width, height } = container.getBoundingClientRect();

      let activeIdx = LYRIC_LINES.findIndex(l => t >= l.time && t <= l.time + l.duration);
      if (activeIdx === -1) {
        activeIdx = LYRIC_LINES.findIndex(l => l.time > t);
        if (activeIdx === -1) activeIdx = LYRIC_LINES.length - 1;
      }

      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const line = LYRIC_LINES[i];
        const distance = Math.abs(i - activeIdx);
        
        // Render only a tight window of 3-5 lines
        if (distance > 2) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }

        const midTime = line.time + line.duration / 2;
        const orbitIndex = i % 3;
        // Gentle orbital planes
        const tilt = [25, 35, 45][orbitIndex] * (Math.PI / 180);
        const direction = orbitIndex % 2 === 0 ? 1 : -1;
        
        // At exactly midTime, angle = Math.PI/2 (front center)
        const angle = Math.PI/2 + (t - midTime) * 0.15 * direction;
        
        const bulge = Math.max(0, 1 - Math.abs(t - midTime)/6);
        const radius = r * (1.15 + bulge * 0.12); 
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const y3d = -z * Math.sin(tilt) + (orbitIndex - 1) * (r * 0.25);
        const z3d = z * Math.cos(tilt);
        
        const pos = new THREE.Vector3(x, y3d, z3d);
        pos.project(camera);
        
        const screenX = (pos.x * 0.5 + 0.5) * width;
        const screenY = -(pos.y * 0.5 - 0.5) * height;
        
        const isBack = z3d < 0;
        let opacity = isBack ? 0.15 : 0.35;
        let color = '#b8b8b8';
        let fontWeight = 350;
        let zIndex = isBack ? 5 : 30; // 5 goes behind WebGL canvas
        
        let lineProgress = 0;
        if (t >= line.time && t <= line.time + line.duration) {
          lineProgress = 1;
        } else if (t >= line.time - 0.5 && t < line.time) {
          lineProgress = (t - (line.time - 0.5)) / 0.5;
        } else if (t > line.time + line.duration && t <= line.time + line.duration + 0.5) {
          lineProgress = 1 - (t - (line.time + line.duration)) / 0.5;
        }
        
        if (lineProgress > 0) {
          color = '#111111';
          fontWeight = 550;
          opacity = opacity + (1 - opacity) * lineProgress;
        }
        
        // Left UI clipping protection
        let fadeLeft = 1;
        if (screenX < width * 0.15) {
           fadeLeft = Math.max(0, (screenX) / (width * 0.15));
        }
        opacity *= fadeLeft;

        el.style.opacity = opacity.toString();
        el.style.color = color;
        el.style.fontWeight = fontWeight.toString();
        el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`;
        el.style.zIndex = zIndex.toString();
      });
    };
    
    window.addEventListener('music-time', handleTime);
    return () => window.removeEventListener('music-time', handleTime);
  }, []);

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
    <section className="fixed inset-0 bg-white text-black overflow-hidden selection:bg-black selection:text-white flex flex-col md:flex-row">
      
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

      {/* LEFT STABLE UI COLUMN */}
      <div className="absolute inset-0 md:relative md:w-[45vw] lg:w-[40vw] max-w-[600px] h-full z-50 flex flex-col justify-center px-8 md:pl-[8vw] md:pr-8 pointer-events-none">
        <h1 className="font-bold mb-12 sm:mb-20 text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-[#111] drop-shadow-sm pointer-events-auto whitespace-nowrap">
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

      {/* CENTER/RIGHT GLOBE SCENE */}
      <div className="absolute inset-0 md:left-[30vw] h-full z-10 pointer-events-none">
        <div ref={globeContainerRef} className="absolute inset-0 pointer-events-auto">
          
          {/* GLOBE CANVAS */}
          <div className="absolute inset-0" style={{ zIndex: 20 }}>
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
            )}
          </div>

          {/* PROJECTED BILLBOARD LYRICS */}
          {LYRIC_LINES.map((line, i) => (
            <div 
              key={i}
              ref={el => { lineRefs.current[i] = el; }}
              className="absolute left-0 top-0 font-serif tracking-wide whitespace-nowrap will-change-transform pointer-events-none"
              style={{ 
                fontSize: 'clamp(16px, 1.8vw, 26px)',
                textShadow: '0 0 3px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.5)',
                transition: 'opacity 0.2s, color 0.2s, font-weight 0.2s',
                opacity: 0,
                zIndex: 5
              }}
            >
              {line.text}
            </div>
          ))}
          
        </div>
      </div>

      <footer className="absolute bottom-8 right-8 md:bottom-12 md:right-[6vw] z-50 pointer-events-none text-[#555] font-sans text-sm md:text-base tracking-widest uppercase">
        <p className="m-0 p-0">&copy; {new Date().getFullYear()}</p>
      </footer>
    </section>
  );
}
