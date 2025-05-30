// List of realistic user agents
const USER_AGENTS = [
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// Common CDN and browser headers
const CDN_HEADERS = {
	'Accept-Encoding': 'gzip, deflate, br',
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
	'Accept-Language': 'en-US,en;q=0.5,en-GB;q=0.3',
	'Cache-Control': 'max-age=0',
	'Sec-Fetch-Dest': 'document',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-Site': 'none',
	'Sec-Fetch-User': '?1',
	'Upgrade-Insecure-Requests': '1',
	Connection: 'keep-alive',
	DNT: '1',
};

// Regional POP configurations
const POPS = {
	JNB: { city: 'Johannesburg', country: 'ZA', continent: 'AF' },
	CPT: { city: 'Cape Town', country: 'ZA', continent: 'AF' },
	DUR: { city: 'Durban', country: 'ZA', continent: 'AF' },
};

export default {
	async fetch(request: Request) {
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
			const url = new URL(request.url);
			const targetUrl = url.searchParams.get('url');

			if (!targetUrl) {
				return new Response('Missing target URL', { status: 400 });
			}

			// Simulate real browser/CDN behavior with slight delays
			await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));

			// Select a random POP
			const pop = POPS[Object.keys(POPS)[Math.floor(Math.random() * Object.keys(POPS).length)] as keyof typeof POPS];

			// Generate realistic CF-RAY ID
			const timestamp = Date.now().toString(16).slice(-8);
			const random = Array.from({ length: 8 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
			const cfRay = `${timestamp}${random}-${pop.city.slice(0, 3).toUpperCase()}`;

			// Construct headers that look like CDN traffic
			const headers = new Headers({
				...CDN_HEADERS,
				'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
				'CF-IPCountry': pop.country,
				'CF-RAY': cfRay,
				'CF-Connecting-IP': request.headers.get('cf-connecting-ip') || '',
				'X-Real-IP': request.headers.get('cf-connecting-ip') || '',
				Via: '1.1 vegur, 1.1 varnish, 1.1 cloudflare',
				'CF-Cache-Status': Math.random() > 0.7 ? 'HIT' : 'MISS',
			});

			const response = await fetch(targetUrl, {
				method: request.method,
				headers,
				redirect: 'follow',
			});

			// Add CDN-like response headers
			const responseHeaders = new Headers(response.headers);
			responseHeaders.set('access-control-allow-origin', '*');
			responseHeaders.set('cf-cache-status', Math.random() > 0.7 ? 'HIT' : 'MISS');
			responseHeaders.set('cf-ray', cfRay);
			responseHeaders.set('server', 'cloudflare');
			responseHeaders.set('x-cache', Math.random() > 0.5 ? 'HIT' : 'MISS');
			responseHeaders.set('age', Math.floor(Math.random() * 300).toString());
			responseHeaders.set('x-tls-version', '1.3');
			responseHeaders.set('x-frame-options', 'SAMEORIGIN');
			responseHeaders.set('cf-pop', pop.city.slice(0, 3).toUpperCase());

			// Add realistic cache timings
			if (responseHeaders.get('cf-cache-status') === 'HIT') {
				responseHeaders.set('age', Math.floor(Math.random() * 300).toString());
				responseHeaders.set('x-cache-hits', Math.floor(Math.random() * 5 + 1).toString());
			}

			return new Response(response.body, {
				status: response.status,
				headers: responseHeaders,
			});
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return new Response(`Proxy error: ${errorMessage}`, {
				status: 500,
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			});
		}
	},
};
