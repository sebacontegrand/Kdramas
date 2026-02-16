import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Vivid Asian Drama Board | Discover & Rate Top K-Dramas",
  description: "Explore the most popular Asian dramas from Korea, Japan, and China. Get real-time stats, community ratings, and detailed actor information powered by TMDB.",
  keywords: ["K-Drama", "Asian Drama", "Korean Drama", "TV Series", "Ratings", "TMDB", "Drama Board"],
  authors: [{ name: "K-Rating Team" }],
  openGraph: {
    title: "Vivid Asian Drama Board | Discover & Rate Top Kdramas",
    description: "Your ultimate hub for Asian drama stats and community ratings.",
    url: "https://kdramas.example.com",
    siteName: "Vivid Asian Drama Board",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vivid Asian Drama Board",
    description: "Discover and rate the best Asian dramas.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
