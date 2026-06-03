import type { NextConfig } from "next";
import path from "node:path";

const imageHostnames = Array.from(
  new Set(
    [
      ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "res.cloudinary.com")
        .split(",")
        .map((hostname) => hostname.trim())
        .filter(Boolean),
      "ui-avatars.com"
    ]
  )
);

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...imageHostnames.map((hostname) => ({
        protocol: "https" as const,
        hostname
      })),
      {
        protocol: "http",
        hostname: "localhost"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1"
      }
    ]
  }
};

export default nextConfig;
