import { albums } from '@/data/albums';
import { notFound } from 'next/navigation';
import { ImmersivePhotoViewerWrapper } from '@/components/ImmersivePhotoViewerWrapper';
import { getAlbumPhotos } from '@/lib/photos';

export async function generateStaticParams() {
  return albums
    .filter((a) => a.type === 'memory')
    .map((album) => ({
      slug: album.slug,
    }));
}

export default async function MemoryImmersivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = albums.find((a) => a.slug === slug && a.type === 'memory');

  if (!album) {
    return notFound();
  }

  const photos = getAlbumPhotos(slug);

  return (
    <main className="bg-black min-h-screen">
      <ImmersivePhotoViewerWrapper photos={photos} title={album.title} />
    </main>
  );
}
