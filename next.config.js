/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
