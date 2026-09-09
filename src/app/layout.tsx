import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '@/data/config';
import { MusicProvider } from '@/contexts/MusicContext';
import { MusicPlayer } from '@/components/MusicPlayer';

export const metadata: Metadata = {
  title: siteConfig.siteName,
  description: siteConfig.introText,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MusicProvider>
          {children}
          <MusicPlayer />
        </MusicProvider>
      </body>
    </html>
  );
}
