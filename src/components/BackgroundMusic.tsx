'use client';

import React, { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

export const LYRIC_LINES = [
  {
    start: 33, end: 37, text: "Did I drive you away?",
    words: [
      { text: "Did", start: 33, end: 33.5 },
      { text: "I", start: 33.5, end: 34 },
      { text: "drive", start: 34, end: 35 },
      { text: "you", start: 35, end: 35.5 },
      { text: "away?", start: 35.5, end: 37 }
    ]
  },
  {
    start: 40, end: 44, text: "I know what you'll say",
    words: [
      { text: "I", start: 40, end: 40.5 },
      { text: "know", start: 40.5, end: 41 },
      { text: "what", start: 41, end: 41.5 },
      { text: "you'll", start: 41.5, end: 42 },
      { text: "say", start: 42, end: 44 }
    ]
  },
  {
    start: 48, end: 53, text: "You say, \"Oh, sing one we know\"",
    words: [
      { text: "You", start: 48, end: 48.5 },
      { text: "say,", start: 48.5, end: 49 },
      { text: "\"Oh,", start: 49, end: 50 },
      { text: "sing", start: 50, end: 50.5 },
      { text: "one", start: 50.5, end: 51 },
      { text: "we", start: 51, end: 51.5 },
      { text: "know\"", start: 51.5, end: 53 }
    ]
  },
  {
    start: 55, end: 59, text: "But I promise you this",
    words: [
      { text: "But", start: 55, end: 55.5 },
      { text: "I", start: 55.5, end: 56 },
      { text: "promise", start: 56, end: 56.5 },
      { text: "you", start: 56.5, end: 57 },
      { text: "this", start: 57, end: 59 }
    ]
  },
  {
    start: 62, end: 66, text: "I'll always look out for you",
    words: [
      { text: "I'll", start: 62, end: 62.5 },
      { text: "always", start: 62.5, end: 63.5 },
      { text: "look", start: 63.5, end: 64 },
      { text: "out", start: 64, end: 64.5 },
      { text: "for", start: 64.5, end: 65 },
      { text: "you", start: 65, end: 66 }
    ]
  },
  {
    start: 70, end: 74, text: "Yeah, that's what I'll do",
    words: [
      { text: "Yeah,", start: 70, end: 71 },
      { text: "that's", start: 71, end: 71.5 },
      { text: "what", start: 71.5, end: 72 },
      { text: "I'll", start: 72, end: 72.5 },
      { text: "do", start: 72.5, end: 74 }
    ]
  },
  {
    start: 79, end: 83, text: "I say, \"Oh\"",
    words: [
      { text: "I", start: 79, end: 79.5 },
      { text: "say,", start: 79.5, end: 80 },
      { text: "\"Oh\"", start: 80, end: 83 }
    ]
  },
  {
    start: 85, end: 89, text: "I say, \"Oh\"",
    words: [
      { text: "I", start: 85, end: 85.5 },
      { text: "say,", start: 85.5, end: 86 },
      { text: "\"Oh\"", start: 86, end: 89 }
    ]
  },
  {
    start: 100, end: 104, text: "My heart is yours",
    words: [
      { text: "My", start: 100, end: 100.5 },
      { text: "heart", start: 100.5, end: 101.5 },
      { text: "is", start: 101.5, end: 102 },
      { text: "yours", start: 102, end: 104 }
    ]
  },
  {
    start: 107, end: 111, text: "It's you that I hold on to",
    words: [
      { text: "It's", start: 107, end: 107.5 },
      { text: "you", start: 107.5, end: 108.5 },
      { text: "that", start: 108.5, end: 109 },
      { text: "I", start: 109, end: 109.5 },
      { text: "hold", start: 109.5, end: 110 },
      { text: "on", start: 110, end: 110.5 },
      { text: "to", start: 110.5, end: 111 }
    ]
  },
  {
    start: 114, end: 118, text: "Yeah, that's what I do",
    words: [
      { text: "Yeah,", start: 114, end: 115 },
      { text: "that's", start: 115, end: 115.5 },
      { text: "what", start: 115.5, end: 116 },
      { text: "I", start: 116, end: 116.5 },
      { text: "do", start: 116.5, end: 118 }
    ]
  },
  {
    start: 122, end: 126, text: "And I know I was wrong",
    words: [
      { text: "And", start: 122, end: 122.5 },
      { text: "I", start: 122.5, end: 123 },
      { text: "know", start: 123, end: 123.5 },
      { text: "I", start: 123.5, end: 124 },
      { text: "was", start: 124, end: 124.5 },
      { text: "wrong", start: 124.5, end: 126 }
    ]
  },
  {
    start: 130, end: 134, text: "But I won't let you down",
    words: [
      { text: "But", start: 130, end: 130.5 },
      { text: "I", start: 130.5, end: 131 },
      { text: "won't", start: 131, end: 131.5 },
      { text: "let", start: 131.5, end: 132 },
      { text: "you", start: 132, end: 132.5 },
      { text: "down", start: 132.5, end: 134 }
    ]
  },
  {
    start: 137, end: 143, text: "Oh, yeah, I will, yeah, I will, yes, I will",
    words: [
      { text: "Oh,", start: 137, end: 138 },
      { text: "yeah,", start: 138, end: 138.5 },
      { text: "I", start: 138.5, end: 139 },
      { text: "will,", start: 139, end: 139.5 },
      { text: "yeah,", start: 139.5, end: 140 },
      { text: "I", start: 140, end: 140.5 },
      { text: "will,", start: 140.5, end: 141.5 },
      { text: "yes,", start: 141.5, end: 142 },
      { text: "I", start: 142, end: 142.5 },
      { text: "will", start: 142.5, end: 143 }
    ]
  },
  {
    start: 146, end: 150, text: "I said, \"Oh\"",
    words: [
      { text: "I", start: 146, end: 146.5 },
      { text: "said,", start: 146.5, end: 147 },
      { text: "\"Oh\"", start: 147, end: 150 }
    ]
  },
  {
    start: 153, end: 157, text: "I cry, \"Oh\"",
    words: [
      { text: "I", start: 153, end: 153.5 },
      { text: "cry,", start: 153.5, end: 154 },
      { text: "\"Oh\"", start: 154, end: 157 }
    ]
  },
  {
    start: 167, end: 171, text: "Yeah, I saw sparks",
    words: [
      { text: "Yeah,", start: 167, end: 168 },
      { text: "I", start: 168, end: 168.5 },
      { text: "saw", start: 168.5, end: 169 },
      { text: "sparks", start: 169, end: 171 }
    ]
  },
  {
    start: 174, end: 178, text: "Yeah, I saw sparks",
    words: [
      { text: "Yeah,", start: 174, end: 175 },
      { text: "I", start: 175, end: 175.5 },
      { text: "saw", start: 175.5, end: 176 },
      { text: "sparks", start: 176, end: 178 }
    ]
  },
  {
    start: 182, end: 186, text: "And I saw sparks",
    words: [
      { text: "And", start: 182, end: 183 },
      { text: "I", start: 183, end: 183.5 },
      { text: "saw", start: 183.5, end: 184 },
      { text: "sparks", start: 184, end: 186 }
    ]
  },
  {
    start: 189, end: 193, text: "Yeah, I saw sparks",
    words: [
      { text: "Yeah,", start: 189, end: 190 },
      { text: "I", start: 190, end: 190.5 },
      { text: "saw", start: 190.5, end: 191 },
      { text: "sparks", start: 191, end: 193 }
    ]
  },
  {
    start: 198, end: 200, text: "Sing it out",
    words: [
      { text: "Sing", start: 198, end: 198.5 },
      { text: "it", start: 198.5, end: 199 },
      { text: "out", start: 199, end: 200 }
    ]
  }
];

export function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
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
    playerRef.current.setVolume(20); 
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
        const time = playerRef.current.getCurrentTime();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('music-time', { detail: time }));
        }
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
        className="fixed bottom-12 left-12 md:bottom-24 md:left-24 z-50 text-xs md:text-sm tracking-widest uppercase opacity-40 hover:opacity-100 transition-opacity text-foreground"
      >
        {isPlaying ? 'Pause Music' : 'Play Music'}
      </button>
    </>
  );
}
