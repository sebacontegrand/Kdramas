import type { Metadata } from "next";
// Standard fonts are configured in globals.css via Tailwind 4 theme
import "./globals.css";

export const metadata: Metadata = {
  title: "KDrama Fever | Your Ultimate Hallyu Vault",
  description: "Ditch the boring boards. Dive into KDrama Fever for the hottest Korean, Japanese, and Chinese dramas. Real-time stats, community ratings, and deep actor insights.",
  keywords: ["KDrama Fever", "Hallyu", "K-Drama", "Asian Drama", "Ratings", "TV Shows", "Drama Tracker"],
  authors: [{ name: "Fever Team" }],
  openGraph: {
    title: "KDrama Fever | Your Ultimate Hallyu Vault",
    description: "The spicy way to track, rate, and discover Asian Dramas.",
    url: "https://kdrama-fever.com",
    siteName: "KDrama Fever",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KDrama Fever",
    description: "Your daily dose of Hallyu obsession.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import Background from "@/components/Background";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased relative min-h-screen">
        <Background />
        {children}
      </body>
    </html>
  );
}
