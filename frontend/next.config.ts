/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config: any) => {
    config.externals.push({
      'react-native-config': 'react-native-config',
    });
    return config;
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000',process.env.NEXT_PUBLIC_BACKEND_URL],
    },
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;