import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from './providers';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Toaster } from '@/components/ui/toaster';
import "./globals.css";
import "leaflet/dist/leaflet.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Room Finder - Find Your Perfect Room in Bangladesh",
  description: "Discover comfortable, affordable rooms with verified landlords. Smart recommendations based on your budget and preferences.",
  keywords: "room finder, rent, Bangladesh, accommodation, bachelor, landlord",
  authors: [{ name: "Room Finder Team" }],
  creator: "Room Finder",
  publisher: "Room Finder",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Room Finder - Find Your Perfect Room in Bangladesh",
    description: "Discover comfortable, affordable rooms with verified landlords. Smart recommendations based on your budget and preferences.",
    siteName: "Room Finder",
  },
  twitter: {
    card: "summary_large_image",
    title: "Room Finder - Find Your Perfect Room in Bangladesh",
    description: "Discover comfortable, affordable rooms with verified landlords.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-br from-background via-background to-muted/20`} suppressHydrationWarning>
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 relative">
              <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
