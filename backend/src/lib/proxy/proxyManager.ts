// Simplified proxy manager for backend
// Can be enhanced later with actual proxy rotation

interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export class ProxyManager {
  getProxyForRegion(region: string): ProxyConfig | null {
    // Return null for now - no proxy needed
    // Can be enhanced later
    return null;
  }
}
