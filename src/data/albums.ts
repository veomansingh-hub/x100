import photosData from '@/data/photos.json';

export type AlbumType = 'location' | 'memory';

export interface Album {
  id: string;
  title: string;
  slug: string;
  date: string;
  description: string;
  type: AlbumType;
  lat?: number;
  lng?: number;
  status?: 'active' | 'dream' | 'future';
}

const ALBUM_METADATA: Partial<Album>[] = [
  {
    slug: "nashik",
    title: "Nashik",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 19.9975,
    lng: 73.7898
  },
  {
    slug: "mahabaleshwar",
    title: "Mahabaleshwar",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 17.9307,
    lng: 73.6477
  },
  {
    slug: "old-mahabaleshwar",
    title: "Old Mahabaleshwar",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 17.9255,
    lng: 73.6551
  },
  {
    slug: "gureghar",
    title: "Gureghar",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 17.9174,
    lng: 73.7381
  },
  {
    slug: "verul",
    title: "Verul",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 20.0258,
    lng: 75.1780
  },
  {
    slug: "kailasha",
    title: "Kailasha",
    date: "Recent",
    description: "Monuments & Temples",
    type: "location",
    lat: 20.0264,
    lng: 75.1771
  },
  {
    slug: "temples-located-in-old-mahabaleshwar",
    title: "Temples located in Old Mahabaleshwar",
    date: "Recent",
    description: "Monuments & Temples",
    type: "location",
    lat: 17.9255,
    lng: 73.6550
  },
  {
    slug: "koyna-wildlife",
    title: "Koyna Wildlife Sanctuary",
    date: "Recent",
    description: "Nature & Wildlife",
    type: "location",
    lat: 17.3833,
    lng: 73.7333,
    status: 'dream'
  },
  {
    slug: "nagpur",
    title: "Nagpur",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 21.1458,
    lng: 79.0882
  },
  {
    slug: "trimbekshwar",
    title: "Trimbekshwar",
    date: "Recent",
    description: "Monuments & Temples",
    type: "location",
    lat: 19.9406,
    lng: 73.5312
  },
  {
    slug: "us",
    title: "Us ❤️",
    date: "Always",
    description: "Favorite moments together",
    type: "memory"
  },
  {
    slug: "birthdays",
    title: "Birthdays",
    date: "Various",
    description: "Celebrations",
    type: "memory"
  }
];

export function getAlbums(): Album[] {
  const activeFolders = Object.keys(photosData);
  const generatedAlbums: Album[] = [];

  for (const folder of activeFolders) {
    const meta = ALBUM_METADATA.find(m => m.slug === folder) || {};
    
    generatedAlbums.push({
      id: meta.slug || folder,
      slug: folder,
      title: meta.title || folder.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      date: meta.date || "Recent",
      description: meta.description || "Photos",
      type: meta.type || "location",
      lat: meta.lat,
      lng: meta.lng,
      status: 'active'
    });
  }

  for (const meta of ALBUM_METADATA) {
    if (meta.status === 'dream' || meta.status === 'future') {
      if (!generatedAlbums.find(a => a.slug === meta.slug)) {
        generatedAlbums.push(meta as Album);
      }
    }
  }

  return generatedAlbums;
}
