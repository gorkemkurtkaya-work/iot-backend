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
  devIndicators: false,
};

export default nextConfig;