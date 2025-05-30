export interface ProxyResponse {
  html: string;
  ip: string;
  statusCode: number;
  headers: Record<string, string>;
}

export class ProxyClient {
  private readonly workerUrl: string;
  private readonly maxRetries: number;
  private lastUsed: Date | null;
  private readonly minDelayBetweenRequests: number;

  constructor() {
    this.workerUrl = "https://wind-proxy.tideraider.workers.dev";
    this.maxRetries = 3;
    this.lastUsed = null;
    this.minDelayBetweenRequests = 5000; // 5 seconds minimum between requests
  }

  private async enforceRateLimit(): Promise<void> {
    if (this.lastUsed) {
      const timeSinceLastUse = Date.now() - this.lastUsed.getTime();
      if (timeSinceLastUse < this.minDelayBetweenRequests) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minDelayBetweenRequests - timeSinceLastUse)
        );
      }
    }
  }

  async fetch(url: string, retryCount = 0): Promise<ProxyResponse> {
    await this.enforceRateLimit();

    try {
      const proxyUrl = `${this.workerUrl}?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);
      this.lastUsed = new Date();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        html: await response.text(),
        ip: headers["cf-connecting-ip"] || "unknown",
        statusCode: response.status,
        headers,
      };
    } catch (error) {
      console.error(
        `Proxy error (attempt ${retryCount + 1}/${this.maxRetries}):`,
        error
      );

      if (retryCount < this.maxRetries - 1) {
        const backoffTime = Math.pow(2, retryCount) * 1000;
        await new Promise((r) => setTimeout(r, backoffTime));
        return this.fetch(url, retryCount + 1);
      }

      throw error;
    }
  }
}
