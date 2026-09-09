'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { LyricLine, sparksLyrics, baroonLyrics, arzKiyaHaiLyrics, iLikeMeBetterLyrics } from '@/data/lyrics';

export interface Track {
  id: string;
  title: string;
  youtubeId: string;
  lyrics: LyricLine[];
}

export const TRACKS: Track[] = [
  { id: 'sparks',         title: 'Sparks',           youtubeId: 'Ar48yzjn1PE', lyrics: sparksLyrics },
  { id: 'baroon',         title: 'Baroon / Banjara',  youtubeId: 'kyqJ_FId-_w', lyrics: baroonLyrics },
  { id: 'arz-kiya-hai',   title: 'Arz Kiya Hai',      youtubeId: 'up3j1A3RPJI', lyrics: arzKiyaHaiLyrics },
  { id: 'i-like-me',      title: 'I Like Me Better',  youtubeId: 'hLQl3WQQoQ0', lyrics: iLikeMeBetterLyrics },
];

interface MusicContextValue {
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  isMuted: boolean;
  switchTrack: (trackId: string) => void;
  togglePlay: () => void;
  toggleMute: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusicContext() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusicContext must be used within MusicProvider');
  return ctx;
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrackId, setCurrentTrackId] = useState('sparks');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const isSwitching = useRef(false);
  const pendingTrackId = useRef<string | null>(null);

  const currentTrack = TRACKS.find(t => t.id === currentTrackId)!;

  const startSync = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const tick = () => {
      if (playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        window.dispatchEvent(new CustomEvent('music-time', { detail: { time, trackId: currentTrackId } }));
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
  }, [currentTrackId]);

  const stopSync = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const fadeVolume = useCallback((from: number, to: number, durationMs: number): Promise<void> => {
    return new Promise(resolve => {
      if (!playerRef.current) { resolve(); return; }
      const steps = 20;
      const stepMs = durationMs / steps;
      const stepSize = (to - from) / steps;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const vol = Math.max(0, Math.min(100, from + stepSize * step));
        playerRef.current?.setVolume?.(vol);
        if (step >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, stepMs);
    });
  }, []);

  const switchTrack = useCallback(async (trackId: string) => {
    if (trackId === currentTrackId || isSwitching.current) return;
    isSwitching.current = true;
    pendingTrackId.current = trackId;

    // Fade out
    if (isPlaying) {
      await fadeVolume(20, 0, 400);
    }
    playerRef.current?.pauseVideo?.();
    stopSync();

    // Reset lyrics
    window.dispatchEvent(new CustomEvent('music-time', { detail: { time: -1, trackId } }));

    setCurrentTrackId(trackId);
    isSwitching.current = false;
  }, [currentTrackId, isPlaying, fadeVolume, stopSync]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(20);
    } else {
      playerRef.current.mute();
    }
    setIsMuted(m => !m);
  }, [isMuted]);

  const onReady: YouTubeProps['onReady'] = useCallback((event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(20);
  }, []);

  const onStateChange: YouTubeProps['onStateChange'] = useCallback((event: any) => {
    if (event.data === 1) { // PLAYING
      setIsPlaying(true);
      startSync();
      // Fade in after track switch
      if (!isSwitching.current) {
        fadeVolume(0, 20, 400);
      }
    } else {
      setIsPlaying(false);
      stopSync();
    }
  }, [startSync, stopSync, fadeVolume]);

  // Auto-play new track after switch
  useEffect(() => {
    if (playerRef.current && !isSwitching.current) {
      const timer = setTimeout(() => {
        playerRef.current?.seekTo?.(0);
        playerRef.current?.playVideo?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentTrackId]);

  useEffect(() => {
    return () => stopSync();
  }, [stopSync]);

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

  return (
    <MusicContext.Provider value={{
      tracks: TRACKS,
      currentTrack,
      isPlaying,
      isMuted,
      switchTrack,
      togglePlay,
      toggleMute,
    }}>
      <div className="hidden pointer-events-none absolute w-0 h-0 overflow-hidden">
        <YouTube
          key={currentTrackId}
          videoId={currentTrack.youtubeId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
        />
      </div>
      {children}
    </MusicContext.Provider>
  );
}
