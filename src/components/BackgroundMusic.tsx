'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { AnimatePresence, motion } from 'framer-motion';

const LINES = [
  { time: 33, duration: 4, text: "Did I drive you away?" },
  { time: 40, duration: 4, text: "I know what you'll say" },
  { time: 48, duration: 5, text: "You say, \"Oh, sing one we know\"" },
  { time: 55, duration: 4, text: "But I promise you this" },
  { time: 62, duration: 4, text: "I'll always look out for you" },
  { time: 70, duration: 4, text: "Yeah, that's what I'll do" },
  { time: 79, duration: 4, text: "I say, \"Oh\"" },
  { time: 85, duration: 4, text: "I say, \"Oh\"" },
  { time: 100, duration: 4, text: "My heart is yours" },
  { time: 107, duration: 4, text: "It's you that I hold on to" },
  { time: 114, duration: 4, text: "Yeah, that's what I do" },
  { time: 122, duration: 4, text: "And I know I was wrong" },
  { time: 130, duration: 4, text: "But I won't let you down" },
  { time: 137, duration: 6, text: "Oh, yeah, I will, yeah, I will, yes, I will" },
  { time: 146, duration: 4, text: "I said, \"Oh\"" },
  { time: 153, duration: 4, text: "I cry, \"Oh\"" },
  { time: 167, duration: 4, text: "Yeah, I saw sparks" },
  { time: 174, duration: 4, text: "Yeah, I saw sparks" },
  { time: 182, duration: 4, text: "And I saw sparks" },
  { time: 189, duration: 4, text: "Yeah, I saw sparks" },
  { time: 198, duration: 2, text: "Sing it out" },
  { time: 199, duration: 6, text: "La-la-la-la, oh-oh" },
  { time: 206, duration: 6, text: "La-la-la-la, oh-oh" },
  { time: 214, duration: 6, text: "La-la-la-la, oh-oh" },
  { time: 221, duration: 6, text: "La-la-la-la, oh-oh" },
];

export function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  const opts: YouTubeProps['opts'] = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      playsinline: 1,
    },
  };

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(30); 
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) { // PLAYING
      setIsPlaying(true);
      startSync();
    } else {
      setIsPlaying(false);
      stopSync();
    }
  };

  const startSync = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const updateTime = () => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
      animationRef.current = requestAnimationFrame(updateTime);
    };
    animationRef.current = requestAnimationFrame(updateTime);
  };

  const stopSync = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  useEffect(() => {
    return () => stopSync();
  }, []);

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  // Process all words once
  const allWords = useMemo(() => {
    const words: { text: string; start: number; end: number }[] = [];
    LINES.forEach(line => {
      const lineWords = line.text.split(' ');
      const dur = line.duration / lineWords.length;
      lineWords.forEach((w, i) => {
        words.push({
          text: w,
          start: line.time + (i * dur),
          end: line.time + ((i + 1) * dur)
        });
      });
    });
    return words;
  }, []);

  return (
    <>
      <div className="hidden pointer-events-none absolute w-0 h-0 overflow-hidden">
        <YouTube 
          videoId="Ar48yzjn1PE" 
          opts={opts} 
          onReady={onReady} 
          onStateChange={onStateChange} 
        />
      </div>
      
      <button 
        onClick={togglePlay}
        className="fixed bottom-12 left-12 md:bottom-24 md:left-24 z-50 text-xs md:text-sm tracking-widest uppercase opacity-40 hover:opacity-100 transition-opacity mix-blend-difference text-white"
      >
        {isPlaying ? 'Pause Music' : 'Play Music'}
      </button>

      {/* Full Circle Orbiting Lyrics */}
      <div 
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden mix-blend-difference"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          animate={{ rotateZ: [0, 360] }}
          transition={{ duration: 180, ease: 'linear', repeat: Infinity }}
          className="absolute w-[900px] h-[900px] lg:w-[1400px] lg:h-[1400px]"
          style={{ transformStyle: 'preserve-3d', rotateX: 75 }}
        >
          <svg viewBox="0 0 1000 1000" className="w-full h-full">
            <defs>
              <path id="fullOrbit" d="M 500, 100 a 400,400 0 1,1 0,800 a 400,400 0 1,1 0,-800" />
            </defs>
            <text style={{ fontSize: '18px', letterSpacing: '0.1em' }} className="font-serif uppercase">
              <textPath href="#fullOrbit" textLength="2500" lengthAdjust="spacing">
                {allWords.map((wordObj, idx) => {
                  const isHighlight = currentTime >= wordObj.start && currentTime < wordObj.end;
                  return (
                    <tspan 
                      key={idx}
                      className={`transition-colors duration-200 ${
                        isHighlight ? 'fill-white font-bold' : 'fill-neutral-700'
                      }`}
                    >
                      {wordObj.text}{" "}
                    </tspan>
                  );
                })}
              </textPath>
            </text>
          </svg>
        </motion.div>
      </div>
    </>
  );
}
