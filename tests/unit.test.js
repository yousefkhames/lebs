const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../site/js/lib.js');
const I = require('../site/js/i18n.js');
global.window = {}; require('../site/lebs.config.js');
const cfg = window.LEBS_CONFIG, NOW = Date.now();

test('demo config is valid', () => assert.deepEqual(L.validateConfig(cfg), []));
test('validateConfig catches mistakes', () => {
  const bad = JSON.parse(JSON.stringify(cfg));
  bad.products[0].colors = ['nope']; bad.products[1].id = bad.products[0].id; bad.whatsapp.number = '12';
  const e = L.validateConfig(bad).join('|');
  assert.match(e, /not in palette/); assert.match(e, /duplicate id/); assert.match(e, /whatsapp.number/);
});
test('i18n: both languages have the same keys, no empty strings', () => {
  assert.deepEqual(Object.keys(I.en).sort(), Object.keys(I.ar).sort());
  for (const l of ['en', 'ar']) for (const [k, v] of Object.entries(I[l])) assert.ok(v !== '', l + '.' + k);
  assert.equal(I.ar.dir, 'rtl'); assert.equal(I.en.dir, 'ltr');
});
test('config text is bilingual everywhere it should be', () => {
  const chk = (o, w) => { assert.ok(o && o.en && o.ar, w); };
  chk(cfg.brand.name, 'brand'); chk(cfg.brand.tagline, 'tagline'); chk(cfg.hero.title, 'hero'); chk(cfg.about.text, 'about');
  cfg.perks.forEach((p, i) => chk(p, 'perk' + i)); cfg.products.forEach(p => { chk(p.name, p.id); chk(p.desc, p.id + ' desc'); });
  Object.entries(cfg.palette).forEach(([k, v]) => { chk(v, k); assert.match(v.hex, /^#[0-9a-f]{6}$/i); });
});
test('phones', () => {
  assert.equal(L.normalizePhone('010 3431 0323', '20'), '201034310323');
  assert.equal(L.normalizePhone('+20 103-431-0323'), '201034310323');
  assert.equal(L.normalizePhone('٠١٠٣٤٣١٠٣٢٣', '20'), '201034310323');
  assert.equal(L.normalizePhone('0044 7700 900123'), '447700900123');
  assert.ok(L.isValidPhone('01034310323', '20')); assert.ok(!L.isValidPhone('123', '20')); assert.ok(!L.isValidPhone('', '20'));
});
test('price format', () => {
  assert.equal(L.formatPrice(1150, 'en', cfg), '1,150 EGP');
  assert.match(L.formatPrice(1150, 'ar', cfg), /١٬١٥٠ ج\.م/);
});
test('new arrivals: window, order, grouping', () => {
  const list = L.newArrivals(cfg.products, cfg, NOW);
  assert.ok(list.length > 3);
  for (let i = 1; i < list.length; i++) assert.ok(Date.parse(list[i - 1].added) >= Date.parse(list[i].added));
  assert.ok(list.every(p => (NOW - Date.parse(p.added)) / 864e5 <= cfg.newArrivalsDays + 1));
  assert.ok(!list.find(p => p.id === 'quilted-jacket'), 'old product is not new');
  const g = L.groupArrivals(list, NOW); assert.equal(g.week.length + g.lastWeek.length + g.earlier.length, list.length);
  assert.ok(L.isNew({ added: '2026-01-01' }, Date.parse('2026-01-20'), 30)); assert.ok(!L.isNew({ added: '2026-01-01' }, Date.parse('2026-03-20'), 30));
});
test('filters', () => {
  const f = (o) => L.filterProducts(cfg.products, o, cfg, 'en', NOW);
  assert.ok(f({ cat: 'extras' }).every(p => p.category === 'extras'));
  assert.ok(f({ size: 'XL' }).every(p => p.sizes.XL > 0));
  assert.ok(!f({ size: 'XL' }).find(p => p.id === 'linen-overshirt'), 'XL sold out in linen overshirt');
  assert.ok(f({ color: 'plum' }).every(p => p.colors.includes('plum')));
  assert.ok(f({ sale: true }).every(p => p.compareAt > p.price) && f({ sale: true }).length === 3);
  assert.deepEqual(f({ q: 'hoodie' }).map(p => p.id), ['zip-hoodie']);
  assert.deepEqual(f({ q: 'عباية' }).map(p => p.id).sort(), ['night-abaya', 'open-abaya']);
  assert.ok(f({ q: 'olive' }).length > 2, 'search by color name');
  assert.ok(f({ q: 'nonsense-xyz' }).length === 0);
  const low = f({ sort: 'low' }).map(p => p.price); assert.deepEqual(low, [...low].sort((a, b) => a - b));
  const high = f({ sort: 'high' }).map(p => p.price); assert.deepEqual(high, [...high].sort((a, b) => b - a));
  assert.ok(f({ max: 400 }).every(p => p.price <= 400));
  assert.deepEqual(f({ fav: ['heavy-tee'] }).map(p => p.id), ['heavy-tee']);
});
test('cart: add, merge, stock limit', () => {
  let r = L.addToCart([], { id: 'zip-hoodie', color: 'navy', size: 'S', qty: 1 }, cfg.products);
  assert.equal(r.added, 1);
  r = L.addToCart(r.cart, { id: 'zip-hoodie', color: 'navy', size: 'S', qty: 1 }, cfg.products);
  assert.equal(r.cart.length, 1); assert.equal(r.cart[0].qty, 2);
  r = L.addToCart(r.cart, { id: 'zip-hoodie', color: 'ink', size: 'S', qty: 1 }, cfg.products);
  assert.equal(r.added, 0); assert.equal(r.reason, 'stock', 'S stock of 2 is shared across colors');
  r = L.addToCart([], { id: 'linen-overshirt', color: 'sand', size: 'XL', qty: 1 }, cfg.products);
  assert.equal(r.added, 0, 'sold out size');
  r = L.addToCart([], { id: 'quilted-jacket', color: 'ink', size: 'M', qty: 5 }, cfg.products);
  assert.equal(r.added, 2); assert.equal(r.reason, 'partial');
});
test('cart: setQty, remove, sanitize, totals', () => {
  let c = L.addToCart([], { id: 'heavy-tee', color: 'ink', size: 'M', qty: 2 }, cfg.products).cart;
  const key = L.lineKey(c[0]);
  assert.equal(L.setQty(c, key, 4, cfg.products)[0].qty, 4);
  assert.equal(L.setQty(c, key, 999, cfg.products)[0].qty, 10);
  assert.equal(L.setQty(c, key, 0, cfg.products).length, 0);
  assert.equal(L.removeLine(c, key).length, 0);
  assert.equal(L.cartCount(c), 2); assert.equal(L.cartSubtotal(c, cfg.products), 680);
  const dirty = [{ id: 'ghost', color: 'ink', size: 'M', qty: 1 }, { id: 'heavy-tee', color: 'plum', size: 'M', qty: 1 }, { id: 'heavy-tee', color: 'ink', size: 'M', qty: 99 }, { id: 'heavy-tee', color: 'ink', size: 'Q', qty: 1 }];
  const clean = L.sanitizeCart(dirty, cfg.products); assert.equal(clean.length, 1); assert.equal(clean[0].qty, 10);
});
test('delivery fee rules', () => {
  assert.equal(L.deliveryFee(500, 'order', cfg), 60);
  assert.equal(L.deliveryFee(1500, 'order', cfg), 0);
  assert.equal(L.deliveryFee(500, 'reserve', cfg), 0);
  assert.equal(L.deliveryFee(0, 'order', cfg), 0);
});
test('WhatsApp message: order, English', () => {
  const items = [{ id: 'heavy-tee', color: 'ink', size: 'M', qty: 2 }, { id: 'garden-dress', color: 'rose', size: 'S', qty: 1 }];
  const m = L.buildMessage({ cfg, lang: 'en', mode: 'order', items, customer: { name: 'Mona', phone: '201001112233', address: '5 Test St', notes: 'Call first' }, orderId: 'LB-TEST' });
  assert.match(m, /Hello Zahra Studio/); assert.match(m, /2 x Heavy cotton tee \(color: Ink black, size: M\) = 680 EGP/);
  assert.match(m, /1 x Garden midi dress \(color: Dusty rose, size: S\) = 1,150 EGP/);
  assert.match(m, /Items: 1,830 EGP/); assert.match(m, /Delivery: free/); assert.match(m, /Total: 1,830 EGP/);
  assert.match(m, /Address: 5 Test St/); assert.match(m, /Notes: Call first/); assert.match(m, /Ref: LB-TEST/);
});
test('WhatsApp message: reservation, Arabic', () => {
  const m = L.buildMessage({ cfg, lang: 'ar', mode: 'reserve', items: [{ id: 'heavy-tee', color: 'ink', size: 'M', qty: 1 }], customer: { name: 'منى', phone: '201001112233', address: 'ignored' }, orderId: 'LB-X' });
  assert.match(m, /زهرة ستوديو/); assert.match(m, /للاستلام من المتجر/); assert.match(m, /٤٨ ساعة|48 ساعة/); assert.ok(!m.includes('العنوان'), 'no address in reservations'); assert.ok(!m.includes('التوصيل'));
});
test('WhatsApp url encodes text and strips number', () => {
  const u = L.waUrl('+20 100 000 0000', 'a b\n&c');
  assert.equal(u, 'https://wa.me/201000000000?text=a%20b%0A%26c');
});
test('order id shape and uniqueness', () => {
  const a = L.newOrderId(1e12, 0.1), b = L.newOrderId(1e12 + 5000, 0.1);
  assert.match(a, /^LB-[0-9A-Z]{7}$/); assert.notEqual(a, b);
});
test('router', () => {
  assert.deepEqual(L.parseHash('#/shop?cat=tops&q=a+b'), { name: 'shop', arg: null, query: { cat: 'tops', q: 'a b' } });
  assert.deepEqual(L.parseHash('#/p/heavy-tee'), { name: 'p', arg: 'heavy-tee', query: {} });
  assert.equal(L.parseHash('').name, 'home');
  assert.equal(L.buildHash('shop', null, { cat: 'tops', q: '', size: 'M' }), '#/shop?cat=tops&size=M');
  assert.equal(L.parseHash(L.buildHash('shop', null, { q: 'عباية' })).query.q, 'عباية');
});
test('every product has a drawable art type', () => {
  global.self = global; require('../site/js/art.js');
  const art = global.LebsArt;
  cfg.products.forEach(p => { const s = art.garment(p.art, cfg.palette[p.colors[0]].hex, 0, {}); assert.match(s, /^<svg/); assert.ok(s.length > 500, p.id); });
});
