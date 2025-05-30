import { ProxyClient } from '../../proxyClient';

async function testProxy() {
	const client = new ProxyClient();
	console.log('Starting proxy test...');

	try {
		// Test with actual Windfinder URL
		console.log('Testing with Windfinder...');
		const response = await client.fetch('https://www.windfinder.com/forecast/muizenberg_beach');

		console.log('✅ Proxy Response:', {
			status: response.statusCode,
			contentLength: response.html.length,
			cfRay: response.headers['cf-ray'],
			cfPop: response.headers['cf-pop'],
			cacheStatus: response.headers['cf-cache-status'],
		});

		// Check if we got the actual forecast page
		if (response.html.includes('weathertable') || response.html.includes('forecast-table')) {
			console.log('✅ Successfully retrieved forecast data!');
		} else {
			console.log('⚠️ Got response but no forecast data found - might be blocked');
			// Log first 200 chars to see what we got
			console.log('Response preview:', response.html.slice(0, 200));
		}
	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

testProxy();
