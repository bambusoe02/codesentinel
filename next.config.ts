import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler for better performance
  reactCompiler: true,

  // PWA and performance optimizations
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@clerk/nextjs', 'lucide-react', 'recharts'],
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Bundle analyzer (conditionally enabled)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (process.env.NODE_ENV === 'production') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: './analyze/client.html',
            })
          );
        } catch (error) {
          console.warn('Bundle analyzer not available:', error);
        }
      }
      return config;
    },
  }),

  // Turbopack configuration for Next.js 16+
  turbopack: {},
};

export default nextConfig;