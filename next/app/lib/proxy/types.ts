export interface ProxyConfig {
  host: string;
  port: number;
  location: string;
  failCount: number;
  isActive: boolean;
  lastUsed?: Date;
  username?: string;
  password?: string;
  isDirect?: boolean;
  isCloudflare?: boolean;
}

export interface ProxyStats {
  successRate: number;
  averageResponseTime: number;
  lastChecked: Date;
}
