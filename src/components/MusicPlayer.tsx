'use client';

import React, { useEffect, useRef } from 'react';
import { useMusicContext } from '@/contexts/MusicContext';

export function MusicPlayer() {
  const { tracks, currentTrack, isPlaying, switchTrack, togglePlay } = useMusicContext();
  const hasInteracted = useRef(false);

  // First interaction on the whole page starts music
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted.current) {
        hasInteracted.current = true;
      }
    };
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('keydown', handleFirstInteraction);
  }, []);

  const handleClick = (trackId: string) => {
    if (trackId === currentTrack.id) {
      // Same song tapped → toggle pause/play
      togglePlay();
    } else {
      // Different song tapped → switch and play
      switchTrack(trackId);
    }
  };

  return (
    <div className="fixed bottom-7 left-0 right-0 z-50 flex items-center justify-center gap-6 md:gap-10 px-4 pointer-events-none">
      {tracks.map(track => {
        const isActive  = currentTrack.id === track.id;
        const isPlaying_ = isActive && isPlaying;

        return (
          <button
            key={track.id}
            onClick={() => handleClick(track.id)}
            className="pointer-events-auto flex flex-col items-center gap-1 group"
          >
            {/* Playing indicator dot */}
            <span
              className="w-1 h-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isPlaying_ ? '#000' : 'transparent',
                transform: isPlaying_ ? 'scale(1)' : 'scale(0)',
              }}
            />
            {/* Track name */}
            <span
              className="font-sans uppercase tracking-[0.18em] transition-all duration-200 select-none"
              style={{
                fontSize: 'clamp(9px, 0.9vw, 11px)',
                color: isActive ? '#111' : '#b0b0b0',
                fontWeight: isActive ? 500 : 300,
                letterSpacing: isActive ? '0.20em' : '0.15em',
                borderBottom: isActive ? '1px solid #111' : '1px solid transparent',
                paddingBottom: '1px',
              }}
            >
              {isPlaying_ ? `— ${track.title} —` : track.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
