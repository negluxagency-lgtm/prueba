import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/perfil',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
