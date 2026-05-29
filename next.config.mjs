/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent prerender failures when env vars aren't set
  experimental: {},
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
