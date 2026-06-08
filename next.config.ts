import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Security Headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },

  // ── Image Optimization ────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // ── TypeScript ────────────────────────────────────────────────────────────
  typescript: {
    // Fail the build on type errors in production
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
