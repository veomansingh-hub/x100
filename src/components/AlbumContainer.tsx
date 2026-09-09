'use client';

import React, { useState } from 'react';
import { Photo } from '@/lib/photos';
import { Album } from '@/data/albums';
import { ImmersivePhotoViewer } from './ImmersivePhotoViewer';
import { PhotoGrid } from './PhotoGrid';
import { Navigation } from './Navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function AlbumContainer({ album, photos }: { album: Album, photos: Photo[] }) {
  const [showImmersive, setShowImmersive] = useState(true);

  return (
    <AnimatePresence mode="wait">
      {showImmersive ? (
        <motion.div
          key="immersive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="fixed inset-0 z-[100] bg-black"
        >
          <ImmersivePhotoViewer 
            photos={photos} 
            album={album}
            onExit={() => setShowImmersive(false)} 
          />
        </motion.div>
      ) : (
        <motion.div
          key="gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="min-h-screen bg-background"
        >
          <Navigation />
          <main className="pt-32 pb-20 text-foreground">
            <div className="max-w-screen-2xl mx-auto px-6 mb-16 md:mb-24">
              <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-4">{album.title}</h1>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-muted-foreground tracking-wide">
                <span className="uppercase text-sm">{album.date}</span>
                <span className="hidden md:inline">•</span>
                <span className="text-sm">{album.description}</span>
              </div>
            </div>
            <PhotoGrid photos={photos} albumSlug={album.slug} />
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
