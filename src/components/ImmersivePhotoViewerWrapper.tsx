'use client';

import { ImmersivePhotoViewer } from './ImmersivePhotoViewer';
import { useRouter } from 'next/navigation';
import { Photo } from '@/lib/photos';

export function ImmersivePhotoViewerWrapper({ photos, title }: { photos: Photo[], title: string }) {
  const router = useRouter();
  
  return (
    <ImmersivePhotoViewer 
      photos={photos} 
      title={title} 
      onExit={() => router.push('/memories')} 
    />
  );
}
