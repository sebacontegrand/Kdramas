import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.themoviedb.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'themoviedb.org',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
