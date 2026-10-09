/** @type {import('next').NextConfig} */
const BACKEND_ORIGIN = "https://skillcert-ai-1.onrender.com";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
