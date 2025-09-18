/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'your-production-domain.com'],
    unoptimized: true,
  },
};

module.exports = nextConfig;