import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.smogon.com',
      },
      {
        protocol: 'https',
        hostname: 'play.pokemonshowdown.com',
      },
      {
        protocol: 'https',
        hostname: 'archives.bulbagarden.net',
      },
      {
        // Vercel Blob store public delivery hostname (uploaded logos/avatars/sprites).
        protocol: 'https',
        hostname: 'vcxdskshtqjxcydf.public.blob.vercel-storage.com',
      },
    ],
  },
  async rewrites() {
    // Proxy all /api/* calls through the frontend origin to the backend.
    // This makes the backend's session cookie first-party to the frontend
    // domain, so the edge middleware (which forwards the request's cookies)
    // can see it. Without this, cross-domain (vercel.app vs railway.app)
    // cookies aren't sent on frontend-domain requests and every protected
    // route bounces to /?next=. In local dev the browser hits the backend
    // directly (NEXT_PUBLIC_API_BASE_URL=localhost:3000), so this is unused.
    const backend = process.env.INTERNAL_API_BASE_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // A `sprite` override URL from a host not already listed here (and in
              // images.remotePatterns above) will silently fail to render — add the
              // host to both before using it.
              "img-src 'self' https://raw.githubusercontent.com https://www.smogon.com https://play.pokemonshowdown.com https://archives.bulbagarden.net https://vcxdskshtqjxcydf.public.blob.vercel-storage.com data:",
              // connect-src also allows the Vercel Blob API + store host so the
              // client-side upload() XHR (token exchange returns a token, then the
              // file is PUT to Blob) isn't blocked by CSP.
              `connect-src 'self' ${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'} https://vercel.com https://blob.vercel-storage.com https://vcxdskshtqjxcydf.public.blob.vercel-storage.com`,
              "font-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
