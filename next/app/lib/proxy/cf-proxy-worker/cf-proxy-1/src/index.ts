export default {
	async fetch(request: Request) {
		// CORS headers for browser requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		try {
			// Get target URL from query parameter
			const url = new URL(request.url);
			const targetUrl = url.searchParams.get('url');

			if (!targetUrl) {
				return new Response('Missing target URL', { status: 400 });
			}

			// Add random delay (1-3 seconds)
			await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));

			// Setup request headers
			const headers = new Headers({
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				Connection: 'keep-alive',
			});

			// Make the request to the target URL
			const response = await fetch(targetUrl, {
				method: request.method,
				headers: headers,
				redirect: 'follow',
			});

			// Add CORS header to response
			const responseHeaders = new Headers(response.headers);
			responseHeaders.set('Access-Control-Allow-Origin', '*');

			// Return the proxied response
			return new Response(response.body, {
				status: response.status,
				headers: responseHeaders,
			});
		} catch (error) {
			console.error('Proxy error:', error);
			return new Response(`Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
				status: 500,
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			});
		}
	},
};
