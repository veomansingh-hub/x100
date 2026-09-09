'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMusicContext } from '@/contexts/MusicContext';
import { Music, Pause, Play, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';

export function MusicPlayer() {
  const { tracks, currentTrack, isPlaying, isMuted, switchTrack, togglePlay, toggleMute } = useMusicContext();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div
      ref={panelRef}
      className="fixed bottom-10 left-10 md:bottom-12 md:left-12 z-50 flex flex-col items-start gap-0"
    >
      {/* Expanded panel */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '260px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="bg-white/95 backdrop-blur border border-black/10 shadow-sm mb-2 p-4 min-w-[190px]">
          <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mb-3 font-sans">Music</p>

          <ul className="flex flex-col gap-2 mb-4">
            {tracks.map(track => (
              <li key={track.id}>
                <button
                  onClick={() => { switchTrack(track.id); setOpen(false); }}
                  className="flex items-center gap-2.5 w-full text-left group"
                >
                  <span className={`w-3 h-3 rounded-full border flex-shrink-0 transition-colors ${
                    currentTrack.id === track.id
                      ? 'bg-black border-black'
                      : 'bg-white border-black/30 group-hover:border-black/60'
                  }`} />
                  <span className={`text-xs tracking-wide font-sans transition-colors ${
                    currentTrack.id === track.id
                      ? 'text-black font-medium'
                      : 'text-black/50 group-hover:text-black/80'
                  }`}>
                    {track.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 pt-3 border-t border-black/8">
            <button
              onClick={togglePlay}
              className="text-[10px] tracking-[0.15em] uppercase text-black/60 hover:text-black transition-colors font-sans flex items-center gap-1.5"
            >
              {isPlaying
                ? <><Pause size={10} strokeWidth={2} /> Pause</>
                : <><Play size={10} strokeWidth={2} /> Play</>
              }
            </button>
            <button
              onClick={toggleMute}
              className="text-black/40 hover:text-black transition-colors"
            >
              {isMuted
                ? <VolumeX size={12} strokeWidth={1.5} />
                : <Volume2 size={12} strokeWidth={1.5} />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Collapsed trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-sans text-black/40 hover:text-black/80 transition-colors group"
      >
        <Music size={11} strokeWidth={1.5} className="opacity-60 group-hover:opacity-100 transition-opacity" />
        <span>{isPlaying ? currentTrack.title.toUpperCase() : 'PLAY MUSIC'}</span>
        {open
          ? <ChevronDown size={9} strokeWidth={2} className="opacity-40" />
          : <ChevronUp size={9} strokeWidth={2} className="opacity-40" />
        }
      </button>
    </div>
  );
}
