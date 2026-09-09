import { getAlbums } from '@/data/albums';
import GlobeWrapper from '@/components/GlobeWrapper';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <GlobeWrapper albums={getAlbums()} />
    </main>
  );
}
