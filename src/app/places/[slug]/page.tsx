import { getAlbums } from '@/data/albums';
import { notFound } from 'next/navigation';
import { getAlbumPhotos } from '@/lib/photos';
import { AlbumContainer } from '@/components/AlbumContainer';

export async function generateStaticParams() {
  return getAlbums()
    .filter((a) => a.type === 'location')
    .map((album) => ({
      slug: album.slug,
    }));
}

export default async function PlaceAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = getAlbums().find((a) => a.slug === slug && a.type === 'location');

  if (!album) {
    notFound();
  }

  const photos = getAlbumPhotos(slug);

  return <AlbumContainer album={album} photos={photos} />;
}
