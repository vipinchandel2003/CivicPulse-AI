/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@civicpulse/ui", "@civicpulse/api-client"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

module.exports = nextConfig;
