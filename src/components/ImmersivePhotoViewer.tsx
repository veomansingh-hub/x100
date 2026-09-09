'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '@/lib/photos';
import { X, Grid } from 'lucide-react';
import Image from 'next/image';
import { Album } from '@/data/albums';

export function ImmersivePhotoViewer({ photos, album, onExit }: { photos: Photo[], album: Album, onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, next, prev, onExit]);

  // Touch handling for mobile swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      prev();
    }
  };

  // Preload logic (N+1, N+2)
  useEffect(() => {
    if (photos.length === 0) return;
    const next1 = (currentIndex + 1) % photos.length;
    const next2 = (currentIndex + 2) % photos.length;
    
    const img1 = new window.Image();
    img1.src = photos[next1].src;
    
    const img2 = new window.Image();
    img2.src = photos[next2].src;
  }, [currentIndex, photos]);

  if (!photos || photos.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-serif mb-4 tracking-tight">{album.title}</h1>
        <p className="text-white/60 tracking-widest text-sm uppercase">More memories coming soon.</p>
        <button onClick={onExit} className="mt-12 text-sm tracking-widest uppercase hover:text-white/70 transition-colors border-b border-white/20 pb-1">
          Back
        </button>
      </div>
    );
  }

  // Look for cover.jpg or cover.webp if we wanted to enforce it as first, 
  // but "Respect natural file order... The immersive experience must use the SAME order as the masonry gallery."
  // So we just use `photos[currentIndex]`.

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col cursor-pointer select-none" 
      onClick={next}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 p-6 md:p-8 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex flex-col gap-1 text-white">
          <h1 className="text-2xl md:text-3xl font-serif tracking-tight">{album.title}</h1>
          <span className="text-xs tracking-widest text-white/50 uppercase">{album.date}</span>
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); onExit(); }}
            className="flex items-center gap-2 text-xs tracking-widest uppercase text-white/50 hover:text-white transition-colors"
          >
            <Grid size={16} />
            <span className="hidden sm:inline">View All</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onExit(); }} 
            className="text-white/50 hover:text-white transition-colors p-2 -mr-2"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex justify-between items-end z-50 text-white/50 text-xs tracking-widest pointer-events-none">
        <div className="hidden md:block">TAP OR CLICK TO ADVANCE</div>
        <div className="md:hidden">SWIPE OR TAP</div>
        <div>{currentIndex + 1} / {photos.length}</div>
      </div>

      {/* PHOTO AREA */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="absolute inset-0 flex items-center justify-center p-0 md:p-16 lg:p-24"
        >
          <div className="relative w-full h-full">
            <Image
              src={photos[currentIndex].src}
              alt={photos[currentIndex].alt || `${album.title} Photo ${currentIndex + 1}`}
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
