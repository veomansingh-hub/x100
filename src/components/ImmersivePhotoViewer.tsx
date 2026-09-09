'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '@/lib/photos';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function ImmersivePhotoViewer({ photos, title, onExit }: { photos: Photo[], title: string, onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const next = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, next, prev, onExit]);

  if (!photos.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col cursor-pointer" onClick={next}>
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 text-white/70 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm tracking-widest uppercase">{title}</div>
        <button onClick={onExit} className="p-2">
          <X size={24} strokeWidth={1} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end z-50 text-white/50 text-xs tracking-widest pointer-events-none">
        <div>TAP ANYWHERE TO ADVANCE</div>
        <div>{currentIndex + 1} / {photos.length}</div>
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
          className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
        >
          <div className="relative w-full h-full">
            <Image
              src={photos[currentIndex].src}
              alt={photos[currentIndex].alt || `Photo ${currentIndex}`}
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
