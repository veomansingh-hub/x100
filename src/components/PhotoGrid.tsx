'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { Photo } from '@/lib/photos';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function PhotoGrid({ photos, albumSlug }: { photos: Photo[], albumSlug: string }) {
  const router = useRouter();

  useEffect(() => {
    let lightbox = new PhotoSwipeLightbox({
      gallery: '#gallery-' + albumSlug,
      children: 'a',
      pswpModule: () => import('photoswipe'),
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      bgOpacity: 0.95,
    });
    lightbox.init();

    return () => {
      lightbox.destroy();
      lightbox = null as any;
    };
  }, [albumSlug]);

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        More photos coming soon...
      </div>
    );
  }

  return (
    <div 
      className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 p-4 md:p-8" 
      id={'gallery-' + albumSlug}
    >
      {photos.map((photo, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          className="break-inside-avoid"
        >
          <a
            href={photo.src}
            data-pswp-width={photo.width}
            data-pswp-height={photo.height}
            target="_blank"
            rel="noreferrer"
            className="block w-full overflow-hidden cursor-zoom-in"
          >
            <Image
              src={photo.src}
              alt={photo.alt || `Photo ${idx + 1}`}
              width={photo.width}
              height={photo.height}
              className="w-full h-auto object-cover transition-transform duration-700 hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" // simple gray placeholder
            />
          </a>
        </motion.div>
      ))}
    </div>
  );
}
