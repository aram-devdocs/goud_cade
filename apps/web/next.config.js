/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@repo/ui',
    '@repo/hooks',
    '@repo/scene',
    '@repo/games',
  ],
};

module.exports = nextConfig;

