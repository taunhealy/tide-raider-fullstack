import { ProxyConfig } from "./types";

export const PROXY_SERVERS: ProxyConfig[] = [
  // Your direct IP (most legitimate)
  {
    host: "direct",
    port: 0, // Not used for direct
    location: "ZA",
    failCount: 0,
    isActive: true,
    isDirect: true,
  },
  // Cloudflare Worker (looks like normal CDN traffic)
  {
    host: "wind-proxy.tideraider.workers.dev",
    port: 443,
    location: "AUTO",
    failCount: 0,
    isActive: true,
    isCloudflare: true,
  },
  // You can add more Cloudflare Workers by deploying with different names
  // {
  //   host: "wind-proxy-2.tideraider.workers.dev",
  //   port: 443,
  //   location: "AUTO",
  //   failCount: 0,
  //   isActive: true,
  //   isCloudflare: true
  // },
];
