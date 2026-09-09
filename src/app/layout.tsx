import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '@/data/config';
import { BackgroundMusic } from '@/components/BackgroundMusic';

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
        <BackgroundMusic />
        {children}
      </body>
    </html>
  );
}
