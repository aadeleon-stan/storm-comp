import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CompareDeezBalls",
  description: "Compare Storm bowling ball reaction specs side-by-side",
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
          <a href="/" className="text-xl font-bold text-red-500 hover:text-red-400">
            CompareDeezBalls
          </a>
          <p className="text-xs text-gray-400 mt-0.5">Storm bowling ball reaction specs, side by side</p>
        </header>
        <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
