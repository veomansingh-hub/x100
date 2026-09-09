/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Vercel Blob CDN — exact store hostname (wildcard unreliable in Next.js 15)
        protocol: 'https',
        hostname: 'geunjt5vlztyjyjb.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
