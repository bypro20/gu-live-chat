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
    const baseSecurity = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ] as const;

    return [
      // Müşteri sitelerinde embed edilen sohbet iframe'i — X-Frame-Options SAMEORIGIN engeller
      {
        source: '/widget/:path*',
        headers: [
          ...baseSecurity,
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
        ],
      },
      {
        source: '/((?!widget).*)',
        headers: [
          ...baseSecurity,
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;