/* Lebs core logic. Pure functions, no DOM. Works in the browser (window.LebsLib) and in Node (tests). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LebsLib = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var DAY = 86400000;

  function tr(obj, lang) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] != null ? obj[lang] : (obj.en != null ? obj.en : '');
  }

  function toLatinDigits(s) {
    return String(s)
      .replace(/[\u0660-\u0669]/g, function (d) { return d.charCodeAt(0) - 0x660; })
      .replace(/[\u06F0-\u06F9]/g, function (d) { return d.charCodeAt(0) - 0x6F0; });
  }

  /* Keep digits only, drop leading 00 and a single leading 0 when a default country code is given. */
  function normalizePhone(raw, defaultCc) {
    var d = toLatinDigits(raw || '').replace(/[^\d+]/g, '');
    var plus = d.charAt(0) === '+';
    d = d.replace(/\D/g, '');
    if (!d) return '';
    if (plus) return d;
    if (d.indexOf('00') === 0) return d.slice(2);
    if (defaultCc && d.charAt(0) === '0') return String(defaultCc) + d.slice(1);
    return d;
  }

  function isValidPhone(raw, defaultCc) {
    var p = normalizePhone(raw, defaultCc);
    return p.length >= 9 && p.length <= 15;
  }

  function formatPrice(n, lang, cfg) {
    var cur = (cfg && cfg.currency) || { symbol: 'EGP' };
    var num = Math.round(Number(n) * 100) / 100;
    var s = num.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 });
    var sym = tr(cur.symbol, lang);
    return lang === 'ar' ? s + ' ' + sym : s + ' ' + sym;
  }

  function isNew(p, now, days) {
    var t = Date.parse(p.added);
    if (isNaN(t)) return false;
    var age = (now - t) / DAY;
    return age >= -1 && age <= days;
  }

  function totalStock(p) {
    var s = 0, k;
    for (k in p.sizes) s += Math.max(0, p.sizes[k] | 0);
    return s;
  }

  function sizeList(p, order) {
    var keys = Object.keys(p.sizes || {});
    order = order || [];
    return keys.sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia < 0 && ib < 0) return a < b ? -1 : 1;
      if (ia < 0) return 1;
      if (ib < 0) return -1;
      return ia - ib;
    });
  }

  function effectivePrice(p) { return p.price; }

  function matchesQuery(p, q, cfg, lang) {
    q = toLatinDigits(q || '').trim().toLowerCase();
    if (!q) return true;
    var cats = (cfg.categories || []).filter(function (c) { return c.id === p.category; });
    var hay = [p.name && p.name.en, p.name && p.name.ar, p.desc && p.desc.en, p.desc && p.desc.ar,
      cats[0] && cats[0].name.en, cats[0] && cats[0].name.ar]
      .concat((p.colors || []).map(function (c) { var d = cfg.palette[c]; return d ? d.en + ' ' + d.ar : c; }))
      .join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }

  function filterProducts(products, f, cfg, lang, now) {
    f = f || {};
    var out = products.filter(function (p) {
      if (f.cat && f.cat !== 'all' && p.category !== f.cat) return false;
      if (f.size && !(p.sizes && p.sizes[f.size] > 0)) return false;
      if (f.color && (p.colors || []).indexOf(f.color) < 0) return false;
      if (f.max && p.price > Number(f.max)) return false;
      if (f.min && p.price < Number(f.min)) return false;
      if (f.sale && !(p.compareAt && p.compareAt > p.price)) return false;
      if (f.inStock && totalStock(p) === 0) return false;
      if (f.fav && f.fav.indexOf(p.id) < 0) return false;
      return matchesQuery(p, f.q, cfg, lang);
    });
    var s = f.sort || 'new';
    var cmp = {
      new: function (a, b) { return Date.parse(b.added) - Date.parse(a.added); },
      low: function (a, b) { return a.price - b.price; },
      high: function (a, b) { return b.price - a.price; },
      name: function (a, b) { return tr(a.name, lang).localeCompare(tr(b.name, lang), lang); }
    }[s] || null;
    if (cmp) out = out.slice().sort(cmp);
    return out;
  }

  function newArrivals(products, cfg, now) {
    var days = cfg.newArrivalsDays || 30;
    return products.filter(function (p) { return isNew(p, now, days); })
      .sort(function (a, b) { return Date.parse(b.added) - Date.parse(a.added); });
  }

  /* Group new arrivals into "this week", "last week", "earlier" buckets. */
  function groupArrivals(list, now) {
    var g = { week: [], lastWeek: [], earlier: [] };
    list.forEach(function (p) {
      var age = (now - Date.parse(p.added)) / DAY;
      if (age <= 7) g.week.push(p); else if (age <= 14) g.lastWeek.push(p); else g.earlier.push(p);
    });
    return g;
  }

  /* ---- cart ---- */
  function lineKey(i) { return i.id + '|' + i.color + '|' + i.size; }

  function stockFor(products, id, size) {
    var p = products.filter(function (x) { return x.id === id; })[0];
    return p && p.sizes ? Math.max(0, p.sizes[size] | 0) : 0;
  }

  /* Total of one product+size across colors must not exceed stock. */
  function qtyOfSize(cart, id, size) {
    return cart.reduce(function (s, i) { return s + (i.id === id && i.size === size ? i.qty : 0); }, 0);
  }

  function addToCart(cart, item, products) {
    var next = cart.map(function (i) { return Object.assign({}, i); });
    var stock = stockFor(products, item.id, item.size);
    var have = qtyOfSize(next, item.id, item.size);
    var want = Math.max(1, item.qty | 0 || 1);
    var allowed = Math.min(want, stock - have);
    if (allowed <= 0) return { cart: next, added: 0, reason: 'stock' };
    var k = lineKey(item), found = next.filter(function (i) { return lineKey(i) === k; })[0];
    if (found) found.qty += allowed; else next.push({ id: item.id, color: item.color, size: item.size, qty: allowed });
    return { cart: next, added: allowed, reason: allowed < want ? 'partial' : 'ok' };
  }

  function setQty(cart, key, qty, products) {
    var out = [];
    cart.forEach(function (i) {
      var c = Object.assign({}, i);
      if (lineKey(c) === key) {
        var others = qtyOfSize(cart, c.id, c.size) - c.qty;
        var max = stockFor(products, c.id, c.size) - others;
        c.qty = Math.min(qty | 0, max);
      }
      if (c.qty > 0) out.push(c);
    });
    return out;
  }

  function removeLine(cart, key) { return cart.filter(function (i) { return lineKey(i) !== key; }); }

  /* Drop lines for products/sizes that no longer exist, clamp quantities to stock. */
  function sanitizeCart(cart, products) {
    var out = [];
    (Array.isArray(cart) ? cart : []).forEach(function (i) {
      if (!i || typeof i !== 'object') return;
      var p = products.filter(function (x) { return x.id === i.id; })[0];
      if (!p || !p.sizes || !(i.size in p.sizes) || (p.colors || []).indexOf(i.color) < 0) return;
      var qty = Math.min(i.qty | 0, Math.max(0, p.sizes[i.size] | 0) - qtyOfSize(out, i.id, i.size));
      if (qty > 0) out.push({ id: i.id, color: i.color, size: i.size, qty: qty });
    });
    return out;
  }

  function cartCount(cart) { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }

  function cartSubtotal(cart, products) {
    return cart.reduce(function (s, i) {
      var p = products.filter(function (x) { return x.id === i.id; })[0];
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  }

  function deliveryFee(subtotal, mode, cfg) {
    if (mode === 'reserve') return 0;
    var d = cfg.delivery || {};
    if (!subtotal) return 0;
    if (d.freeOver && subtotal >= d.freeOver) return 0;
    return d.fee || 0;
  }

  function newOrderId(now, rnd) {
    var r = Math.floor((rnd == null ? Math.random() : rnd) * 1296).toString(36).toUpperCase();
    return 'LB-' + Math.floor(now / 1000).toString(36).toUpperCase().slice(-5) + r.padStart(2, '0');
  }

  /* ---- WhatsApp ---- */
  var M = {
    en: {
      hiOrder: 'Hello {store}, I would like to place an order',
      hiReserve: 'Hello {store}, I would like to reserve these items for pickup in store',
      ref: 'Ref: {id}', total: 'Total: {v}', sub: 'Items: {v}', ship: 'Delivery: {v}', free: 'free',
      name: 'Name: {v}', phone: 'Phone: {v}', addr: 'Address: {v}', notes: 'Notes: {v}',
      hold: 'Please hold them for {h} hours.', pay: 'Payment on delivery, to be confirmed with you.',
      pickupPay: 'I will pay at pickup.',
      color: 'color', size: 'size', oneSize: 'one size'
    },
    ar: {
      hiOrder: 'مرحباً {store}، أرغب في طلب المنتجات التالية',
      hiReserve: 'مرحباً {store}، أرغب في حجز المنتجات التالية للاستلام من المتجر',
      ref: 'رقم الطلب: {id}', total: 'الإجمالي: {v}', sub: 'المنتجات: {v}', ship: 'التوصيل: {v}', free: 'مجاني',
      name: 'الاسم: {v}', phone: 'الهاتف: {v}', addr: 'العنوان: {v}', notes: 'ملاحظات: {v}',
      hold: 'برجاء حجزها لمدة {h} ساعة.', pay: 'الدفع عند الاستلام، ونتفق على التفاصيل معكم.',
      pickupPay: 'سأدفع عند الاستلام من المتجر.',
      color: 'اللون', size: 'المقاس', oneSize: 'مقاس واحد'
    }
  };
  function f(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }

  function buildMessage(o) {
    var cfg = o.cfg, lang = o.lang === 'ar' ? 'ar' : 'en', m = M[lang], L = [];
    var store = tr(cfg.brand.name, lang);
    L.push(f(o.mode === 'reserve' ? m.hiReserve : m.hiOrder, { store: store }) + ':');
    L.push('');
    var products = cfg.products;
    o.items.forEach(function (i) {
      var p = products.filter(function (x) { return x.id === i.id; })[0];
      if (!p) return;
      var col = cfg.palette[i.color];
      L.push('- ' + i.qty + ' x ' + tr(p.name, lang) + ' (' + m.color + ': ' + (col ? tr(col, lang) : i.color) +
        ', ' + m.size + ': ' + (i.size === 'Free' ? m.oneSize : i.size) + ') = ' + formatPrice(p.price * i.qty, lang, cfg));
    });
    L.push('');
    var sub = cartSubtotal(o.items, products), fee = deliveryFee(sub, o.mode, cfg);
    L.push(f(m.sub, { v: formatPrice(sub, lang, cfg) }));
    if (o.mode !== 'reserve') L.push(f(m.ship, { v: fee ? formatPrice(fee, lang, cfg) : m.free }));
    L.push(f(m.total, { v: formatPrice(sub + fee, lang, cfg) }));
    L.push('');
    var c = o.customer || {};
    L.push(f(m.name, { v: c.name }));
    L.push(f(m.phone, { v: c.phone }));
    if (o.mode !== 'reserve' && c.address) L.push(f(m.addr, { v: c.address }));
    if (c.notes) L.push(f(m.notes, { v: c.notes }));
    L.push('');
    if (o.mode === 'reserve') { L.push(f(m.hold, { h: cfg.reservationHoldHours || 48 })); L.push(m.pickupPay); }
    else L.push(m.pay);
    L.push(f(m.ref, { id: o.orderId }));
    return L.join('\n');
  }

  function waUrl(number, text) {
    return 'https://wa.me/' + normalizePhone(number) + '?text=' + encodeURIComponent(text);
  }

  /* ---- routing ---- */
  function parseHash(h) {
    h = (h || '').replace(/^#/, '');
    var qi = h.indexOf('?'), path = qi >= 0 ? h.slice(0, qi) : h, qs = qi >= 0 ? h.slice(qi + 1) : '';
    var parts = path.split('/').filter(Boolean), query = {};
    qs.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('='), k = decodeURIComponent(kv.slice(0, i < 0 ? kv.length : i));
      query[k] = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
    });
    return { name: parts[0] || 'home', arg: parts[1] ? decodeURIComponent(parts[1]) : null, query: query };
  }

  function buildHash(name, arg, query) {
    var h = '#/' + (name === 'home' ? '' : name) + (arg ? '/' + encodeURIComponent(arg) : '');
    var qs = Object.keys(query || {}).filter(function (k) { return query[k] !== '' && query[k] != null; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(query[k]); }).join('&');
    return qs ? h + '?' + qs : h;
  }

  /* ---- config validation (also used by tests and by the page to show a friendly error) ---- */
  function validateConfig(cfg) {
    var e = [];
    function need(c, msg) { if (!c) e.push(msg); }
    need(cfg && cfg.brand && cfg.brand.name && cfg.brand.name.en && cfg.brand.name.ar, 'brand.name needs en and ar');
    need(cfg && cfg.whatsapp && /^\d{9,15}$/.test(normalizePhone(cfg.whatsapp.number)), 'whatsapp.number must be 9 to 15 digits with country code');
    need(cfg && cfg.theme && cfg.theme.paper && cfg.theme.ink && cfg.theme.accent, 'theme needs paper, ink and accent');
    need(cfg && Array.isArray(cfg.categories) && cfg.categories.length, 'categories is empty');
    need(cfg && Array.isArray(cfg.products) && cfg.products.length, 'products is empty');
    if (!cfg || !Array.isArray(cfg.categories) || !Array.isArray(cfg.products)) return e;
    var ids = {}, cats = {};
    cfg.categories.forEach(function (c) { cats[c.id] = 1; need(c.name && c.name.en && c.name.ar, 'category ' + c.id + ' needs en and ar names'); });
    cfg.products.forEach(function (p) {
      var w = 'product ' + p.id;
      need(p.id && /^[a-z0-9-]+$/.test(p.id), w + ': id must be lowercase letters, digits, dashes');
      need(!ids[p.id], w + ': duplicate id'); ids[p.id] = 1;
      need(p.name && p.name.en && p.name.ar, w + ': name needs en and ar');
      need(cats[p.category], w + ': unknown category ' + p.category);
      need(typeof p.price === 'number' && p.price > 0, w + ': price must be a positive number');
      need(!isNaN(Date.parse(p.added)), w + ': added must be a date');
      need(p.colors && p.colors.length, w + ': needs at least one color');
      (p.colors || []).forEach(function (c) { need(cfg.palette && cfg.palette[c], w + ': color ' + c + ' is not in palette'); });
      need(p.sizes && Object.keys(p.sizes).length, w + ': needs sizes');
    });
    return e;
  }

  function relLum(hex) {
    hex = hex.replace('#', '');
    var c = [0, 2, 4].map(function (i) { var v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  /* Text color (the theme ink or white) with the better contrast on a background. */
  function pickInk(bg, ink) {
    var b = relLum(bg), contrast = function (l) { return (Math.max(l, b) + 0.05) / (Math.min(l, b) + 0.05); };
    return contrast(relLum(ink)) >= contrast(1) ? ink : '#ffffff';
  }

  return {
    pickInk: pickInk, relLum: relLum, tr: tr, toLatinDigits: toLatinDigits, normalizePhone: normalizePhone, isValidPhone: isValidPhone,
    formatPrice: formatPrice, isNew: isNew, totalStock: totalStock, sizeList: sizeList,
    filterProducts: filterProducts, newArrivals: newArrivals, groupArrivals: groupArrivals,
    lineKey: lineKey, addToCart: addToCart, setQty: setQty, removeLine: removeLine, sanitizeCart: sanitizeCart,
    cartCount: cartCount, cartSubtotal: cartSubtotal, deliveryFee: deliveryFee, newOrderId: newOrderId,
    buildMessage: buildMessage, waUrl: waUrl, parseHash: parseHash, buildHash: buildHash,
    cartSubQty: qtyOfSize, validateConfig: validateConfig, effectivePrice: effectivePrice
  };
});
