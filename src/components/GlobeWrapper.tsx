'use client';

import dynamic from 'next/dynamic';
import { Album } from '@/data/albums';

const Globe = dynamic(() => import('./Globe'), { ssr: false });

export default function GlobeWrapper({ albums }: { albums: Album[] }) {
  return <Globe albums={albums} />;
}
