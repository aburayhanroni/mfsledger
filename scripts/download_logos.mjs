import https from 'https';
import fs from 'fs';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html = await fetchPage('https://logotyp.us/logo/bkash/');
    const match = html.match(/https:\/\/[^"']+\.svg/i);
    console.log('Matched SVG URL:', match ? match[0] : null);
    if (match) {
      const svgData = await fetchPage(match[0]);
      console.log('SVG data length:', svgData.length);
      fs.writeFileSync('public/logos/bkash.svg', svgData);
      console.log('Saved public/logos/bkash.svg');
    }
  } catch (err) {
    console.error(err);
  }
}

run();

