/** @type {import('next').NextConfig} */
const BACKEND_ORIGIN =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "https://skillcert-ai-1.onrender.com";

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
