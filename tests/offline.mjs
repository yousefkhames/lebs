// Offline check. Usage: node tests/offline.mjs <url> [selector that must exist after offline reload]
import puppeteer from 'puppeteer-core';
const url = process.argv[2], sel = process.argv[3] || '#app';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto(url, { waitUntil: 'networkidle0' });
const reg = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
await p.reload({ waitUntil: 'networkidle0' }); // make sure page is controlled
const ctl = await p.evaluate(() => !!navigator.serviceWorker.controller);
const man = await p.evaluate(async () => { const l = document.querySelector('link[rel=manifest]'); if (!l) return null; const m = await (await fetch(l.href)).json(); const res = await Promise.all(m.icons.map(i => fetch(new URL(i.src, l.href)).then(r => r.status))); return { name: m.name, icons: res }; });
await p.setOfflineMode(true);
await p.reload({ waitUntil: 'networkidle0' }).catch(e => errs.push('reload: ' + e.message));
const html = await p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.trim().length : -1; }, sel);
const fonts = await p.evaluate(() => document.fonts.size);
console.log(JSON.stringify({ url, swActive: reg, controlled: ctl, manifest: man, offlineContentLen: html, errs }));
const ok = reg && ctl && man && man.icons.every(s => s === 200) && html > 50 && !errs.length;
console.log(ok ? 'OFFLINE PASS' : 'OFFLINE FAIL');
await p.screenshot({ path: process.argv[4] || '/tmp/off.png' });
await b.close(); process.exit(ok ? 0 : 1);
