/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ✅ Carga tu variable del entorno
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },

  // 🚫 Desactiva lightningcss para evitar errores nativos en Docker
  experimental: {
    optimizeCss: false,
  },
}

export default nextConfig