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

  /**
   * www -> apex, permanently.
   *
   * Both hosts currently answer 200, so the whole site exists twice. Most pages emit an apex
   * canonical and are fine, but the pages that cannot set their own metadata do not — which is
   * how www.eatunc.com/privacy/ios ended up in Search Console as a separate URL. A 308 is a
   * stronger and simpler signal than relying on every page getting its canonical right.
   */
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.eatunc.com' }],
        destination: 'https://eatunc.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
