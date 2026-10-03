import type { NextConfig } from "next";
import os from "os";

// Helper function to get all local IPv4 addresses
function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (iface) {
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
          ips.push(alias.address);
        }
      }
    }
  }
  return ips;
}

const localIps = getLocalIps();
const dynamicDevOrigins = localIps.flatMap(ip => [
  `http://${ip}:3000`,
  `http://${ip}`,
  `${ip}:3000`,
  ip
]);

import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Dynamically allow current local network IP to access dev server without CORS issues
  allowedDevOrigins: [
    ...dynamicDevOrigins
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", ...dynamicDevOrigins]
    }
  },
  turbopack: {}
};

export default withSerwist(nextConfig);
