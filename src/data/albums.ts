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
}

export const albums: Album[] = [

  {
    id: "nashik",
    title: "Nashik",
    slug: "nashik",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 19.9975,
    lng: 73.7898
  },
  {
    id: "mahabaleshwar",
    title: "Mahabaleshwar",
    slug: "mahabaleshwar",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 17.9307,
    lng: 73.6477
  },
  {
    id: "old-mahabaleshwar",
    title: "Old Mahabaleshwar",
    slug: "old-mahabaleshwar",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 17.9255,
    lng: 73.6551
  },
  {
    id: "gureghar",
    title: "Gureghar",
    slug: "gureghar",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 17.9174,
    lng: 73.7381
  },
  {
    id: "verul",
    title: "Verul",
    slug: "verul",
    date: "Recent",
    description: "Cities, Towns & Villages",
    type: "location",
    lat: 20.0258,
    lng: 75.1780
  },
  {
    id: "ancient-temples-verul",
    title: "Ancient temples of Verul",
    slug: "ancient-temples-verul",
    date: "Recent",
    description: "Monuments & Temples",
    type: "location",
    lat: 20.0264,
    lng: 75.1771
  },
  {
    id: "temples-old-mahabaleshwar",
    title: "Temples located in Old Mahabaleshwar",
    slug: "temples-old-mahabaleshwar",
    date: "Recent",
    description: "Monuments & Temples",
    type: "location",
    lat: 17.9255,
    lng: 73.6550
  },
  {
    id: "koyna-wildlife",
    title: "Koyna Wildlife Sanctuary",
    slug: "koyna-wildlife",
    date: "Recent",
    description: "Nature & Wildlife",
    type: "location",
    lat: 17.3833,
    lng: 73.7333
  },
  {
    id: "us",
    title: "Us ❤️",
    slug: "us",
    date: "Always",
    description: "Favorite moments together",
    type: "memory"
  },
  {
    id: "birthdays",
    title: "Birthdays",
    slug: "birthdays",
    date: "Various",
    description: "Celebrations",
    type: "memory"
  }
];
