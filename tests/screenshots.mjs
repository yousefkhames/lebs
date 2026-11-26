// Makes the README screenshots with clean sample data. Usage: BASE_URL=... node tests/screenshots.mjs docs/screenshots
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
const out = process.argv[2] || 'docs/screenshots';
let base = process.env.BASE_URL, srv;
if (!base) { srv = spawn('node', ['tests/serve.js', '8124'], { stdio: 'ignore' }); base = 'http://localhost:8124/'; await new Promise(r => setTimeout(r, 600)); }
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function open(w, h, lang, hash, mobile = true, q = '') {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  await p.goto(base + q, { waitUntil: 'networkidle0' });
  await p.evaluate((l) => { localStorage.clear(); localStorage.setItem('lebs:zahra-studio:lang', JSON.stringify(l)); }, lang);
  await p.goto(base + q + hash, { waitUntil: 'networkidle0' }); await p.reload({ waitUntil: 'networkidle0' }); await sleep(500);
  await p.evaluate(() => { window.open = () => null; });
  return p;
}
const go = async (p, h) => { await p.evaluate(x => { location.hash = x; }, h); await sleep(300); };
let p = await open(390, 844, 'en', '#/'); await p.screenshot({ path: `${out}/home-en.png` });
await go(p, '#/shop'); await p.screenshot({ path: `${out}/shop-en.png` });
await go(p, '#/p/linen-overshirt?color=sage'); await p.click('#sizes [data-size="M"]'); await sleep(200); await p.evaluate(() => window.scrollTo(0, 250)); await sleep(200); await p.screenshot({ path: `${out}/product-en.png` });
await p.close();
p = await open(390, 844, 'ar', '#/p/garden-dress');
await p.click('#sizes [data-size="S"]'); await p.click('#addBag'); await sleep(200);
await go(p, '#/p/wide-trousers'); await p.click('#sizes [data-size="M"]'); await p.click('#addBag'); await sleep(200);
await go(p, '#/cart'); await p.type('#cn', 'منى حسن'); await p.type('#cp', '01001112233'); await p.type('#ca', '١٤ شارع النخيل، سموحة، الإسكندرية');
await p.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 330); }); await sleep(2800); await p.screenshot({ path: `${out}/cart-ar.png` });
await go(p, '#/new'); await p.evaluate(() => window.scrollTo(0, 0)); await sleep(200); await p.screenshot({ path: `${out}/new-ar.png` });
await p.close();
p = await open(1280, 820, 'en', '#/', false); await p.screenshot({ path: `${out}/home-desktop-en.png` }); await p.close();
p = await open(1280, 820, 'ar', '#/shop?cat=dresses', false); await p.screenshot({ path: `${out}/shop-desktop-ar.png` }); await p.close();
p = await open(390, 844, 'en', '#/shop', true, '?demo=noor'); await p.screenshot({ path: `${out}/demo-noor.png` }); await p.close();
await b.close(); if (srv) srv.kill(); console.log('screenshots written to ' + out);
