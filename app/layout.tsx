import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BASE_PATH, DESCRIPTION, NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // OG/Twitter image URLs are resolved against metadataBase, and unlike <link rel="icon">
  // they do NOT pick up next.config basePath — so the sub-path has to be baked in here or
  // the share card 404s. Appending BASE_PATH is idempotent: it replaces the path if
  // NEXT_PUBLIC_SITE_URL already carries one.
  metadataBase: new URL(`${BASE_PATH}/`, SITE_URL),
  title: NAME,
  description: DESCRIPTION,
  openGraph: {
    title: NAME,
    description: DESCRIPTION,
    siteName: NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: NAME,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen flex flex-col">
        <header className="border-b border-gray-800 px-6 py-4">
          <Link href="/" className="text-xl font-bold hover:opacity-80">
            <span className="text-gray-100">ball</span>
            <span className="text-red-500">diff</span>
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">Bowling ball reaction specs, side by side</p>
        </header>
        <main className="px-6 py-8 max-w-7xl mx-auto w-full flex-1">{children}</main>
        <footer className="border-t border-gray-800 px-6 py-4 text-xs text-gray-500">
          Specs sourced from stormbowling.com. Not affiliated with or endorsed by Storm Products, Inc.
        </footer>
      </body>
    </html>
  );
}
