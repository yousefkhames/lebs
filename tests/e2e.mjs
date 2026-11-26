// Real-browser click-through. Usage: BASE_URL=https://.../ node tests/e2e.mjs   (default: starts a local server)
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

let base = process.env.BASE_URL, srv;
if (!base) { srv = spawn('node', ['tests/serve.js', '8123'], { stdio: 'ignore' }); base = 'http://localhost:8123/'; await new Promise(r => setTimeout(r, 600)); }
const shots = process.env.SHOTS_DIR;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
page.on('requestfailed', r => problems.push('requestfailed: ' + r.url()));
page.on('response', r => { if (r.status() >= 400) problems.push('http ' + r.status() + ' ' + r.url()); });
let n = 0; const ok = (m) => console.log('  ok ' + (++n) + ' ' + m);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = (s) => page.$(s);
const text = (s) => page.$eval(s, e => e.textContent.trim());
const count = (s) => page.$$eval(s, e => e.length);
const go = async (hash) => { await page.evaluate(h => { location.hash = h; }, hash); await sleep(150); };
const shot = async (name, o = {}) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png`, ...o }); };
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

console.log('E2E against ' + base);
await page.goto(base, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle0' });

// --- language and direction
assert.equal(await page.$eval('html', e => e.dir), 'rtl'); assert.equal(await page.$eval('html', e => e.lang), 'ar'); ok('default language is Arabic, page is RTL');
assert.match(await text('.brand-name'), /زهرة/); ok('brand name from config (Arabic)');
await shot('home-ar', { fullPage: false });
await page.click('#langBtn'); await sleep(150);
assert.equal(await page.$eval('html', e => e.dir), 'ltr'); assert.equal(await text('.brand-name'), 'Zahra Studio'); ok('switch to English flips to LTR');
assert.match(await page.title(), /Zahra Studio/); ok('document title follows brand and language');
await page.reload({ waitUntil: 'networkidle0' }); assert.equal(await page.$eval('html', e => e.lang), 'en'); ok('language choice persists after reload');
assert.ok((await count('.hang')) === 3 && (await count('.tag')) >= 4); ok('home shows the rail and new-arrival tags');
assert.ok((await overflow()) <= 0); ok('home: no horizontal overflow on a 390px phone');
await shot('home-en');

// --- shop filters
await go('#/shop'); assert.equal(await count('.tag'), 16); ok('shop lists all 16 products');
await shot('shop-en');
await page.click('.chip[href*="cat=dresses"]'); await sleep(200); assert.equal(await count('.tag'), 4); ok('category chip filters to dresses (4)');
await page.click('#fbtn'); await sleep(100);
await page.click('.size-chip[href*="size=Free"]'); await sleep(200); assert.equal(await count('.tag'), 2); ok('size filter: dresses available in Free size (2 abayas)');
await go('#/shop'); await page.click('#fbtn'); await page.click('#sq'); await page.type('#sq', 'olive'); await sleep(500);
assert.ok((await count('.tag')) >= 4 && (await text('#count')).includes('items')); ok('search by color name works');
await page.$eval('#sq', e => { e.value = ''; e.dispatchEvent(new Event('input')); }); await sleep(500);
await go('#/shop?sale=1'); assert.equal(await count('.tag'), 3); ok('on-sale filter shows 3');
await page.select('#sort', 'low'); await sleep(200);
const prices = await page.$$eval('.tag .pr .price', els => els.map(e => parseInt(e.textContent.replace(/[^\d]/g, ''))));
assert.deepEqual(prices, [...prices].sort((a, b) => a - b)); ok('sort by price low to high');
await go('#/shop?q=zzzz'); assert.equal(await count('.tag'), 0); assert.ok(await $('.empty')); ok('empty state for no results');

// --- card swatch + favorites
await go('#/shop');
const before = await page.$eval('.tag .tag-img svg', e => e.innerHTML);
await page.click('.tag .swatch:nth-of-type(2)'); await sleep(100);
assert.notEqual(before, await page.$eval('.tag .tag-img svg', e => e.innerHTML)); ok('clicking a card swatch recolors the photo');
await page.click('.tag [data-fav]'); await sleep(100);
assert.equal(await count('.tag .fav.on'), 1); ok('heart saves a product');
await page.reload({ waitUntil: 'networkidle0' }); await go('#/saved'); assert.equal(await count('.tag'), 1); ok('saved list persists after reload');
await page.click('.tag [data-fav]'); await sleep(100); assert.ok(await $('.empty')); ok('unsaving empties the list');

// --- product page
await go('#/p/zip-hoodie'); await sleep(200);
assert.equal(await text('h1'), 'Brushed zip hoodie'); ok('product page renders');
assert.equal(await count('.thumb'), 3); ok('gallery has 3 views');
await page.click('.thumb:nth-child(3)'); await sleep(100); assert.equal(await count('.thumb.on'), 1); ok('thumbnail switches the view');
await page.click('.pdp .opt .swatch[data-color="sand"]'); await sleep(100); assert.equal(await text('#colorName'), 'Sand'); ok('color swatch updates color name');
await page.click('#addBag'); await sleep(100); assert.equal(await text('#pickHint'), 'Pick a size'); ok('adding without size asks for a size');
await shot('product-en');
await page.click('#sizes [data-size="S"]'); await sleep(100); assert.match(await text('#stockMsg'), /Only 2 left/); ok('low-stock message shows for size S');
await page.click('#qp'); await page.click('#qp'); await page.click('#qp'); assert.equal(await text('#qv'), '2'); ok('quantity stepper stops at stock (2)');
await page.click('#addBag'); await sleep(150); assert.equal(await text('#bagCount'), '2'); ok('add to bag updates the bag count (2)');
assert.match(await text('#stockMsg'), /No more/); ok('no more pieces after reaching stock');
await page.click('#sizes [data-size="M"]'); await page.click('#qm'); await page.click('#addBag'); await sleep(100); assert.equal(await text('#bagCount'), '3'); ok('different size adds a new line');
await go('#/p/linen-overshirt'); assert.ok(await page.$eval('#sizes [data-size="XL"]', e => e.disabled)); ok('sold-out size is disabled');
assert.ok(await $('.pdp .tag')); ok('related products shown');

// --- cart and checkout (stub window.open to capture the WhatsApp link)
await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
await go('#/cart'); assert.equal(await count('.line'), 2); ok('cart shows 2 lines');
const sub0 = await text('.sum div:first-child dd');
await page.click('.line:nth-child(2) [data-q="1"]'); await sleep(150);
const sub1 = await text('.sum div:first-child dd'); assert.notEqual(sub0, sub1); ok('cart qty change updates subtotal');
await page.click('.line:nth-child(2) [data-q="-1"]'); await sleep(100);
await shot('cart-en');
await page.click('#send'); await sleep(100);
assert.ok((await text('#en')).length && (await text('#ep')).length && (await text('#ea')).length); ok('empty checkout shows 3 field errors');
assert.equal(await page.evaluate(() => window.__opened.length), 0); ok('nothing opened while invalid');
await page.type('#cn', 'Mona Hassan'); await page.type('#cp', '123'); await page.type('#ca', '5 Sample Street, Alexandria');
await page.click('#send'); await sleep(100); assert.ok((await text('#ep')).length); ok('short phone rejected');
await page.$eval('#cp', e => e.value = ''); await page.type('#cp', '0100 111 2233'); await page.type('#cx', 'Please call first');
await page.click('#send'); await sleep(250);
const opened = await page.evaluate(() => window.__opened); assert.equal(opened.length, 1); ok('submit opens exactly one WhatsApp link');
assert.ok(opened[0].startsWith('https://wa.me/201000000000?text=')); ok('link targets the configured number');
const msg = decodeURIComponent(opened[0].split('text=')[1]);
assert.match(msg, /Hello Zahra Studio/); assert.match(msg, /Brushed zip hoodie/); assert.match(msg, /Mona Hassan/); assert.match(msg, /201001112233/); assert.match(msg, /5 Sample Street/); assert.match(msg, /Please call first/); assert.match(msg, /Delivery: free/); assert.match(msg, /Ref: LB-/); ok("message has items, customer, phone normalised, free delivery over 1,500");
assert.ok(await $('.sent .msg')); assert.ok(await $('#again')); ok('confirmation screen with message and re-open link');
await shot('sent-en');
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('lebs:zahra-studio:cart')).length), 0); ok('bag is cleared after sending');

// --- orders history + reorder
await go('#/orders'); assert.equal(await count('.order'), 1); assert.match(await text('.order'), /Order/); ok('order saved in history');
await shot('orders-en');
await page.click('[data-re="0"]'); await sleep(200); assert.ok(page.url().includes('#/cart')); assert.ok((await count('.line')) >= 1); ok('reorder refills the bag');

// --- reservation flow
await page.evaluate(() => localStorage.setItem('lebs:zahra-studio:cart', '[]')); await page.reload({ waitUntil: 'networkidle0' });
await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
await go('#/p/open-abaya'); await page.click('#sizes [data-size="Free"]'); await page.click('#reserveBtn'); await sleep(250);
assert.ok(page.url().includes('mode=reserve')); assert.equal(await count('#ca'), 0); assert.equal(await count('.sum div'), 2); ok('Reserve goes to checkout in reserve mode (no address, no delivery fee)');
await page.$eval('#cn', e => e.value = ''); await page.type('#cn', 'Mona Hassan'); await page.$eval('#cp', e => e.value = ''); await page.type('#cp', '01001112233');
await page.click('#send'); await sleep(250);
const m2 = decodeURIComponent((await page.evaluate(() => window.__opened[0])).split('text=')[1]);
assert.match(m2, /reserve these items for pickup/); assert.match(m2, /hold them for 48 hours/); assert.ok(!/Address:/.test(m2)); ok('reservation message: pickup, 48h hold, no address');

// --- Arabic order message
await go('#/shop'); await page.click('#langBtn'); await sleep(200);
assert.equal(await page.$eval('html', e => e.dir), 'rtl');
await go('#/p/heavy-tee'); await page.click('#sizes [data-size="L"]'); await page.click('#addBag'); await sleep(100); await go('#/cart');
await page.$eval('#cn', e => e.value = 'منى حسن'); await page.$eval('#cp', e => e.value = '٠١٠٠١١١٢٢٣٣'); await page.$eval('#ca', e => e.value = '٥ شارع التجربة');
await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
await shot('cart-ar');
await page.click('#send'); await sleep(250);
const m3 = decodeURIComponent((await page.evaluate(() => window.__opened[0])).split('text=')[1]);
assert.match(m3, /مرحباً زهرة ستوديو/); assert.match(m3, /201001112233/); assert.match(m3, /الإجمالي/); assert.match(m3, /التوصيل: ٦٠/); ok('Arabic order message, Arabic-Indic digits in phone normalised');

// --- new arrivals, about, 404, overflow on every page, both languages
await go('#/new'); assert.ok((await count('.arrivals')) >= 2 && (await count('.timeline')) >= 2); ok('new arrivals page groups by week');
await shot('new-ar');
for (const lang of ['ar', 'en']) {
  await page.evaluate(l => localStorage.setItem('lebs:zahra-studio:lang', JSON.stringify(l)), lang); await page.reload({ waitUntil: 'networkidle0' });
  for (const h of ['#/', '#/shop', '#/new', '#/p/garden-dress', '#/cart', '#/saved', '#/orders', '#/about', '#/nowhere']) {
    await go(h); await sleep(120);
    assert.ok((await overflow()) <= 0, `overflow on ${h} (${lang})`);
  }
  ok(`${lang}: no horizontal overflow on any page (390px)`);
}
await go('#/about'); assert.match(await text('.about'), /Alexandria|الإسكندرية/); ok('about page shows config contact info');
await page.setViewport({ width: 1280, height: 800 });
await go('#/'); await sleep(200); assert.ok(await page.$eval('.nav', e => getComputedStyle(e).display !== 'none')); assert.ok(await page.$eval('#dock', e => getComputedStyle(e).display === 'none')); ok('desktop: top nav shown, bottom dock hidden');
await shot('home-desktop-en');

// --- share + color in URL
await page.evaluate(() => localStorage.setItem('lebs:zahra-studio:lang', '"en"')); await page.reload({ waitUntil: 'networkidle0' });
await go('#/p/heavy-tee'); await sleep(200);
await page.click('.pdp .opt .swatch[data-color="clay"]'); await sleep(100);
assert.ok(page.url().includes('color=clay')); ok('chosen color goes into the product URL');
await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); });
await page.click('#shareBtn'); await sleep(100);
const sh = await page.evaluate(() => window.__opened[0]); assert.ok(sh.startsWith('https://wa.me/?text=') && decodeURIComponent(sh).includes('color=clay')); ok('share falls back to a WhatsApp link that keeps the color');
await page.goto(base + '#/p/heavy-tee?color=olive', { waitUntil: 'networkidle0' }); await sleep(200);
assert.equal(await text('#colorName'), 'Olive'); ok('opening a product link with ?color= preselects it');

// --- rebranding demo (?demo=noor) and broken config handling
const demo = await browser.newPage(); await demo.setViewport({ width: 390, height: 844, isMobile: true });
await demo.goto(base + '?demo=noor#/shop', { waitUntil: 'networkidle0' });
assert.equal(await demo.$eval('.brand-name', e => e.textContent.trim()), 'Noor Boutique'); ok('?demo=noor loads the second brand from its own config');
assert.equal(await demo.$eval('html', e => e.dir), 'ltr'); assert.equal(await demo.$$eval('.tag', e => e.length), 6); assert.match(await demo.$eval('.tag .pr', e => e.textContent), /AED/); ok('second brand: own language default, 6 products, AED prices');
assert.notEqual(await demo.$eval('body', e => getComputedStyle(e).backgroundColor), await page.$eval('body', e => getComputedStyle(e).backgroundColor)); ok('second brand: different theme colors');
if (shots) await demo.screenshot({ path: `${shots}/demo-noor.png` });
await demo.close();
assert.deepEqual(problems, [], 'browser problems so far: ' + problems.join(' | '));
const bad = await browser.newPage(); await bad.goto(base + '?demo=does-not-exist', { waitUntil: 'networkidle0' });
assert.match(await bad.$eval('#app', e => e.textContent), /config/i); ok('missing config shows a readable error instead of a blank page');
await bad.close();
problems.length = 0; // the 404 above is expected

// --- keyboard: tab reaches the language button and Enter activates it
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.evaluate(() => localStorage.setItem('lebs:zahra-studio:lang', '"en"')); await page.reload({ waitUntil: 'networkidle0' });
await page.focus('#langBtn'); await page.keyboard.press('Enter'); await sleep(200); assert.equal(await page.$eval('html', e => e.lang), 'ar'); ok('language toggle works from the keyboard');

assert.deepEqual(problems, [], 'browser problems: ' + problems.join(' | ')); ok('no console errors, failed requests or HTTP errors');
console.log(`PASS ${n} checks`);
await browser.close(); if (srv) srv.kill();
