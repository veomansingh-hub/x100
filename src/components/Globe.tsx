'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import GlobeGL, { GlobeMethods } from 'react-globe.gl';
import * as topojson from 'topojson-client';
import { Album } from '@/data/albums';
import { siteConfig } from '@/data/config';
import Link from 'next/link';

export default function Globe({ albums }: { albums: Album[] }) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1000 
  });
  
  // States
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [pointAltitude, setPointAltitude] = useState(0.002);
  const [rings, setRings] = useState<any[]>([]);
  const [arcs, setArcs] = useState<any[]>([]);

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

    // Generate arcs
    const newArcs = [];
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        newArcs.push({
          startLat: locations[i].lat!,
          startLng: locations[i].lng!,
          endLat: locations[j].lat!,
          endLng: locations[j].lng!,
          color: ['#ff0000', '#ff0000']
        });
      }
    }
    setArcs(newArcs);
  }, [albums]);

  const polygonMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffffff',
    opacity: 0.77,
    transparent: true
  }), []);

  useEffect(() => {
    if (globeEl.current) {
      // Small timeout ensures methods are fully initialized
      setTimeout(() => {
        if (!globeEl.current) return;
        try {
          globeEl.current.controls().autoRotate = true;
          globeEl.current.controls().autoRotateSpeed = 1.75;
          globeEl.current.controls().enableZoom = false;
          globeEl.current.pointOfView({ lat: 30, lng: -30, altitude: 2 });
          
          const scene = globeEl.current.scene();
          const radius = globeEl.current.getGlobeRadius();
          
          const innerSphereGeometry = new THREE.SphereGeometry(
            radius - 1, 
            64,
            32
          );
          const innerSphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.95,
            transparent: true
          });
          const innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);
          innerSphere.renderOrder = -1;
          scene.add(innerSphere);
        } catch (e) {
          console.error("Globe initialization error:", e);
        }
      }, 100);
    }
  }, [globeEl.current]);

  const points = locations.map(a => ({
    lat: a.lat!,
    lng: a.lng!,
    radius: 0.19,
    album: a
  }));

  const handleMouseEnter = (album: Album) => {
    setActiveAlbumId(album.id);
    if (globeEl.current && album.lat && album.lng) {
      globeEl.current.pointOfView({ lat: album.lat, lng: album.lng, altitude: 1 }, 1000);
      (globeEl.current.controls() as any).autoRotateSpeed = 0.69;
      
      setRings([{ lat: album.lat, lng: album.lng, maxR: 9, propagationSpeed: 0.88, repeatPeriod: 1777 }]);
    }
  };

  const handleMouseLeave = () => {
    setActiveAlbumId(null);
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 30, lng: -30, altitude: 2 }, 1000);
      (globeEl.current.controls() as any).autoRotateSpeed = 1.75;
      setRings([]);
    }
  };

  const colorInterpolator = (t: number) => `rgba(255,100,50,${Math.sqrt(1 - t)})`;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  return (
    <section className="globe-container py-36 sm:py-36 md:py-32 md:px-24 lg:py-40 lg:px-36 xl:py-48 xl:px-48 2xl:px-64 3xl:py-56 text-black relative">
      <GlobeGL
        ref={globeEl as any}
        width={windowSize.width}
        height={windowSize.height}
          rendererConfig={{ antialias: true }}
          animateIn={false}
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="rgba(255, 255, 255, 1)"
          showGlobe={false}
          showAtmosphere={false}
          showGraticules={false}
          polygonsData={landPolygons}
          polygonCapMaterial={polygonMaterial}
          polygonsTransitionDuration={0}
          polygonAltitude={() => 0}
          polygonSideColor={() => 'rgba(255, 255, 255, 0)'}
          polygonStrokeColor={() => isMac ? 'black' : 'darkslategray'}
          pointsData={points}
          pointColor={() => 'rgba(255, 0, 0, 0.75)'}
          pointAltitude={pointAltitude}
          pointRadius={point => (point as { radius: number }).radius}
          pointsMerge={true}
          ringsData={rings}
          ringColor={() => colorInterpolator}
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          arcsData={arcs}
          arcColor={'color'}
          arcDashLength={() => randomInRange(0.06, 0.7) / 1}
          arcDashGap={() => randomInRange(0.025, 0.4) * 10}
          arcDashAnimateTime={() => randomInRange(0.08, 0.8) * 20000 + 500}
        />
      
      <section className="content-container grow flex flex-col justify-center px-6 md:px-0 z-10 pointer-events-none">
        <h1 className="font-bold mb-12 sm:mb-20 text-center md:text-left text-2xl md:text-3xl font-sans tracking-tight">
          {siteConfig.siteName}
        </h1>

        <ul className="flex flex-col items-center md:items-start tracking-tight text-xl md:text-3xl font-sans pointer-events-auto">
          {locations.map(album => (
            <li
              key={album.id}
              className="max-w-fit"
              onMouseEnter={() => handleMouseEnter(album)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={`/places/${album.slug}`}
                className="hover:text-gray-500 transition-colors"
              >
                {album.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="tracking-tight content-container z-20 absolute bottom-12 right-12 md:bottom-24 md:right-24 text-black">
        <div className="text-xl md:text-3xl font-sans text-center md:text-right">
          <p className="m-0 p-0">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </section>
  );
}
