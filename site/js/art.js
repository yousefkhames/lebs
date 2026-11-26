/* Lebs garment art: draws a garment as inline SVG in any color. Used when a product has no photos. */
(function (root) {
  'use strict';
  var uid = 0;

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(hex, other, t) {
    var a = hexToRgb(hex), b = hexToRgb(other);
    return '#' + a.map(function (v, i) { return ('0' + Math.round(v + (b[i] - v) * t).toString(16)).slice(-2); }).join('');
  }
  function lum(hex) { var c = hexToRgb(hex); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }

  var SHAPES = {
    tee: {
      d: 'M140 96 L96 116 L58 176 L98 198 L126 164 L126 408 L274 408 L274 164 L302 198 L342 176 L304 116 L260 96 Q200 140 140 96 Z',
      det: function (s) { return '<path d="M140 96 Q200 140 260 96" fill="none" stroke="' + s + '" stroke-width="5"/><path d="M130 396 H270" stroke="' + s + '" stroke-dasharray="5 5" fill="none"/>'; }
    },
    shirt: {
      d: 'M142 96 L98 108 L56 340 L98 350 L126 176 L126 428 L274 428 L274 176 L302 350 L344 340 L302 108 L258 96 L200 124 Z',
      det: function (s, b) {
        var o = '<path d="M142 96 L200 124 L176 150 L150 104 Z M258 96 L200 124 L224 150 L250 104 Z" fill="' + mix(b, '#fff', .22) + '" stroke="' + s + '" stroke-width="2"/>';
        o += '<path d="M200 124 V428" stroke="' + s + '" stroke-width="2"/>';
        for (var y = 160; y < 420; y += 48) o += '<circle cx="209" cy="' + y + '" r="4" fill="' + mix(b, '#000', .4) + '"/>';
        o += '<rect x="226" y="214" width="34" height="38" fill="none" stroke="' + s + '" stroke-dasharray="4 4"/>';
        o += '<path d="M62 326 L100 336 M300 336 L338 326" stroke="' + s + '" stroke-dasharray="4 4"/>';
        return o;
      }
    },
    hoodie: {
      d: 'M146 98 L98 112 L54 352 L102 360 L126 184 L126 420 L274 420 L274 184 L298 360 L346 352 L302 112 L254 98 Q200 150 146 98 Z',
      pre: function (b) { return '<path d="M140 100 Q148 36 200 34 Q252 36 260 100 Q200 164 140 100Z" fill="' + mix(b, '#000', .18) + '"/>'; },
      det: function (s, b) {
        return '<path d="M146 98 Q200 150 254 98" fill="none" stroke="' + s + '" stroke-width="3"/><path d="M200 138 V420" stroke="' + mix(b, '#000', .45) + '" stroke-width="3"/>' +
          '<path d="M150 340 L170 280 H230 L250 340 Z" fill="none" stroke="' + s + '" stroke-width="2" stroke-dasharray="5 4"/>' +
          '<path d="M186 146 V190 M214 146 V190" stroke="' + mix(b, '#fff', .5) + '" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M126 410 H274" stroke="' + s + '" stroke-width="6"/>';
      }
    },
    dress: {
      d: 'M152 86 Q200 128 248 86 L282 108 L268 218 L338 454 L62 454 L132 218 L118 108 Z',
      det: function (s, b) {
        return '<path d="M152 86 Q200 128 248 86" fill="none" stroke="' + s + '" stroke-width="3"/>' +
          '<path d="M131 224 Q200 244 269 224 L266 246 Q200 266 134 246 Z" fill="' + mix(b, '#000', .25) + '"/>' +
          '<path d="M200 262 V454 M165 262 L128 454 M235 262 L272 454" stroke="' + s + '" stroke-width="2" opacity=".6"/>' +
          '<path d="M70 442 H330" stroke="' + s + '" stroke-dasharray="5 5" fill="none"/>';
      }
    },
    abaya: {
      d: 'M146 90 Q200 128 254 90 L292 106 L350 420 L296 430 L282 250 L292 476 L208 476 L200 160 L192 476 L108 476 L118 250 L104 430 L50 420 L108 106 Z',
      det: function (s, b) {
        return '<path d="M146 90 Q200 128 254 90" fill="none" stroke="' + s + '" stroke-width="3"/>' +
          '<path d="M200 128 L200 476" stroke="' + mix(b, '#000', .5) + '" stroke-width="3"/>' +
          '<path d="M110 460 H190 M210 460 H290" stroke="' + s + '" stroke-dasharray="5 5" fill="none"/>' +
          '<path d="M60 408 L102 418 M298 418 L340 408" stroke="' + mix(b, '#fff', .45) + '" stroke-width="5"/>';
      }
    },
    trousers: {
      d: 'M128 74 H272 L304 456 H212 L200 214 L188 456 H96 Z',
      det: function (s, b) {
        return '<rect x="128" y="74" width="144" height="22" fill="' + mix(b, '#000', .15) + '"/>' +
          '<path d="M200 96 V214" stroke="' + s + '" stroke-width="2"/><path d="M142 110 Q160 150 156 170 M258 110 Q240 150 244 170" fill="none" stroke="' + s + '" stroke-width="2"/>' +
          '<path d="M104 444 H186 M214 444 H296" stroke="' + s + '" stroke-dasharray="5 5" fill="none"/>';
      }
    },
    skirt: {
      d: 'M134 100 H266 L344 448 H56 Z',
      det: function (s, b) {
        var o = '<rect x="134" y="100" width="132" height="22" fill="' + mix(b, '#000', .18) + '"/>';
        for (var i = 0; i <= 12; i++) { var t = i / 12; o += '<path d="M' + (140 + t * 120) + ' 124 L' + (66 + t * 268) + ' 446" stroke="' + s + '" stroke-width="2" opacity=".55"/>'; }
        return o;
      }
    },
    jacket: {
      d: 'M148 98 L100 112 L54 360 L100 370 L126 190 L126 408 L274 408 L274 190 L300 370 L346 360 L300 112 L252 98 L200 128 Z',
      det: function (s, b) {
        var o = '<path d="M148 98 L200 128 L172 160 L140 112 Z M252 98 L200 128 L228 160 L260 112 Z" fill="' + mix(b, '#fff', .18) + '" stroke="' + s + '" stroke-width="2"/>';
        o += '<path d="M200 128 V408" stroke="' + s + '" stroke-width="3"/>';
        [180, 230, 280, 330].forEach(function (y) { o += '<circle cx="210" cy="' + y + '" r="5" fill="#B87333" stroke="' + s + '"/>'; });
        o += '<rect x="138" y="240" width="46" height="44" fill="none" stroke="' + s + '" stroke-dasharray="4 4"/><rect x="216" y="240" width="46" height="44" fill="none" stroke="' + s + '" stroke-dasharray="4 4"/>';
        o += '<path d="M128 396 H272" stroke="' + s + '" stroke-dasharray="5 5" fill="none"/>';
        return o;
      }
    },
    scarf: {
      d: 'M90 70 Q200 40 310 70 Q330 200 300 280 Q320 380 296 452 L224 440 Q214 360 218 300 Q150 230 90 240 Q70 150 90 70 Z',
      det: function (s, b) {
        var o = '<path d="M100 100 Q200 76 300 100 M96 150 Q200 128 316 150 M94 200 Q196 180 318 210" fill="none" stroke="' + s + '" stroke-width="2" opacity=".5"/>';
        for (var x = 228; x <= 290; x += 10) o += '<path d="M' + x + ' 442 L' + (x + 2) + ' 470" stroke="' + mix(b, '#000', .25) + '" stroke-width="3" stroke-linecap="round"/>';
        return o;
      }
    }
  };

  function garment(type, hex, view, o) {
    o = o || {};
    var sh = SHAPES[type] || SHAPES.tee, id = 'g' + (++uid);
    var light = lum(hex) > 0.62;
    var stroke = light ? mix(hex, '#000', .38) : mix(hex, '#fff', .35);
    var bg = mix(hex, o.paper || '#F4EDE1', .8), bg2 = mix(hex, o.paper || '#F4EDE1', .62);
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + (o.label || '') + '">';
    s += '<defs><linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + bg + '"/><stop offset="1" stop-color="' + bg2 + '"/></linearGradient>' +
      '<linearGradient id="' + id + 's" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>' +
      '<pattern id="' + id + 'w" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(' + (view === 2 ? 0 : 45) + ')"><path d="M0 4H8M4 0V8" stroke="' + (light ? '#000' : '#fff') + '" stroke-opacity=".08" stroke-width="1.4"/></pattern></defs>';
    if (!o.bare) s += '<rect width="400" height="500" fill="url(#' + id + 'b)"/>';
    if (view === 2) {
      // fabric close-up: weave, a seam and a woven label
      s += '<rect width="400" height="500" fill="' + hex + '"/><rect width="400" height="500" fill="url(#' + id + 'w)"/>';
      s += '<rect width="400" height="500" fill="url(#' + id + 's)"/>';
      s += '<path d="M-10 330 Q200 290 410 340" fill="none" stroke="' + stroke + '" stroke-width="3" stroke-dasharray="9 7"/>';
      s += '<path d="M-10 346 Q200 306 410 356" fill="none" stroke="' + stroke + '" stroke-width="3" stroke-dasharray="9 7" opacity=".6"/>';
      s += '<rect x="248" y="86" width="84" height="46" rx="3" fill="' + (light ? '#2a2620' : '#f3ebdc') + '" transform="rotate(-6 290 109)"/>';
      s += '<text x="290" y="115" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="20" fill="' + (light ? '#f3ebdc' : '#2a2620') + '" transform="rotate(-6 290 109)">' + (o.mark || 'Lebs') + '</text>';
      return s + '</svg>';
    }
    if (!o.bare) s += '<ellipse cx="200" cy="476" rx="130" ry="10" fill="#000" opacity=".10"/>';
    var g = '';
    if (view === 0) {
      g += '<path d="M200 54 V40 Q200 20 218 24 Q232 28 224 44" fill="none" stroke="#6b5f4e" stroke-width="4" stroke-linecap="round"/>';
      g += '<path d="M200 54 L84 112 M200 54 L316 112" stroke="#6b5f4e" stroke-width="4" stroke-linecap="round"/>';
    }
    if (sh.pre) g += sh.pre(hex);
    g += '<path d="' + sh.d + '" fill="' + hex + '" stroke="' + stroke + '" stroke-width="3" stroke-linejoin="round"/>';
    g += '<path d="' + sh.d + '" fill="url(#' + id + 's)"/>';
    g += '<path d="' + sh.d + '" fill="url(#' + id + 'w)"/>';
    g += sh.det(stroke, hex);
    if (view === 1) s += '<g transform="rotate(-4 200 250) translate(0 6)">' + g + '</g>'; else s += g;
    return s + '</svg>';
  }

  root.LebsArt = { garment: garment, mix: mix, lum: lum };
})(typeof self !== 'undefined' ? self : this);
