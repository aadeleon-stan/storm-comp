import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const DESCRIPTION = "Compare Storm bowling ball reaction specs side-by-side";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CompareDeezBalls",
  description: DESCRIPTION,
  openGraph: {
    title: "CompareDeezBalls",
    description: DESCRIPTION,
    siteName: "CompareDeezBalls",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CompareDeezBalls",
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
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <header className="border-b border-gray-800 px-6 py-4">
          <Link href="/" className="text-xl font-bold text-red-500 hover:text-red-400">
            CompareDeezBalls
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">Storm bowling ball reaction specs, side by side</p>
        </header>
        <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
