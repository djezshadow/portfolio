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
    // Bug reportado: "guardo y vuelve a como estaba antes, a pesar de
    // que se haya guardado" — el guardado SÍ funciona (queda bien en la
    // base), pero Next.js guarda en el navegador una copia en caché de
    // cada página del admin por unos segundos después de navegarla. Si
    // volvés a esa pantalla (aunque sea por otro link del admin y
    // volviendo) antes de que esa caché venza, te muestra la versión
    // vieja que tenía guardada, no la real. `dynamic: 0` apaga esa
    // caché para páginas dinámicas (todo el admin lo es), así que
    // siempre trae los datos frescos de la base.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
