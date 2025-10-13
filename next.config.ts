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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        process: false,
      };

      // Ignora completamente esses módulos no cliente
      config.externals = {
        ...config.externals,
        'firebase-admin': 'firebase-admin',
        '@google-cloud/firestore': '@google-cloud/firestore',
        'google-auth-library': 'google-auth-library',
      };
    }
    return config;
  },
};

export default nextConfig;