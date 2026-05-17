import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Fragrance Community',
  description: 'A personal learning log for scent, built as a hobby MVP.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0b0b0b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="bg-slate-900 border-b border-slate-800">
          <nav className="flex gap-5 items-center max-w-6xl mx-auto px-4 py-3">
            <Link href="/" className="font-bold text-white text-sm mr-2">
              ScentOI
            </Link>
            <Link href="/library" className="text-slate-300 hover:text-white text-sm transition-colors">Library</Link>
            <Link href="/learning" className="text-slate-300 hover:text-white text-sm transition-colors">Learning</Link>
            <Link href="/community" className="text-slate-300 hover:text-white text-sm transition-colors">Community</Link>
            <Link href="/layering" className="text-slate-300 hover:text-white text-sm transition-colors">Layering Lab</Link>
          </nav>
        </header>

        <div style={{ padding: '16px' }}>{children}</div>
      </body>
    </html>
  );
}
