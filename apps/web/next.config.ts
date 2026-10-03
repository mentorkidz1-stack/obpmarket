import type { NextConfig } from "next";

// Les photos du catalogue sont servies par l'API : Next les redimensionne et les met en cache sur son CDN.
function apiImagePattern() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");
    return [{ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, port: url.port }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: apiImagePattern(),
    formats: ["image/avif", "image/webp"],
    // Les adresses d'images de l'API portent un paramètre de version : elles ne changent jamais pour une même photo.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [60, 75],
  },
};

export default nextConfig;
