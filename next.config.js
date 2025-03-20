/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    },
  };
  
  module.exports = nextConfig;
  