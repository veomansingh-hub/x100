# Our Memories

A polished personal photography and memories website, inspired by minimalist editorial photography portfolios and immersive interaction experiences.

## Features

- **Interactive Globe:** A `Three.js` + `Globe.GL` powered 3D globe to explore places visited.
- **Masonry Galleries:** Responsive masonry layouts for beautiful photography presentation, with `PhotoSwipe` fullscreen zooming.
- **Immersive Memories Viewer:** A cinematic, gesture/keyboard-friendly full-screen photo viewer (inspired by X100).
- **Our Story:** A minimalist timeline and relationship dashboard.
- **Performant & Responsive:** Built with Next.js App Router, Tailwind CSS, and optimized image loading.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the site.

### 3. Build for Production
```bash
npm run build
npm run start
```

### 4. Deploy to Vercel
Since this is a Next.js project, it is highly optimized for Vercel.
```bash
npx vercel
```
Or simply push to GitHub and connect it to your Vercel account.

## Personalization & Configuration

All core text and dates can be modified in:
`src/data/config.ts`

```typescript
export const siteConfig = {
  siteName: "Our Memories",
  girlfriendName: "Eleanor", // Change this!
  myName: "Aaron", // Change this!
  relationshipStartDate: "2024-04-15", // Change this!
  // ...
};
```

## Adding Photos

We use an automatic folder-based photo discovery system. Vercel will automatically detect and deploy your new photos when you push to GitHub. You do NOT need to manually add every photo's filename to a configuration array.

### Adding Photos to an Existing Album:
1. Copy images (JPG, PNG, WEBP, AVIF) to `/public/photos/[album-slug]/`
2. Commit the files
3. Push to GitHub
4. Vercel automatically redeploys and the photos will be live!

### Adding a New Album:
1. Create a new folder: `/public/photos/[new-slug]/`
2. Add your photos to the folder. You can optionally name one `cover.webp` (or `cover.jpg`) to act as the thumbnail cover for the album.
3. Add a single metadata object to `src/data/albums.ts`:
```typescript
{
  id: "new-slug",
  title: "New Album Title",
  slug: "new-slug",
  date: "Month Year",
  description: "Description of the album",
  type: "location", // or "memory"
  lat: 48.8566, // Optional (only if you want it on the globe)
  lng: 2.3522 // Optional
}
```
4. Commit and push!

*(Note: The `cover.ext` file is excluded from the normal gallery layout, and filenames are sorted naturally, meaning `001.webp` will appear before `002.webp`).*
