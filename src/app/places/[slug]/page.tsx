import { albums } from '@/data/albums';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/PhotoGrid';
import { getAlbumPhotos } from '@/lib/photos';
import { Navigation } from '@/components/Navigation';

export async function generateStaticParams() {
  return albums
    .filter((a) => a.type === 'location')
    .map((album) => ({
      slug: album.slug,
    }));
}

export default async function PlaceAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = albums.find((a) => a.slug === slug && a.type === 'location');

  if (!album) {
    notFound();
  }

  const photos = getAlbumPhotos(slug);

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-20 bg-background text-foreground">
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
    </>
  );
}
