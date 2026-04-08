import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export',
  // Note: rewrites only work in 'next dev' when output: 'export' is disabled.
  // In production, FastAPI hosts the files at the same origin, so it works natively.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/reset',
        destination: 'http://localhost:8000/reset',
      },
      {
        source: '/step',
        destination: 'http://localhost:8000/step',
      },
      {
        source: '/state',
        destination: 'http://localhost:7860/state',
      },
      {
        source: '/admin/stats',
        destination: 'http://localhost:7860/admin/stats',
      },
      {
        source: '/kb/all',
        destination: 'http://localhost:7860/kb/all',
      },
    ];
  },
  experimental: {
    /* config options here */
  },
};

export default nextConfig;
