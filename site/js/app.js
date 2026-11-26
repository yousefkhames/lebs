/* Lebs app: client-side only. State lives in localStorage, per browser. */
(function () {
  'use strict';
  var cfg = window.LEBS_CONFIG, L = window.LebsLib, I = window.LebsI18n, Art = window.LebsArt;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var app = $('#app');

  /* ---------- config check ---------- */
  var errs = cfg ? L.validateConfig(cfg) : ['lebs.config.js did not load'];
  if (errs.length) {
    app.innerHTML = '<div style="padding:2rem;font-family:sans-serif;max-width:40rem"><h1>Lebs</h1><p><b>' + I.en.configError + '</b></p><ul>' +
      errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
    return;
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var slug = (cfg.brand.name.en || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  var K = { lang: 'lebs:' + slug + ':lang', cart: 'lebs:' + slug + ':cart', fav: 'lebs:' + slug + ':fav', orders: 'lebs:' + slug + ':orders', cust: 'lebs:' + slug + ':customer' };
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }

  var lang = load(K.lang, null) || cfg.defaultLang || 'ar';
  if (lang !== 'ar' && lang !== 'en') lang = 'ar';
  var cart = L.sanitizeCart(load(K.cart, []), cfg.products);
  var fav = load(K.fav, []).filter(function (id) { return cfg.products.some(function (p) { return p.id === id; }); });
  var orders = load(K.orders, []);
  var T = function (k, o) { var s = (I[lang][k] != null ? I[lang][k] : I.en[k]) || k; return o ? s.replace(/\{(\w+)\}/g, function (_, x) { return o[x]; }) : s; };
  var tr = function (o) { return L.tr(o, lang); };
  var price = function (n) { return L.formatPrice(n, lang, cfg); };
  var num = function (n) { return Number(n).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US'); };
  var prod = function (id) { return cfg.products.filter(function (p) { return p.id === id; })[0]; };
  var catName = function (id) { var c = cfg.categories.filter(function (x) { return x.id === id; })[0]; return c ? tr(c.name) : id; };
  var now = function () { return Date.now(); };

  /* ---------- theme ---------- */
  (function applyTheme() {
    var t = cfg.theme, r = document.documentElement.style;
    r.setProperty('--paper', t.paper); r.setProperty('--card', t.card || '#fff'); r.setProperty('--ink', t.ink);
    r.setProperty('--accent', t.accent); r.setProperty('--accent2', t.accent2 || t.ink); r.setProperty('--line', t.line || '#ccc');
    r.setProperty('--accent-ink', Art.lum(t.accent) > 0.6 ? t.ink : '#fff');
    r.setProperty('--accent2-ink', Art.lum(t.accent2 || t.ink) > 0.6 ? t.ink : '#fff');
    var meta = $('meta[name=theme-color]'); if (meta) meta.setAttribute('content', t.paper);
    if (cfg.brand.favicon) $('#favicon').setAttribute('href', cfg.brand.favicon);
  })();

  /* ---------- icons ---------- */
  var ic = {
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7v9H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    shop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6a2 2 0 1 1 2 2l-2 1.500L3 17h18l-9-7.500" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.300-4.200A8 8 0 1 1 8.400 18.800z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8.500c0 3 3 6 6 6l1-1.500-2-1-1 .8c-1-.4-1.800-1.200-2.200-2.200l.8-1-1-2z" fill="currentColor"/></svg>'
  };

  /* ---------- product imagery ---------- */
  function photosFor(p, color) {
    var im = p.images;
    if (!im) return null;
    if (Array.isArray(im)) return im.length ? im : null;
    return im[color] || im[Object.keys(im)[0]] || null;
  }
  function imgHtml(p, color, view, bare) {
    var ph = photosFor(p, color);
    if (ph) return '<img src="' + esc(ph[Math.min(view, ph.length - 1)]) + '" alt="' + esc(tr(p.name)) + '" loading="lazy">';
    var c = cfg.palette[color] || { hex: '#999' };
    return Art.garment(p.art || 'tee', c.hex, view, { paper: cfg.theme.paper, label: tr(p.name) + ', ' + tr(c), mark: tr(cfg.brand.name).split(' ')[0].slice(0, 9), bare: bare });
  }
  function viewCount(p, color) { var ph = photosFor(p, color); return ph ? ph.length : 3; }

  /* ---------- chrome ---------- */
  function setLang(l) {
    lang = l; save(K.lang, l);
    document.documentElement.lang = l; document.documentElement.dir = I[l].dir;
    document.title = tr(cfg.brand.name) + ' | ' + tr(cfg.brand.tagline);
    $('meta[name=description]').setAttribute('content', tr(cfg.brand.tagline));
    $('#skip').textContent = T('skip');
    renderChrome(); route();
  }
  function renderChrome() {
    var r = L.parseHash(location.hash).name, count = L.cartCount(cart);
    function a(name, label) { return '<a href="' + L.buildHash(name) + '"' + (r === name || (name === 'home' && r === 'home') ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
    $('#top').innerHTML =
      '<div class="top-in">' +
      '<a class="brand" href="#/"><img src="' + esc(cfg.brand.logo) + '" alt="" width="38" height="38"><span class="brand-name">' + esc(tr(cfg.brand.name)) + '</span></a>' +
      '<nav class="nav" aria-label="Main">' + a('home', T('navHome')) + a('shop', T('navShop')) + a('new', T('navNew')) + a('about', T('navAbout')) + a('orders', T('navOrders')) + '</nav>' +
      '<form class="hsearch" role="search" id="hsearch"><label class="sr" for="hq">' + T('search') + '</label><input id="hq" type="search" placeholder="' + esc(T('searchPh')) + '" autocomplete="off"><button type="submit" aria-label="' + T('search') + '">' + ic.search + '</button></form>' +
      '<div class="tools"><button class="lang" id="langBtn" type="button" lang="' + (lang === 'ar' ? 'en' : 'ar') + '">' + T('langBtn') + '</button>' +
      '<a class="ibtn" href="#/saved" aria-label="' + T('wishlist') + '" id="favBtn">' + ic.heart + (fav.length ? '<i class="dot">' + num(fav.length) + '</i>' : '') + '</a>' +
      '<a class="ibtn" href="#/cart" aria-label="' + T('cart') + (count ? ', ' + T('itemsInBag', { n: count }) : '') + '" id="bagBtn">' + ic.bag + (count ? '<i class="dot" id="bagCount">' + num(count) + '</i>' : '') + '</a></div></div>';
    $('#dock').innerHTML = [['home', 'home', T('navHome')], ['shop', 'shop', T('navShop')], ['new', 'spark', T('navNew')], ['saved', 'heart', T('wishlist')], ['cart', 'bag', T('cart')]]
      .map(function (x) { return '<a href="' + L.buildHash(x[0]) + '" data-r="' + x[0] + '"' + (r === x[0] ? ' aria-current="page"' : '') + '>' + ic[x[1]] + '<span>' + x[2] + '</span>' + (x[0] === 'cart' && count ? '<i class="dot">' + num(count) + '</i>' : '') + '</a>'; }).join('');
    $('#foot').innerHTML = '<div class="foot-in"><div><b>' + esc(tr(cfg.brand.name)) + '</b><p>' + esc(tr(cfg.contact.address)) + '</p><p>' + esc(tr(cfg.contact.hours)) + '</p></div>' +
      '<div class="foot-note"><p>' + T('madeBy') + '</p><p>' + T('footerNote') + '</p></div></div>';
    $('#langBtn').onclick = function () { setLang(lang === 'ar' ? 'en' : 'ar'); };
    $('#hsearch').onsubmit = function (e) { e.preventDefault(); location.hash = L.buildHash('shop', null, { q: $('#hq').value.trim() }); };
  }
  function refreshCounts() { renderChrome(); }

  var toastT;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }

  /* ---------- pieces ---------- */
  function badges(p) {
    var o = '';
    if (L.isNew(p, now(), cfg.newArrivalsDays || 30)) o += '<span class="badge new">' + T('newBadge') + '</span>';
    if (p.compareAt && p.compareAt > p.price) o += '<span class="badge sale">' + T('saleBadge') + '</span>';
    if (L.totalStock(p) === 0) o += '<span class="badge out">' + T('soldOut') + '</span>';
    return o;
  }
  function priceHtml(p) {
    return '<span class="price">' + price(p.price) + '</span>' + (p.compareAt && p.compareAt > p.price ? ' <s class="was">' + price(p.compareAt) + '</s>' : '');
  }
  function swatches(p, sel, cls, interactive) {
    return '<span class="sw ' + (cls || '') + '" role="' + (interactive ? 'radiogroup' : 'presentation') + '"' + (interactive ? ' aria-label="' + T('colorLabel') + '"' : '') + '>' +
      p.colors.map(function (c) {
        var d = cfg.palette[c];
        return '<button type="button" class="swatch' + (c === sel ? ' on' : '') + '" data-color="' + c + '" style="--c:' + d.hex + '" title="' + esc(tr(d)) + '" aria-label="' + esc(tr(d)) + '"' + (interactive ? ' role="radio" aria-checked="' + (c === sel) + '"' : '') + '></button>';
      }).join('') + '</span>';
  }
  function tagCard(p) {
    var c0 = p.colors[0], isFav = fav.indexOf(p.id) >= 0, out = L.totalStock(p) === 0;
    return '<article class="tag' + (out ? ' is-out' : '') + '" data-id="' + p.id + '">' +
      '<a class="tag-link" href="#/p/' + p.id + '"><div class="tag-img" data-color="' + c0 + '">' + imgHtml(p, c0, 0) + '<div class="badges">' + badges(p) + '</div></div>' +
      '<h3>' + esc(tr(p.name)) + '</h3><p class="meta">' + esc(catName(p.category)) + '</p><p class="pr">' + priceHtml(p) + '</p></a>' +
      '<div class="tag-foot">' + swatches(p, c0, 'sm', true) + '</div>' +
      '<button type="button" class="fav' + (isFav ? ' on' : '') + '" data-fav="' + p.id + '" aria-pressed="' + isFav + '" aria-label="' + (isFav ? T('saved') : T('save')) + ': ' + esc(tr(p.name)) + '">' + ic.heart + '</button></article>';
  }
  function grid(list) { return '<div class="grid">' + list.map(tagCard).join('') + '</div>'; }
  function bindCards(root) {
    $$('.tag .swatch', root).forEach(function (b) {
      b.onclick = function (e) {
        e.preventDefault();
        var art = b.closest('.tag'), p = prod(art.dataset.id), c = b.dataset.color;
        $('.tag-img', art).dataset.color = c;
        $('.tag-img', art).innerHTML = imgHtml(p, c, 0) + '<div class="badges">' + badges(p) + '</div>';
        $$('.swatch', art).forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
      };
    });
    $$('[data-fav]', root).forEach(function (b) { b.onclick = function () { toggleFav(b.dataset.fav); }; });
  }
  function toggleFav(id) {
    var i = fav.indexOf(id);
    if (i >= 0) fav.splice(i, 1); else fav.push(id);
    save(K.fav, fav); refreshCounts();
    $$('[data-fav="' + id + '"]').forEach(function (b) {
      var on = fav.indexOf(id) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
    if (L.parseHash(location.hash).name === 'saved') route();
  }
  function sectionHead(title, sub, linkHref, linkText) {
    return '<div class="sec-head"><div><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (linkHref ? '<a class="more" href="' + linkHref + '">' + linkText + '</a>' : '') + '</div>';
  }

  /* ---------- pages ---------- */
  function pageHome() {
    var news = L.newArrivals(cfg.products, cfg, now()), rail = (news.length ? news : cfg.products.slice().sort(function (a, b) { return Date.parse(b.added) - Date.parse(a.added); })).slice(0, 3);
    var h = cfg.hero;
    var railHtml = rail.map(function (p, i) {
      var c = p.colors[0];
      return '<a class="hang h' + i + '" href="#/p/' + p.id + '" aria-label="' + esc(tr(p.name)) + '"><span class="hang-art">' + imgHtml(p, c, 0, true) + '</span><span class="hang-tag">' + esc(tr(p.name)) + '<b>' + price(p.price) + '</b></span></a>';
    }).join('');
    var cats = cfg.categories.map(function (c) {
      var p = cfg.products.filter(function (x) { return x.category === c.id; })[0];
      if (!p) return '';
      return '<a class="cat" href="' + L.buildHash('shop', null, { cat: c.id }) + '"><span class="cat-art">' + imgHtml(p, p.colors[p.colors.length > 1 ? 1 : 0], 1) + '</span><span class="cat-name">' + esc(tr(c.name)) + '</span></a>';
    }).join('');
    return '<section class="hero"><div class="hero-copy"><p class="kicker">' + esc(tr(h.kicker)) + '</p><h1>' + esc(tr(h.title)) + '</h1><p class="lead">' + esc(tr(h.text)) + '</p>' +
      '<div class="cta"><a class="btn primary" href="#/shop">' + T('shopNow') + '</a><a class="btn ghost" href="#/new">' + T('seeNew') + '</a></div></div>' +
      '<div class="rail" aria-label="' + T('newIn') + '"><div class="rail-bar"></div>' + railHtml + '</div></section>' +
      '<ul class="perks">' + cfg.perks.map(function (p) { return '<li>' + esc(tr(p)) + '</li>'; }).join('') + '</ul>' +
      '<section class="block">' + sectionHead(T('newIn'), T('newInSub'), '#/new', T('seeAll')) + grid((news.length ? news : rail).slice(0, 4)) + '</section>' +
      '<section class="block"><h2 class="solo">' + T('shop') + '</h2><div class="cats">' + cats + '</div></section>' +
      '<section class="block about-teaser"><h2>' + esc(tr(cfg.about.title)) + '</h2><p>' + esc(tr(cfg.about.text)) + '</p><a class="more" href="#/about">' + T('aboutHere') + '</a></section>';
  }

  function pageShop(q) {
    var sizes = {}; cfg.products.forEach(function (p) { Object.keys(p.sizes).forEach(function (s) { sizes[s] = 1; }); });
    var sizeKeys = Object.keys(sizes).sort(function (a, b) { var o = cfg.sizeOrder || []; return (o.indexOf(a) < 0 ? 99 : o.indexOf(a)) - (o.indexOf(b) < 0 ? 99 : o.indexOf(b)); });
    var colorKeys = Object.keys(cfg.palette).filter(function (c) { return cfg.products.some(function (p) { return p.colors.indexOf(c) >= 0; }); });
    var f = { cat: q.cat || 'all', size: q.size || '', color: q.color || '', sort: q.sort || 'new', q: q.q || '', sale: q.sale === '1', inStock: q.stock === '1' };
    var list = L.filterProducts(cfg.products, f, cfg, lang, now());
    var active = (f.cat !== 'all') + !!f.size + !!f.color + f.sale + f.inStock + !!f.q;
    function hr(o) { return L.buildHash('shop', null, Object.assign({}, q, o)); }
    var chips = [['all', T('all')]].concat(cfg.categories.map(function (c) { return [c.id, tr(c.name)]; }))
      .map(function (c) { return '<a class="chip' + (f.cat === c[0] ? ' on' : '') + '" href="' + hr({ cat: c[0] === 'all' ? '' : c[0] }) + '"' + (f.cat === c[0] ? ' aria-current="true"' : '') + '>' + esc(c[1]) + '</a>'; }).join('');
    var szHtml = sizeKeys.map(function (s) { return '<a class="size-chip' + (f.size === s ? ' on' : '') + '" href="' + hr({ size: f.size === s ? '' : s }) + '" aria-pressed="' + (f.size === s) + '">' + esc(s) + '</a>'; }).join('');
    var colHtml = colorKeys.map(function (c) { var d = cfg.palette[c]; return '<a class="swatch link' + (f.color === c ? ' on' : '') + '" href="' + hr({ color: f.color === c ? '' : c }) + '" style="--c:' + d.hex + '" title="' + esc(tr(d)) + '" aria-label="' + esc(tr(d)) + '" aria-pressed="' + (f.color === c) + '"></a>'; }).join('');
    var sorts = [['new', 'sortNew'], ['low', 'sortLow'], ['high', 'sortHigh'], ['name', 'sortName']].map(function (s) { return '<option value="' + s[0] + '"' + (f.sort === s[0] ? ' selected' : '') + '>' + T(s[1]) + '</option>'; }).join('');
    return '<section class="block shop"><h1 class="page-title">' + T('shop') + '</h1>' +
      '<div class="chips" role="navigation" aria-label="' + T('category') + '">' + chips + '</div>' +
      '<button type="button" class="btn ghost small fbtn" id="fbtn" aria-expanded="false" aria-controls="fpanel">' + T('filtersToggle') + (active ? ' (' + num(active) + ')' : '') + '</button>' +
      '<div class="fpanel" id="fpanel"><div class="frow"><label class="flabel" for="sq">' + T('search') + '</label><input id="sq" type="search" value="' + esc(f.q) + '" placeholder="' + esc(T('searchPh')) + '"></div>' +
      '<div class="frow"><span class="flabel">' + T('size') + '</span><div class="size-row">' + szHtml + '</div></div>' +
      '<div class="frow"><span class="flabel">' + T('color') + '</span><div class="sw">' + colHtml + '</div></div>' +
      '<div class="frow inline"><a class="toggle' + (f.sale ? ' on' : '') + '" href="' + hr({ sale: f.sale ? '' : '1' }) + '" role="switch" aria-checked="' + f.sale + '">' + T('onSale') + '</a>' +
      '<a class="toggle' + (f.inStock ? ' on' : '') + '" href="' + hr({ stock: f.inStock ? '' : '1' }) + '" role="switch" aria-checked="' + f.inStock + '">' + T('inStockOnly') + '</a>' +
      '<label class="sortl"><span class="sr">' + T('sort') + '</span><select id="sort">' + sorts + '</select></label></div></div>' +
      '<p class="count" id="count">' + (list.length === 1 ? T('result1') : T('results', { n: num(list.length) })) + (active ? ' <a class="clear" href="#/shop">' + T('clear') + '</a>' : '') + '</p>' +
      (list.length ? grid(list) : '<div class="empty"><p>' + T('noResults') + '</p><a class="btn ghost" href="#/shop">' + T('clear') + '</a></div>') + '</section>';
  }

  function pageNew() {
    var list = L.newArrivals(cfg.products, cfg, now()), g = L.groupArrivals(list, now());
    function sec(k, t) { return g[k].length ? '<section class="block arrivals"><h2 class="timeline">' + t + '<span>' + num(g[k].length) + '</span></h2>' + grid(g[k]) + '</section>' : ''; }
    return '<section class="block"><h1 class="page-title">' + T('newIn') + '</h1><p class="sub">' + T('newInSub') + '</p></section>' +
      (list.length ? sec('week', T('thisWeek')) + sec('lastWeek', T('lastWeek')) + sec('earlier', T('earlier')) : '<div class="empty block"><p>' + T('noNew') + '</p><a class="btn primary" href="#/shop">' + T('shopNow') + '</a></div>');
  }

  function pageProduct(id) {
    var p = prod(id);
    if (!p) return pageNotFound();
    var sel = { color: p.colors[0], size: '', qty: 1, view: 0 };
    var sizes = L.sizeList(p, cfg.sizeOrder);
    var rel = cfg.products.filter(function (x) { return x.category === p.category && x.id !== p.id; }).slice(0, 4);
    var html = '<section class="block pdp" id="pdp"><a class="back" href="#/shop">' + T('back') + '</a><div class="pdp-grid">' +
      '<div class="gallery"><div class="gal-main tag-like" id="galMain"></div><div class="gal-thumbs" id="galThumbs"></div></div>' +
      '<div class="pdp-info"><p class="meta">' + esc(catName(p.category)) + '</p><h1>' + esc(tr(p.name)) + '</h1>' +
      '<p class="pr big">' + priceHtml(p) + '</p><div class="badges inline">' + badges(p) + '</div>' +
      '<p class="desc">' + esc(tr(p.desc)) + '</p>' +
      '<div class="opt"><p class="flabel">' + T('colorLabel') + ': <b id="colorName"></b></p>' + swatches(p, sel.color, 'lg', true) + '</div>' +
      '<div class="opt"><p class="flabel">' + T('sizeLabel') + ' <span class="stockmsg" id="stockMsg"></span></p><div class="size-row" id="sizes" role="radiogroup" aria-label="' + T('sizeLabel') + '">' +
      sizes.map(function (s) { var n = p.sizes[s]; return '<button type="button" role="radio" aria-checked="false" class="size-chip" data-size="' + esc(s) + '"' + (n <= 0 ? ' disabled' : '') + '>' + esc(s) + (n <= 0 ? '<em>' + T('sizeSoldOut') + '</em>' : '') + '</button>'; }).join('') + '</div></div>' +
      '<div class="opt"><p class="flabel">' + T('qty') + '</p><div class="stepper"><button type="button" id="qm" aria-label="-">&minus;</button><output id="qv">1</output><button type="button" id="qp" aria-label="+">+</button></div></div>' +
      '<div class="actions"><button type="button" class="btn primary" id="addBag">' + T('addBag') + '</button><button type="button" class="btn wa" id="reserveBtn">' + ic.wa + T('reserve') + '</button>' +
      '<button type="button" class="btn ghost fav-big' + (fav.indexOf(p.id) >= 0 ? ' on' : '') + '" data-fav="' + p.id + '" aria-pressed="' + (fav.indexOf(p.id) >= 0) + '">' + ic.heart + '<span>' + (fav.indexOf(p.id) >= 0 ? T('saved') : T('save')) + '</span></button></div>' +
      '<p class="hint" id="pickHint" role="alert"></p><p class="hint soft">' + esc(tr(cfg.delivery.note)) + '</p></div></div>' +
      (rel.length ? '<div class="block flush">' + sectionHead(T('related')) + grid(rel) + '</div>' : '') + '</section>';
    setTimeout(function () { bindProduct(p, sel, sizes); bindCards($('#pdp')); }, 0);
    return html;
  }

  function bindProduct(p, sel, sizes) {
    function drawGallery() {
      var n = viewCount(p, sel.color);
      if (sel.view >= n) sel.view = 0;
      $('#galMain').innerHTML = imgHtml(p, sel.color, sel.view);
      $('#galThumbs').innerHTML = Array.apply(null, Array(n)).map(function (_, i) {
        return '<button type="button" class="thumb' + (i === sel.view ? ' on' : '') + '" data-view="' + i + '" aria-label="' + T('viewN', { n: num(i + 1) }) + '" aria-pressed="' + (i === sel.view) + '">' + imgHtml(p, sel.color, i) + '</button>';
      }).join('');
      $$('.thumb', $('#galThumbs')).forEach(function (b) { b.onclick = function () { sel.view = +b.dataset.view; drawGallery(); }; });
      $('#colorName').textContent = tr(cfg.palette[sel.color]);
    }
    function sync() {
      $$('.swatch', $('#pdp .opt')).forEach(function (b) { var on = b.dataset.color === sel.color; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      $$('#sizes .size-chip').forEach(function (b) { var on = b.dataset.size === sel.size; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      var left = sel.size ? Math.max(0, p.sizes[sel.size] - L.cartSubQty(cart, p.id, sel.size)) : null;
      var msg = '';
      if (sel.size && left !== null && left <= 3 && left > 0) msg = T('lowStock', { n: num(left) });
      else if (sel.size && left === 0) msg = T('noMore');
      $('#stockMsg').textContent = msg;
      sel.qty = Math.max(1, Math.min(sel.qty, sel.size ? Math.max(1, left) : 9));
      $('#qv').textContent = num(sel.qty);
      $('#addBag').disabled = L.totalStock(p) === 0; $('#reserveBtn').disabled = L.totalStock(p) === 0;
    }
    function need() {
      if (sel.size) { $('#pickHint').textContent = ''; return true; }
      $('#pickHint').textContent = T('pickSize');
      $('#sizes').classList.remove('shake'); void $('#sizes').offsetWidth; $('#sizes').classList.add('shake');
      return false;
    }
    function add() {
      var r = L.addToCart(cart, { id: p.id, color: sel.color, size: sel.size, qty: sel.qty }, cfg.products);
      if (!r.added) { toast(T('noMore')); return false; }
      cart = r.cart; save(K.cart, cart); refreshCounts();
      toast(r.reason === 'partial' ? T('onlyLeft', { n: num(p.sizes[sel.size]), a: num(r.added) }) : T('added'));
      return true;
    }
    $$('#pdp .opt .swatch').forEach(function (b) { b.onclick = function () { sel.color = b.dataset.color; drawGallery(); sync(); }; });
    $$('#sizes .size-chip').forEach(function (b) { b.onclick = function () { sel.size = b.dataset.size; sel.qty = 1; $('#pickHint').textContent = ''; sync(); }; });
    $('#qm').onclick = function () { sel.qty = Math.max(1, sel.qty - 1); sync(); };
    $('#qp').onclick = function () {
      var max = sel.size ? p.sizes[sel.size] - L.cartSubQty(cart, p.id, sel.size) : 9;
      sel.qty = Math.min(Math.max(1, max), sel.qty + 1); sync();
    };
    $('#addBag').onclick = function () { if (need() && add()) sync(); };
    $('#reserveBtn').onclick = function () { if (need() && add()) location.hash = L.buildHash('cart', null, { mode: 'reserve' }); };
    drawGallery(); sync();
  }

  var cartMode = 'order';
  function pageCart(q) {
    if (q && q.mode === 'reserve') cartMode = 'reserve'; else if (q && q.mode === 'order') cartMode = 'order';
    if (!cart.length) return '<section class="block empty"><h1 class="page-title">' + T('bagTitle') + '</h1><p>' + T('bagEmpty') + '</p><a class="btn primary" href="#/shop">' + T('startShopping') + '</a></section>';
    var cust = load(K.cust, {}), sub = L.cartSubtotal(cart, cfg.products), fee = L.deliveryFee(sub, cartMode, cfg);
    var lines = cart.map(function (i) {
      var p = prod(i.id), key = L.lineKey(i), c = cfg.palette[i.color];
      return '<li class="line" data-key="' + esc(key) + '"><a class="line-img" href="#/p/' + p.id + '">' + imgHtml(p, i.color, 0) + '</a><div class="line-info"><a href="#/p/' + p.id + '"><b>' + esc(tr(p.name)) + '</b></a>' +
        '<p class="meta"><i class="swatch tiny" style="--c:' + c.hex + '"></i> ' + esc(tr(c)) + ' / ' + esc(i.size) + '</p>' +
        '<div class="line-row"><div class="stepper sm"><button type="button" data-q="-1" aria-label="-">&minus;</button><output>' + num(i.qty) + '</output><button type="button" data-q="1" aria-label="+">+</button></div><span class="pr">' + price(p.price * i.qty) + '</span></div></div>' +
        '<button type="button" class="rm" data-rm="1" aria-label="' + T('remove') + ': ' + esc(tr(p.name)) + '">&times;</button></li>';
    }).join('');
    var freeNote = cartMode === 'order' && cfg.delivery.freeOver && sub < cfg.delivery.freeOver ? '<p class="hint soft">' + T('freeFrom', { v: price(cfg.delivery.freeOver) }) + '</p>' : '';
    return '<section class="block cartpage"><h1 class="page-title">' + T('bagTitle') + '</h1><div class="cart-grid"><ul class="lines">' + lines + '</ul>' +
      '<form class="checkout" id="co" novalidate><h2>' + T('howTitle') + '</h2>' +
      '<div class="modes" role="radiogroup"><button type="button" role="radio" class="mode' + (cartMode === 'order' ? ' on' : '') + '" aria-checked="' + (cartMode === 'order') + '" data-mode="order"><b>' + T('modeOrder') + '</b><span>' + T('modeOrderSub') + '</span></button>' +
      '<button type="button" role="radio" class="mode' + (cartMode === 'reserve' ? ' on' : '') + '" aria-checked="' + (cartMode === 'reserve') + '" data-mode="reserve"><b>' + T('modeReserve') + '</b><span>' + T('modeReserveSub', { h: num(cfg.reservationHoldHours || 48) }) + '</span></button></div>' +
      '<div class="field"><label for="cn">' + T('yourName') + '</label><input id="cn" name="name" autocomplete="name" value="' + esc(cust.name || '') + '"><p class="err" id="en"></p></div>' +
      '<div class="field"><label for="cp">' + T('yourPhone') + '</label><input id="cp" name="phone" type="tel" dir="ltr" inputmode="tel" autocomplete="tel" value="' + esc(cust.phone || '') + '"><p class="err" id="ep"></p></div>' +
      (cartMode === 'order' ? '<div class="field"><label for="ca">' + T('yourAddress') + '</label><textarea id="ca" name="address" rows="2" autocomplete="street-address">' + esc(cust.address || '') + '</textarea><p class="err" id="ea"></p></div>' : '') +
      '<div class="field"><label for="cx">' + T('yourNotes') + '</label><textarea id="cx" name="notes" rows="2"></textarea></div>' +
      '<dl class="sum"><div><dt>' + T('subtotal') + '</dt><dd>' + price(sub) + '</dd></div>' + (cartMode === 'order' ? '<div><dt>' + T('delivery') + '</dt><dd>' + (fee ? price(fee) : T('free')) + '</dd></div>' : '') +
      '<div class="tot"><dt>' + T('total') + '</dt><dd id="grand">' + price(sub + fee) + '</dd></div></dl>' + freeNote +
      '<button class="btn wa big" type="submit" id="send">' + ic.wa + (cartMode === 'reserve' ? T('sendWaReserve') : T('sendWa')) + '</button><p class="hint soft">' + T('waHint') + '</p></form></div></section>';
  }

  function bindCart() {
    var form = $('#co'); if (!form) return;
    $$('.line').forEach(function (li) {
      var key = li.dataset.key;
      $$('[data-q]', li).forEach(function (b) {
        b.onclick = function () {
          var i = cart.filter(function (x) { return L.lineKey(x) === key; })[0];
          cart = L.setQty(cart, key, i.qty + (+b.dataset.q), cfg.products); save(K.cart, cart); refreshCounts(); route(true);
        };
      });
      $('[data-rm]', li).onclick = function () { cart = L.removeLine(cart, key); save(K.cart, cart); refreshCounts(); route(true); };
    });
    $$('.mode').forEach(function (b) { b.onclick = function () { cartMode = b.dataset.mode; keepFields(); route(true); }; });
    function keepFields() { save(K.cust, { name: $('#cn').value, phone: $('#cp').value, address: $('#ca') ? $('#ca').value : (load(K.cust, {}).address || '') }); }
    form.onsubmit = function (e) {
      e.preventDefault();
      var name = $('#cn').value.trim(), phone = $('#cp').value.trim(), addr = $('#ca') ? $('#ca').value.trim() : '', ok = true, first = null;
      function bad(id, eid, msg) { $(eid).textContent = msg; if (!first) first = $(id); ok = false; }
      ['#en', '#ep', '#ea'].forEach(function (x) { if ($(x)) $(x).textContent = ''; });
      if (name.length < 2) bad('#cn', '#en', T('errName'));
      if (!L.isValidPhone(phone, cfg.whatsapp.defaultCountryCode)) bad('#cp', '#ep', T('errPhone'));
      if (cartMode === 'order' && addr.length < 5) bad('#ca', '#ea', T('errAddress'));
      if (!cart.length) { toast(T('errEmpty')); return; }
      if (!ok) { first.focus(); return; }
      var customer = { name: name, phone: L.normalizePhone(phone, cfg.whatsapp.defaultCountryCode), address: addr, notes: $('#cx').value.trim() };
      save(K.cust, { name: name, phone: phone, address: addr });
      var id = L.newOrderId(now());
      var msg = L.buildMessage({ cfg: cfg, lang: lang, mode: cartMode, items: cart, customer: customer, orderId: id });
      var url = L.waUrl(cfg.whatsapp.number, msg);
      var sub = L.cartSubtotal(cart, cfg.products), total = sub + L.deliveryFee(sub, cartMode, cfg);
      orders.unshift({ id: id, ts: now(), mode: cartMode, items: cart, total: total, lang: lang, customer: { name: name } });
      orders = orders.slice(0, 30); save(K.orders, orders);
      cart = []; save(K.cart, cart); refreshCounts();
      window.open(url, '_blank', 'noopener');
      var sentMode = cartMode; cartMode = 'order';
      app.innerHTML = pageSent(id, url, msg, sentMode); bindSent(url, msg); window.scrollTo(0, 0);
      app.focus();
    };
  }
  function pageSent(id, url, msg, mode) {
    return '<section class="block sent"><div class="ticket"><p class="kicker">' + (mode === 'reserve' ? T('statusReserve') : T('statusOrder')) + ' ' + esc(id) + '</p><h1>' + T('sentTitle') + '</h1><p>' + T('sentText') + '</p>' +
      '<pre class="msg" dir="auto">' + esc(msg) + '</pre><div class="cta"><a class="btn wa" id="again" href="' + esc(url) + '" target="_blank" rel="noopener">' + ic.wa + T('openAgain') + '</a>' +
      '<button type="button" class="btn ghost" id="copy">' + T('copyMsg') + '</button><a class="btn ghost" href="#/shop">' + T('keepShopping') + '</a></div></div></section>';
  }
  function bindSent(url, msg) {
    $('#copy').onclick = function () {
      var done = function () { toast(T('copied')); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(done, done); else done();
    };
  }

  function pageSaved() {
    var list = cfg.products.filter(function (p) { return fav.indexOf(p.id) >= 0; });
    return '<section class="block"><h1 class="page-title">' + T('wishTitle') + '</h1>' + (list.length ? grid(list) : '<div class="empty"><p>' + T('wishEmpty') + '</p><a class="btn primary" href="#/shop">' + T('shopNow') + '</a></div>') + '</section>';
  }

  function pageOrders() {
    var rows = orders.map(function (o, idx) {
      var items = o.items.map(function (i) { var p = prod(i.id); return p ? num(i.qty) + ' x ' + esc(L.tr(p.name, lang)) + ' (' + esc(i.size) + ')' : ''; }).filter(Boolean).join('<br>');
      return '<li class="order"><div><b>' + (o.mode === 'reserve' ? T('statusReserve') : T('statusOrder')) + '</b> <span class="meta">' + T('ref') + ' ' + esc(o.id) + ' &middot; ' + new Date(o.ts).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span></div><p>' + items + '</p><div class="line-row"><span class="pr">' + price(o.total) + '</span><button type="button" class="btn ghost small" data-re="' + idx + '">' + T('reorder') + '</button></div></li>';
    }).join('');
    return '<section class="block"><h1 class="page-title">' + T('ordersTitle') + '</h1><p class="sub">' + T('ordersSub') + '</p>' +
      (orders.length ? '<ul class="orders">' + rows + '</ul><button type="button" class="btn ghost small" id="clrOrders">' + T('ordersClear') + '</button>' : '<div class="empty"><p>' + T('noOrders') + '</p><a class="btn primary" href="#/shop">' + T('shopNow') + '</a></div>') + '</section>';
  }
  function bindOrders() {
    $$('[data-re]').forEach(function (b) {
      b.onclick = function () {
        var o = orders[+b.dataset.re], added = 0;
        o.items.forEach(function (i) { var r = L.addToCart(cart, i, cfg.products); cart = r.cart; added += r.added; });
        save(K.cart, cart); refreshCounts();
        if (added) location.hash = '#/cart'; else toast(T('noMore'));
      };
    });
    var c = $('#clrOrders'); if (c) c.onclick = function () { orders = []; save(K.orders, orders); route(true); };
  }

  function pageAbout() {
    var ig = cfg.contact.instagram ? '<p><a href="https://instagram.com/' + esc(cfg.contact.instagram) + '" rel="noopener" target="_blank">@' + esc(cfg.contact.instagram) + '</a></p>' : '';
    return '<section class="block about"><h1 class="page-title">' + esc(tr(cfg.about.title)) + '</h1><p class="lead">' + esc(tr(cfg.about.text)) + '</p>' +
      '<div class="info-cards"><div class="info"><h3>' + T('address') + '</h3><p>' + esc(tr(cfg.contact.address)) + '</p></div><div class="info"><h3>' + T('hours') + '</h3><p>' + esc(tr(cfg.contact.hours)) + '</p></div>' +
      '<div class="info"><h3>' + T('deliveryInfo') + '</h3><p>' + esc(tr(cfg.delivery.note)) + '</p><p>' + T('freeFrom', { v: price(cfg.delivery.freeOver) }) + '</p></div></div>' + ig +
      '<a class="btn wa" href="' + esc(L.waUrl(cfg.whatsapp.number, '')) + '" target="_blank" rel="noopener">' + ic.wa + 'WhatsApp</a></section>';
  }
  function pageNotFound() { return '<section class="block empty"><p>' + T('notFound') + '</p><a class="btn primary" href="#/">' + T('navHome') + '</a></section>'; }

  /* ---------- router ---------- */
  var lastKey = '';
  function route(keepScroll) {
    var r = L.parseHash(location.hash), html;
    switch (r.name) {
      case 'home': html = pageHome(); break;
      case 'shop': html = pageShop(r.query); break;
      case 'new': html = pageNew(); break;
      case 'p': html = pageProduct(r.arg); break;
      case 'cart': html = pageCart(r.query); break;
      case 'saved': html = pageSaved(); break;
      case 'orders': html = pageOrders(); break;
      case 'about': html = pageAbout(); break;
      default: html = pageNotFound();
    }
    app.innerHTML = html;
    document.body.dataset.page = r.name;
    renderChrome();
    bindCards(app);
    if (r.name === 'cart') bindCart();
    if (r.name === 'orders') bindOrders();
    if (r.name === 'shop') bindShop(r.query);
    var key = r.name + '/' + (r.arg || '');
    if (keepScroll !== true && key !== lastKey) window.scrollTo(0, 0);
    lastKey = key;
    if (r.name === 'shop' && r.query.q && $('#hq')) $('#hq').value = r.query.q;
  }
  function bindShop(q) {
    var panel = $('#fpanel'), btn = $('#fbtn');
    if (q._open === '1') panel.classList.add('open');
    btn.onclick = function () { var o = panel.classList.toggle('open'); btn.setAttribute('aria-expanded', o); };
    $('#sort').onchange = function () { location.hash = L.buildHash('shop', null, Object.assign({}, q, { sort: this.value === 'new' ? '' : this.value })); };
    var sq = $('#sq'), tm;
    sq.oninput = function () {
      clearTimeout(tm);
      tm = setTimeout(function () {
        var qq = Object.assign({}, q, { q: sq.value.trim() });
        history.replaceState(null, '', L.buildHash('shop', null, qq));
        var keepOpen = panel.classList.contains('open');
        route(true);
        var s2 = $('#sq'); if (keepOpen) { $('#fpanel').classList.add('open'); $('#fbtn').setAttribute('aria-expanded', 'true'); }
        s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length);
      }, 250);
    };
  }
  window.addEventListener('hashchange', function () { route(); });
  window.addEventListener('storage', function (e) {
    if (e.key === K.cart) { cart = L.sanitizeCart(load(K.cart, []), cfg.products); renderChrome(); }
  });

  document.documentElement.lang = lang; document.documentElement.dir = I[lang].dir;
  document.title = tr(cfg.brand.name) + ' | ' + tr(cfg.brand.tagline);
  $('#skip').textContent = T('skip');
  route();
})();
