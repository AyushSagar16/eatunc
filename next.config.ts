import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression (gzip/brotli) for all responses
  compress: true,

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production

  // Logging - disabled to reduce noise from "cache skip" messages
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
