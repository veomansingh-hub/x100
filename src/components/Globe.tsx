'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import GlobeGL, { GlobeMethods } from 'react-globe.gl';
import * as topojson from 'topojson-client';
import { Album } from '@/data/albums';
import { siteConfig } from '@/data/config';
import Link from 'next/link';
import { LYRIC_LINES } from './BackgroundMusic';

const createLyricTexture = (text: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(255,255,255,0)';
  ctx.fillRect(0,0,2048,128);
  ctx.fillStyle = '#ffffff'; // White base so we can tint it with material.color
  // Elegant editorial serif font
  ctx.font = '300 54px ui-serif, Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Attempt standard letter spacing hack by just using wide text or relying on font
  ctx.fillText(text.split('').join(String.fromCharCode(8202)), 1024, 64);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
};

export default function Globe({ albums }: { albums: Album[] }) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1000 
  });
  
  // States
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [rings, setRings] = useState<any[]>([]);
  const [arcs, setArcs] = useState<any[]>([]);
  const lyricMeshesRef = useRef<any[]>([]);

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

    // Generate real travel routes from locations
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
    
    // Smooth slow automatic rotation (inertia)
    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.5;
    g.controls().enableDamping = true;
    g.controls().dampingFactor = 0.05;
    g.controls().enableZoom = false;
    
    // Position to show full globe beautifully
    g.pointOfView({ lat: 20, lng: 70, altitude: 2.2 });

    const scene = g.scene();
    const radius = g.getGlobeRadius();

    // 1. Faint inner sphere to softly occlude backside
    const innerGeo = new THREE.SphereGeometry(radius - 0.5, 64, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.9,
      transparent: true,
      depthWrite: false
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerSphere);

    // 2. Build Lyric Rings in 3D
    lyricMeshesRef.current.forEach(l => {
      scene.remove(l.mesh);
      l.mesh.geometry.dispose();
      l.mesh.material.map.dispose();
      l.mesh.material.dispose();
    });
    lyricMeshesRef.current = [];

    LYRIC_LINES.forEach((line, i) => {
      const tex = createLyricTexture(line.text);
      // Saturn-like orbital system: vary radii and tilts
      const ringRadius = radius + 15 + (i % 6) * 12; 
      const geo = new THREE.CylinderGeometry(ringRadius, ringRadius, 6, 64, 1, true);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.2, // Default faint
        color: 0xbcbcbc, // Default pale grey
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      
      // Random tilts
      mesh.rotation.x = Math.PI / 2 * 0.2 + (i % 4) * 0.1;
      mesh.rotation.z = (i % 3) * 0.1;
      // Spread them around
      mesh.rotation.y = (Math.PI * 2 / LYRIC_LINES.length) * i;
      
      scene.add(mesh);
      
      lyricMeshesRef.current.push({
        start: line.time,
        end: line.time + line.duration,
        mesh,
        speed: 0.0005 + (i % 3) * 0.0002
      });
    });

    return () => {
      scene.remove(innerSphere);
      innerGeo.dispose();
      innerMat.dispose();
    };
  }, [globeEl.current]);

  // Sync lyrics via event listener from BackgroundMusic
  useEffect(() => {
    const handleTime = (e: any) => {
      const t = e.detail;
      lyricMeshesRef.current.forEach(l => {
        // Continuous slow orbit
        l.mesh.rotation.y += l.speed;

        if (t >= l.start && t <= l.end) {
          const p = (t - l.start) / (l.end - l.start);
          let intensity = 1;
          if (p < 0.2) intensity = p / 0.2;
          else if (p > 0.8) intensity = (1 - p) / 0.2;

          l.mesh.material.opacity = 0.2 + 0.8 * intensity; // 0.2 -> 1.0
          
          // Interpolate color from pale #bcbcbc (188,188,188) to dark #111111 (17,17,17)
          const c = 188 - intensity * (188 - 17);
          l.mesh.material.color.setRGB(c/255, c/255, c/255);
        } else {
          l.mesh.material.opacity = 0.2;
          l.mesh.material.color.setHex(0xbcbcbc);
        }
      });
    };
    
    window.addEventListener('music-time', handleTime);
    return () => {
      window.removeEventListener('music-time', handleTime);
    };
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
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

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
        {/* Subtle specks */}
        <circle cx="20%" cy="30%" r="1" fill="rgba(0,0,0,0.1)" stroke="none" />
        <circle cx="80%" cy="70%" r="1" fill="rgba(0,0,0,0.1)" stroke="none" />
        <circle cx="70%" cy="20%" r="1" fill="rgba(0,0,0,0.1)" stroke="none" />
      </svg>

      {/* GLOBE CANVAS LAYER */}
      <div className="absolute inset-0 z-10 flex items-center justify-center lg:justify-end lg:pr-[5vw]">
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
      
      {/* UI CONTENT LAYER */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center px-8 md:px-16 lg:px-24">
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

      <footer className="absolute bottom-8 right-8 md:bottom-16 md:right-16 z-20 pointer-events-none text-[#555] font-sans text-sm md:text-base tracking-widest uppercase">
        <p className="m-0 p-0">&copy; {new Date().getFullYear()}</p>
      </footer>
    </section>
  );
}
