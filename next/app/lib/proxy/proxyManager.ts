import { ProxyConfig, ProxyStats } from "./types";
import { PROXY_SERVERS } from "./proxyList";

export class ProxyManager {
  private proxies: ProxyConfig[];
  private statsMap: Map<string, ProxyStats>;
  private readonly MAX_FAILS = 3;
  private readonly FAIL_RESET_TIME = 1000 * 60 * 30; // 30 minutes
  private currentIndex: { [key: string]: number } = {};

  constructor() {
    this.proxies = [...PROXY_SERVERS];
    this.statsMap = new Map();
    this.initializeStats();
  }

  private initializeStats() {
    this.proxies.forEach((proxy) => {
      this.statsMap.set(proxy.host, {
        successRate: 100,
        averageResponseTime: 0,
        lastChecked: new Date(),
      });
    });
  }

  public getProxyForRegion(region: string): ProxyConfig {
    // Initialize index for region if it doesn't exist
    if (!(region in this.currentIndex)) {
      this.currentIndex[region] = 0;
    }

    // Get proxy and increment index
    const proxy = this.proxies[this.currentIndex[region]];

    // Rotate to next proxy
    this.currentIndex[region] =
      (this.currentIndex[region] + 1) % this.proxies.length;

    return proxy;
  }

  private isProxyInRegion(
    proxyLocation: string,
    targetRegion: string
  ): boolean {
    // Map regions to proxy locations
    const regionMap: { [key: string]: string[] } = {
      "Western Cape": ["ZA"],
      "Eastern Cape": ["ZA"],
      "KwaZulu-Natal": ["ZA"],
      Bali: ["SG", "JP"],
      // Add more region mappings as needed
    };

    return regionMap[targetRegion]?.includes(proxyLocation) || false;
  }

  public reportProxySuccess(host: string, responseTime: number) {
    const proxy = this.proxies.find((p) => p.host === host);
    if (!proxy) return;

    const stats = this.statsMap.get(host);
    if (stats) {
      stats.successRate = stats.successRate * 0.9 + 100 * 0.1;
      stats.averageResponseTime =
        stats.averageResponseTime * 0.9 + responseTime * 0.1;
      stats.lastChecked = new Date();
    }
  }

  public reportProxyFailure(host: string) {
    const proxy = this.proxies.find((p) => p.host === host);
    if (!proxy) return;

    proxy.failCount++;

    const stats = this.statsMap.get(host);
    if (stats) {
      stats.successRate = Math.max(0, stats.successRate * 0.8);
      stats.lastChecked = new Date();
    }

    if (proxy.failCount >= this.MAX_FAILS) {
      proxy.isActive = false;
      setTimeout(() => {
        proxy.failCount = 0;
        proxy.isActive = true;
      }, this.FAIL_RESET_TIME);
    }
  }

  private resetFailCounts() {
    this.proxies.forEach((proxy) => {
      proxy.failCount = 0;
      proxy.isActive = true;
    });
  }

  public getProxyStats(): Map<string, ProxyStats> {
    return new Map(this.statsMap);
  }
}
