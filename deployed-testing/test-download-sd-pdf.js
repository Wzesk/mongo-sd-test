// Updated test to validate caching (HIT/MISS) and bypass functionality for PDF export
const BASE_URL = 'https://mongo-sd-server.onrender.com';
const DESIGN_ID = '6890bea78fd7fefbbc259426';

async function requestPdf(label, extraBody={}) {
	const resp = await fetch(`${BASE_URL}/api/data/download`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			designId: DESIGN_ID,
			exportType: 'download',
			exportNameContains: 'pdf',
			...extraBody
		})
	});
	const ct = resp.headers.get('content-type');
	const cache = resp.headers.get('x-cache');
	if (resp.status === 200 && ct && ct.includes('application/pdf')) {
		const buf = await resp.arrayBuffer();
		console.log(`${label}: OK size=${buf.byteLength} cache=${cache}`);
	} else {
		try {
			const data = await resp.json();
			console.log(`${label}: FAIL`, data);
		} catch {
			const text = await resp.text();
			console.log(`${label}: FAIL raw=${text.substring(0,120)}`);
		}
	}
}

(async () => {
	console.log('--- PDF Cache Test Sequence ---');
	await requestPdf('First (expect MISS)');
	await requestPdf('Second (expect HIT)');
	await requestPdf('Bypass (expect MISS)', { bypassCache: true });
	await requestPdf('After bypass (expect HIT)');
})();
