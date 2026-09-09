import { albums } from '@/data/albums';
import Link from 'next/link';
import Image from 'next/image';
import { getAlbumCover } from '@/lib/photos';
import { Navigation } from '@/components/Navigation';

export default function MemoriesPage() {
  const memoryAlbums = albums.filter((a) => a.type === 'memory');

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-20 bg-background text-foreground">
        <div className="max-w-screen-2xl mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-16 md:mb-24">Memories</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {memoryAlbums.map((album) => {
            const cover = getAlbumCover(album.slug);
            return (
              <Link key={album.id} href={`/memories/${album.slug}`} className="group block">
                <div className="relative aspect-[4/5] md:aspect-[3/2] overflow-hidden mb-6 bg-muted">
                  {cover && (
                    <Image
                      src={cover}
                      alt={album.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
              </div>
              <h2 className="text-2xl font-medium tracking-tight mb-2">{album.title}</h2>
              <div className="flex gap-4 text-sm text-muted-foreground uppercase tracking-widest">
                <span>{album.date}</span>
              </div>
            </Link>
            );
          })}
        </div>
        </div>
      </main>
    </>
  );
}
