import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
