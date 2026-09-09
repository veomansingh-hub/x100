import photosData from '@/data/photos.json';

export interface Photo {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export function getAlbumPhotos(slug: string): Photo[] {
  const data = photosData as Record<string, Photo[]>;
  const photos = data[slug] || [];
  
  // Filter out the cover image from the main gallery sequence if it exists
  return photos.filter(p => !p.src.toLowerCase().includes('/cover.'));
}

export function getAlbumCover(slug: string): string | null {
  const data = photosData as Record<string, Photo[]>;
  const photos = data[slug] || [];
  
  if (photos.length === 0) return null;

  const cover = photos.find(p => p.src.toLowerCase().includes('/cover.'));
  if (cover) return cover.src;

  return photos[0].src;
}
