import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      }
    ],
  },
  // REMOVA o output: 'standalone' completamente
  // Deixe o Next.js decidir automaticamente
};

export default nextConfig;