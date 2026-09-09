'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/data/config';
import { motion } from 'framer-motion';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Places' },
    { href: '/memories', label: 'Memories' },
    { href: '/story', label: 'Our Story' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 mix-blend-difference text-white">
      <div className="max-w-screen-2xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link href="/" className="text-xl font-medium tracking-tight">
          {siteConfig.siteName}
        </Link>
        <div className="hidden md:flex space-x-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm uppercase tracking-widest hover:opacity-100 transition-opacity ${
                pathname === link.href ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        {/* Mobile menu could be added here */}
        <div className="md:hidden">
          <button className="text-sm uppercase tracking-widest opacity-60 hover:opacity-100">
            Menu
          </button>
        </div>
      </div>
    </nav>
  );
}
