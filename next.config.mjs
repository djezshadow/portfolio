/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  experimental: {
    // Default de Next es 1MB — muy poco para fotos de cámara/celular reales,
    // sobre todo si subís varias juntas. Esto era la causa real del error
    // "unexpected response" al subir fotos.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
