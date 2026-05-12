import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fragrance Community",
  description: "A personal learning log for scent, built as a hobby MVP.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header style={{ padding: "16px", borderBottom: "1px solid #eee" }}>
          <nav style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link href="/" style={{ fontWeight: 700 }}>Fragrance Community</Link>
            <Link href="/library">Library</Link>
            <Link href="/learning">Learning</Link>
            <Link href="/community">Community</Link>
          </nav>
        </header>

        <div style={{ padding: "16px" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
