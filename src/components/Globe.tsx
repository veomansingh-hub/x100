'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import GlobeGL, { GlobeMethods } from 'react-globe.gl';
import * as topojson from 'topojson-client';
import { Album } from '@/data/albums';
import { siteConfig } from '@/data/config';
import Link from 'next/link';
import { LYRIC_LINES } from './BackgroundMusic';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

// Calculate continuous time->angle mapping for smooth SVG rotation
const totalChars = LYRIC_LINES.reduce((sum, l) => sum + l.text.length + 3, 0);
let running = 0;
const lineAngles = LYRIC_LINES.map(l => {
  const startAngle = (running / totalChars) * 1080; // 3 loops = 1080 degrees
  running += l.text.length + 3;
  const endAngle = (running / totalChars) * 1080;
  return { startAngle, endAngle };
});

const timeMap: {time: number, angle: number}[] = [];
LYRIC_LINES.forEach((l, i) => {
  timeMap.push({ time: l.start, angle: lineAngles[i].startAngle });
  timeMap.push({ time: l.end, angle: lineAngles[i].endAngle });
});

function getAngleForTime(t: number) {
  if (t <= timeMap[0].time) return timeMap[0].angle;
  if (t >= timeMap[timeMap.length-1].time) return timeMap[timeMap.length-1].angle;
  for (let i = 0; i < timeMap.length - 1; i++) {
    if (t >= timeMap[i].time && t <= timeMap[i+1].time) {
      const p = (t - timeMap[i].time) / (timeMap[i+1].time - timeMap[i].time);
      return timeMap[i].angle + p * (timeMap[i+1].angle - timeMap[i].angle);
    }
  }
  return 0;
}

export default function GlobeComponent({ albums }: { albums: Album[] }) {
  const globeEl = useRef<any>(undefined);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wordRefs = useRef<(SVGTSpanElement | null)[]>([]);

  const [landPolygons, setLandPolygons] = useState<any[]>([]);
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 800 });
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [rings, setRings] = useState<any[]>([]);
  const [arcs, setArcs] = useState<any[]>([]);

  const locations = albums.filter(a => a.type === 'location' && a.lat && a.lng);

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
    
    g.pointOfView({ lat: 20, lng: 70, altitude: 2.4 });
  }, [globeEl.current]);

  // Synchronized Lyric Engine
  useEffect(() => {
    let animationFrameId: number;
    let baselineRotation = 0; // Slowly drifts when music is paused

    const handleTime = (e: any) => {
      const t = e.detail;
      if (!svgRef.current) return;

      // Calculate perfect SVG rotation to pin active lyric to top right (45deg)
      const currentPhysicalAngle = getAngleForTime(t);
      const targetRotation = 45 - currentPhysicalAngle;
      
      svgRef.current.style.transform = `rotate(${targetRotation}deg)`;

      // Determine active line window (show about 5 lines)
      let activeLineIdx = LYRIC_LINES.findIndex(l => t >= l.start && t <= l.end);
      if (activeLineIdx === -1) {
        activeLineIdx = LYRIC_LINES.findIndex(l => l.start > t);
        if (activeLineIdx === -1) activeLineIdx = LYRIC_LINES.length - 1;
      }

      // Update word stylings dynamically without React re-renders!
      let flatWordIdx = 0;
      for (let i = 0; i < LYRIC_LINES.length; i++) {
        const line = LYRIC_LINES[i];
        const isLineActive = t >= line.start && t <= line.end;
        
        // Window clipping: prevent overlapping text loops from showing
        const distance = Math.abs(i - activeLineIdx);
        const lineOpacity = distance <= 3 ? 1 : 0;

        for (let j = 0; j < line.words.length; j++) {
          const w = line.words[j];
          const el = wordRefs.current[flatWordIdx];
          flatWordIdx++;
          
          if (!el) continue;

          if (lineOpacity === 0) {
            el.style.opacity = '0';
            continue;
          }

          const isWordActive = t >= w.start && t <= w.end;
          
          let fill = '#b8b8b8';
          let fw = '300';
          let opac = '0.35';

          if (isLineActive) {
            fill = '#333333';
            fw = '450';
            opac = '0.9';
          }
          if (isWordActive) {
            fill = '#000000';
            fw = '700';
            opac = '1';
          }

          el.style.fill = fill;
          el.style.fontWeight = fw;
          el.style.opacity = opac;
        }
      }
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
      globeEl.current.pointOfView({ lat: 20, lng: 70, altitude: 2.4 }, 1000);
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
        <div ref={globeContainerRef} className="absolute inset-0 flex items-center justify-center">
          
          {/* GLOBE CANVAS */}
          <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 10 }}>
            {globeSize.width > 0 && (
              <Globe
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

          {/* PERFECT 2D LYRIC ORBIT (SVG TEXT PATH) */}
          <svg 
            ref={svgRef}
            className="absolute pointer-events-none will-change-transform" 
            style={{ 
              zIndex: 20, 
              width: '95%', 
              height: '95%', 
              maxWidth: '900px', 
              maxHeight: '900px', 
              transform: 'rotate(45deg)',
              transition: 'transform 0.1s linear' 
            }} 
            viewBox="0 0 1000 1000"
          >
            <defs>
              <path id="lyric-orbit-path" d="
                M 500,40
                A 460,460 0 1,1 499.9,40
                A 460,460 0 1,1 499.8,40
                A 460,460 0 1,1 499.7,40
              " />
            </defs>
            <text className="font-serif tracking-wide" style={{ fontSize: '26px' }}>
              <textPath href="#lyric-orbit-path" textLength="8670" lengthAdjust="spacing">
                {LYRIC_LINES.map((line, i) => (
                  <React.Fragment key={i}>
                    {line.words.map((w, j) => {
                      // We assign refs based on flat index
                      const flatIndex = LYRIC_LINES.slice(0, i).reduce((sum, l) => sum + l.words.length, 0) + j;
                      return (
                        <React.Fragment key={j}>
                          <tspan 
                            ref={el => { wordRefs.current[flatIndex] = el; }}
                            fill="#b8b8b8"
                            style={{ opacity: 0, transition: 'fill 0.15s, font-weight 0.15s, opacity 0.3s ease-in-out' }}
                          >
                            {w.text}
                          </tspan>
                          <tspan fill="transparent"> </tspan>
                        </React.Fragment>
                      );
                    })}
                    <tspan fill="#d0d0d0" opacity="0.3"> • </tspan>
                  </React.Fragment>
                ))}
              </textPath>
            </text>
          </svg>
          
        </div>
      </div>

      <footer className="absolute bottom-8 right-8 md:bottom-12 md:right-[6vw] z-50 pointer-events-none text-[#555] font-sans text-sm md:text-base tracking-widest uppercase">
        <p className="m-0 p-0">&copy; {new Date().getFullYear()}</p>
      </footer>
    </section>
  );
}
