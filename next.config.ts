import type { NextConfig } from "next";
import path from "path";

/** Railway socket — Vercel rewrite ile aynı origin (CORS sorunu olmadan) */
const SOCKET_UPSTREAM = (
  process.env.SOCKET_SERVER_URL ||
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://gu-live-chat-socket-production.up.railway.app"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/downloads/guchat.apk',
        destination: '/downloads/gulivechat.apk',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination: `${SOCKET_UPSTREAM}/socket.io/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
};

export default nextConfig;