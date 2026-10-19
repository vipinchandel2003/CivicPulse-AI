/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@civicpulse/ui", "@civicpulse/api-client", "tailwind-merge", "clsx"],
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
