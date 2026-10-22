// 15-labels.js - pixel-art label atlas for the sari-sari store (invented coder-pun brands, no real marks).
// Everything is drawn with fillRect from a bitmap font; no fillText, no Math.random, no external assets.
// returns { canvas, cells, warnings } ; cells[name] = { x, y, w, h } in atlas pixels.
function makeLabelAtlas() {
  const AW = 1024, AH = 512, GUT = 2;
  const warnings = [];
  let seed = 20261006;                                   // mulberry32, reset on every call -> deterministic
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  // ---------- colour helpers (6-digit hex only)
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
  const shade = (c, f) => f < 0 ? mix(c, '#000000', -f) : mix(c, '#ffffff', f);

  // ---------- bitmap fonts: 5x7 and 3x5, rows as ints, glyphs trimmed to their ink columns
  const F5S = 'A:14,17,17,31,17,17,17 B:30,17,17,30,17,17,30 C:14,17,16,16,16,17,14 D:30,17,17,17,17,17,30 E:31,16,16,30,16,16,31 F:31,16,16,30,16,16,16 G:14,17,16,23,17,17,15 H:17,17,17,31,17,17,17 I:14,4,4,4,4,4,14 J:7,2,2,2,2,18,12 K:17,18,20,24,20,18,17 L:16,16,16,16,16,16,31 M:17,27,21,21,17,17,17 N:17,25,21,19,17,17,17 O:14,17,17,17,17,17,14 P:30,17,17,30,16,16,16 Q:14,17,17,17,21,18,13 R:30,17,17,30,20,18,17 S:15,16,16,14,1,1,30 T:31,4,4,4,4,4,4 U:17,17,17,17,17,17,14 V:17,17,17,17,17,10,4 W:17,17,17,21,21,27,17 X:17,17,10,4,10,17,17 Y:17,17,10,4,4,4,4 Z:31,1,2,4,8,16,31 '
    + '0:14,17,19,21,25,17,14 1:4,12,4,4,4,4,14 2:14,17,1,2,4,8,31 3:30,1,1,14,1,1,30 4:2,6,10,18,31,2,2 5:31,16,30,1,1,17,14 6:6,8,16,30,17,17,14 7:31,1,2,4,8,8,8 8:14,17,17,14,17,17,14 9:14,17,17,15,1,2,12 '
    + '+:0,4,4,31,4,4,0 -:0,0,0,14,0,0,0 .:0,0,0,0,0,0,4 ,:0,0,0,0,0,4,8 ::0,0,4,0,4,0,0 !:4,4,4,4,4,0,4 ?:14,17,1,2,4,0,4 &:12,18,20,8,21,18,13 /:1,1,2,4,8,16,16 #:10,10,31,10,31,10,10 _:0,0,0,0,0,0,31 =:0,0,31,0,31,0,0 <:2,4,8,16,8,4,2 >:8,4,2,1,2,4,8 (:2,4,8,8,8,4,2 ):8,4,2,2,2,4,8 %:24,25,2,4,8,19,3';
  const F3S = 'A:2,5,7,5,5 B:6,5,6,5,6 C:3,4,4,4,3 D:6,5,5,5,6 E:7,4,6,4,7 F:7,4,6,4,4 G:3,4,5,5,3 H:5,5,7,5,5 I:2,2,2,2,2 J:1,1,1,5,2 K:5,5,6,5,5 L:4,4,4,4,7 M:5,7,7,5,5 N:7,5,5,5,5 O:2,5,5,5,2 P:6,5,6,4,4 Q:2,5,5,6,3 R:6,5,6,5,5 S:3,4,2,1,6 T:7,2,2,2,2 U:5,5,5,5,7 V:5,5,5,5,2 W:5,5,7,7,5 X:5,5,2,5,5 Y:5,5,2,2,2 Z:7,1,2,4,7 '
    + '0:7,5,5,5,7 1:2,6,2,2,7 2:6,1,2,4,7 3:6,1,2,1,6 4:5,5,7,1,1 5:7,4,6,1,6 6:3,4,7,5,7 7:7,1,2,2,2 8:7,5,7,5,7 9:7,5,7,1,6 '
    + '+:0,2,7,2,0 -:0,0,7,0,0 .:0,0,0,0,2 ,:0,0,0,2,4 ::0,2,0,2,0 !:2,2,2,0,2 ?:6,1,2,0,2 &:2,5,2,5,3 /:1,1,2,4,4 #:5,7,5,7,5 _:0,0,0,0,7 =:0,7,0,7,0 <:1,2,4,2,1 >:4,2,1,2,4 (:1,2,2,2,1 ):4,2,2,2,4 %:5,1,2,4,5';
  const parseFont = (s, bits, spaceW) => {
    const g = { ' ': { rows: [], x0: 0, gw: spaceW } };
    s.split(' ').forEach(t => {
      const rows = t.slice(2).split(',').map(Number); let lo = bits, hi = -1;
      rows.forEach(r => { for (let k = 0; k < bits; k++) if (r & (1 << (bits - 1 - k))) { lo = Math.min(lo, k); hi = Math.max(hi, k); } });
      g[t[0]] = { rows, x0: lo, gw: hi - lo + 1 };
    });
    return g;
  };
  const FONTS = { 5: { g: parseFont(F5S, 5, 3), bits: 5, h: 7 }, 3: { g: parseFont(F3S, 3, 2), bits: 3, h: 5 } };

  // ptext(ctx, str, x, y, color, {font:5|3, scale, align:'left'|'center'|'right', maxWidth, shadow, sd, wob, dry})
  // maxWidth: shrinks the scale, then drops 5x7 to 3x5, then wraps on spaces. '\n' forces a line break.
  // wob: per-glyph random drop of 0..wob px (hand-painted baselines). dry: measure only. Returns {w,h,font,scale,lines}.
  function ptext(c, str, x, y, color, o = {}) {
    let font = o.font || 5, scale = o.scale || 1, lines = String(str).split('\n');
    const lw = (s, f, sc) => { const G = FONTS[f].g; let w = 0; for (let i = 0; i < s.length; i++) w += (G[s[i]] || G['?']).gw + (i ? 1 : 0); return w * sc; };
    const widest = () => Math.max(...lines.map(s => lw(s, font, scale)));
    if (o.maxWidth) {
      while (widest() > o.maxWidth && scale > 1) scale--;
      if (widest() > o.maxWidth && font === 5) font = 3;
      if (widest() > o.maxWidth) {
        const out = [];
        lines.forEach(s => { let cur = ''; s.split(' ').forEach(wd => { const t = cur ? cur + ' ' + wd : wd; if (cur && lw(t, font, scale) > o.maxWidth) { out.push(cur); cur = wd; } else cur = t; }); out.push(cur); });
        lines = out;
      }
    }
    const F = FONTS[font], lh = (F.h + 1) * scale, res = { w: widest(), h: lines.length * lh - scale, font, scale, lines };
    if (o.dry) return res;
    lines.forEach((s, li) => {
      const w = lw(s, font, scale), cy = y + li * lh;
      const cx = o.align === 'center' ? x - (w >> 1) : o.align === 'right' ? x - w : x;
      const jit = [...s].map(() => o.wob ? Math.floor(rnd() * (o.wob + 1)) : 0);
      const pass = (col, dx, dy) => {
        c.fillStyle = col; let px = cx;
        [...s].forEach((ch, gi) => {
          const g = F.g[ch] || F.g['?'];
          g.rows.forEach((r, ry) => { for (let k = 0; k < g.gw; k++) if (r & (1 << (F.bits - 1 - (g.x0 + k)))) c.fillRect(px + k * scale + dx, cy + ry * scale + dy + jit[gi], scale, scale); });
          px += (g.gw + 1) * scale;
        });
      };
      if (o.shadow) pass(o.shadow, o.sd || scale, o.sd || scale);
      pass(color, 0, 0);
    });
    return res;
  }

  // ---------- pixel icons: rows split by '/', '.' = clear. keys: # ink, a accent, b second colour, others fixed below
  const PAL = { w: '#fbf6e8', y: '#ffd23f', r: '#d62d2d', o: '#8a5a2b', g: '#3fbf5a', k: '#1c1410', u: '#3a7bd5', s: '#b9bdc4', p: '#f08fb3', c: '#7fd6ef' };
  const ICONS = {
    cup: '..w.w...../...w.w..../.#######../.#ooooo###/.#wwwww#.#/.#wwwww###/..#####...',
    tick: '..####../.#wwww#./#wwwwwg#/#wwwwgw#/#wgwgww#/#wwgwww#/.#wwww#./..####..',
    bear: '.##....##./#oo.##.oo#/#oooooooo#/#o#oooo#o#/#oooooooo#/#oowkkwoo#/.#oowwoo#./..#oooo#..',
    fish: '..#####...../.########..#/#w#######.##/##########.#/#########.##/.########..#/..#####.....',
    snake: '.aaaaaa../aaaaaaaa./aa.....k./aaaaaaa../.aaaaaaa./.......aa/aaaaaaaa./.aaaaaa..',
    bug: '..g...g../...g.g.../..ggggg../g.ggkgg.g/.ggggggg./g.ggggg.g/..ggggg../.g.ggg.g./...ggg...',
    steamcup: '..w..w..../...w..w.../..w..w..../.aaaaaaa../.aaaaaaaaa/.aaaaaaa.a/.aaaaaaaaa/..aaaaaa../...aaaa...',
    shield: '#########/#bbbbbbb#/#bbbbbbb#/#bbbbbwb#/#bbbbwbb#/#bwbwbbb#/.#bwbbb#./.#bbbbb#./..#bbb#../...###...',
    cookie: '..#####../.#ooooo#./#ookooko#/#ooooooo#/#kooooko#/#ooooooo#/#oookooo#/.#ooooo#./..#####..',
    garlic: '....#..../...#w#.../...#w#.../..#www#../.#wwwww#./#wwswsww#/#wwswsww#/.#wwswww#/..#wwww#./...####..',
    coin: '..####../.#ywyy#./#ywyyyy#/#yyyyyy#/#yyyyyy#/#yyyyyy#/.#yyyy#./..####..',
    drop: '...w.../...w.../..www../.wwwww./wwwwwww/wwwwwww/.wwwww./..www..',
    noodle: '.aa..aa..aa..aa/a..aa..aa..aa../.aa..aa..aa..aa/a..aa..aa..aa..',
    bubbles: '..ww....w./.wwww..www/.wwww...w./..ww......',
    pixels: 'yyy...ppp/yyy...ppp/yyy...ppp/...ccc.../...ccc.../...ccc.../ggg...www/ggg...www/ggg...www',
    hex: '...###.../.##www##./#wwwwwww#/#wwwwwww#/#wwwwwww#/.##www##./...###...',
    cheese: '......###./...###yy#./###yyoyy#./#yyyyyyy#./#yoyyyoy#./#########.',
    slits: '##......##/##......##/##......##/##......##/##......##',
    slice: '..#####../.#y.w.y#./#yw...wy#/#.ywyyw.#/#yywwwyy#/#.ywyyw.#/#yw...wy#/.#y.w.y#./..#####..',
    cube: 'wwwww/wcccw/wcccw/wwwww',
    star: '....y..../....y..../...yyy.../yyyyyyyyy/.yyyyyyy./..yyyyy../..yyyyy../.yyy.yyy./.yy...yy.',
    pop: '.uuu./uuuuu/uuuuu/ppppp/ppppp/ppppp/.ppp./..o../..o..',
    person: '....ssss..../...ssssss.../...ssssss.../...ssssss..../....ssss..../.....ss...../..ssssssss../.ssssssssss./ssssssssssss/ssssssssssss/ssssssssssss/ssssssssssss/ssssssssssss'
  };
  const bmSize = a => { const r = a.split('/'); return [Math.max(...r.map(s => s.length)), r.length]; };
  const bm = (c, art, x, y, pal, sc = 1) => art.split('/').forEach((row, ry) => {
    for (let i = 0; i < row.length; i++) { const k = row[i]; if (k === '.') continue; R(c, x + i * sc, y + ry * sc, sc, sc, (pal && pal[k]) || PAL[k] || '#ff00ff'); }
  });

  // ---------- product table (declarative). t: s sachet, c can, p pack/box, b bottle label, g bag, k crate
  const SZ = { s: [24, 32], c: [32, 40], p: [32, 40], b: [24, 32], g: [40, 48], k: [64, 32] };
  const P = (n, t, bg, c2, ink, acc, word, sub, x) => Object.assign({ n, t, w: SZ[t][0], h: SZ[t][1], bg, c2, ink, acc, word, sub }, x);
  const TABLE = [
    P('sachet_kape', 's', '#c4262e', '#f1e3c4', '#4b1014', '#ffd23f', 'KAPE', '3IN1', { icon: 'cup', band: 1, wc: '#c4262e' }),
    P('sachet_commit', 's', '#5a3418', '#e0a82e', '#2a170a', '#f5d36b', 'COMMIT', 'COF\nFEE', { band: 1, wc: '#3b2210' }),
    P('sachet_uptime', 's', '#1f5fbf', '#f3f7fb', '#0b2a5e', '#a8d8ff', 'UPTIME', '99.9%', { icon: 'drop', band: 1, wc: '#1f5fbf' }),
    P('sachet_smooth', 's', '#f08fb3', '#fff3f7', '#8a2150', '#ffffff', 'SMO\nOTH', 'UI', { f: 5, wc: '#ffffff' }),
    P('sachet_green', 's', '#2e9e4a', '#f4f9ec', '#0f3f1c', '#b8f27b', 'GREEN', 'BUILD', { icon: 'tick', band: 1, wc: '#1f7a37' }),
    P('sachet_deploy', 's', '#f08a1c', '#fff0d0', '#5a2a00', '#2f6fe0', 'DEP\nLOY', '', { f: 5, back: 'burst', wc: '#ffffff', wsh: '#0d2a6e' }),
    P('sachet_array', 's', '#2a9d57', '#f4f1e1', '#0e3d22', '#e23b3b', 'ARRAY', '', { back: 'swirl', band: 1, wc: '#2a9d57' }),
    P('sachet_downtime', 's', '#9fd8f0', '#f7a9c4', '#1f4f6e', '#ffffff', 'DOWN\nTIME', '', { icon: 'bubbles', band: 1, wc: '#8a1f55' }),
    P('sachet_kilobyte', 's', '#2f8f3c', '#6b3a1e', '#10300f', '#ffe9a8', 'KILO', 'BYTE', { f: 5, wc: '#ffffff', subband: 1 }),
    P('sachet_baremetal', 's', '#f4f7fa', '#2a5db0', '#10285a', '#2a5db0', 'BARE', 'METAL', { icon: 'bear', band: 1, wc: '#ffffff' }),
    P('can_404', 'c', '#c8281e', '#ffd23f', '#3a0c08', '#ffd23f', '404', 'SARDINES', { icon: 'fish', ring: 1, wc: '#ffffff' }),
    P('can_python', 'c', '#f2cf1d', '#22221e', '#22221e', '#2f7d32', 'PYTHON', '', { icon: 'snake', band: 1, wc: '#f2cf1d' }),
    P('can_bugspray', 'c', '#1c1f1c', '#52d34a', '#000000', '#52d34a', 'BUG', 'SPRAY', { icon: 'bug', slash: 1, wc: '#52d34a', sc: '#ffffff' }),
    P('can_java', 'c', '#7a1f2b', '#e8c36a', '#2e0a10', '#e8c36a', 'JAVA', '', { icon: 'steamcup', wc: '#e8c36a' }),
    P('can_stack', 'c', '#2b63b8', '#f4f8ff', '#0f2a5c', '#2b63b8', 'STACK', 'MILK', { icon: 'drop', wc: '#ffffff', subband: 1 }),
    P('pack_prompt', 'p', '#f6c91a', '#d6261d', '#5a0d08', '#d6261d', 'PROMPT', 'CANTON', { icon: 'noodle', band: 1, wc: '#ffffff' }),
    P('pack_null', 'p', '#f5f8fb', '#1f55b5', '#0d2a63', '#1f55b5', 'NULL', 'NOODLES', { icon: 'steamcup', ip: { w: '#9db7e0' }, wc: '#1f55b5', wsh: '#b7c9ea', subband: 1, sc: '#ffffff' }),
    P('pack_cookies', 'p', '#2d5fc4', '#f3e2b0', '#0f2a5e', '#f3e2b0', 'COOKIES', 'ACCEPT ALL', { icon: 'cookie', band: 1, wc: '#2d5fc4' }),
    P('box_safemode', 'p', '#f4f6f8', '#2457b8', '#10285a', '#2457b8', 'SAFE', 'MODE', { icon: 'shield', wc: '#2457b8', wsh: '#b9c8e8', sf: 5 }),
    P('box_sudo', 'p', '#1c8f8a', '#e8fffb', '#06302e', '#e8fffb', 'SUDO', 'SOAP', { icon: 'bubbles', wc: '#ffffff', sf: 5 }),
    P('box_token', 'p', '#6a3fb8', '#ffd23f', '#2a1457', '#ffd23f', 'TOKEN', '', { icon: 'coin', wc: '#ffd23f' }),
    P('box_chocnull', 'p', '#f3e6c4', '#c42b2b', '#5a1010', '#ffffff', 'CHOC', 'NULL', { wc: '#c42b2b', wsh: '#e2c98f', sf: 5, subband: 1 }),
    P('bottle_toyo', 'b', '#f2c230', '#7a3a10', '#3a1a05', '#7a3a10', 'TOYO', '.JS', { icon: 'drop', ip: { w: '#7a3a10' }, band: 1, wc: '#f2c230', sc: '#3a1a05' }),
    P('bottle_suka', 'b', '#f5f5f0', '#c8281e', '#4a0d08', '#c8281e', 'SUKA', '.PY', { icon: 'drop', ip: { w: '#c8281e' }, band: 1, wc: '#ffffff' }),
    P('bottle_patis', 'b', '#c22a24', '#f2c230', '#3d0a07', '#f2c230', 'PATIS', '.ENV', { icon: 'fish', wc: '#f2c230', sc: '#ffffff' }),
    P('bottle_vibecola', 'b', '#c8281e', '#ffffff', '#4a0d08', '#ffffff', 'VIBE', 'COLA', { icon: 'noodle', wc: '#ffffff' }),
    P('bottle_clawd', 'b', '#d97757', '#a8503a', '#2a1810', '#2a1810', 'CLAWD', '', { icon: 'slits', isc: 2, wc: '#fff4e8' }),
    P('bottle_sprint', 'b', '#34b24a', '#d9f24a', '#0f3d1a', '#d9f24a', 'SPRINT', '', { icon: 'slice', wc: '#ffffff' }),
    P('bottle_cpp', 'b', '#2f8a4a', '#e8d28a', '#0e3a1c', '#e8d28a', 'C++', 'TEA', { icon: 'cube', wc: '#e8d28a', sf: 5, sc: '#ffffff' }),
    P('bottle_ctrlz', 'b', '#2a61c4', '#ffffff', '#0b2a66', '#ffffff', 'CTRL\n+Z', '', { icon: 'drop', wc: '#ffffff' }),
    P('bag_chicharam', 'g', '#c62828', '#f0b423', '#4a0d0d', '#f0b423', 'CHICHA\nRAM', '16GB', { icon: 'noodle', wc: '#f0b423', subband: 1, sc: '#c62828' }),
    P('bag_boybyte', 'g', '#2457c9', '#f6c91a', '#0d2566', '#f6c91a', 'BOY', 'BYTE', { icon: 'garlic', wc: '#f6c91a', sf: 5, sc: '#ffffff' }),
    P('bag_pixels', 'g', '#6b3fc0', '#ffd23f', '#26104f', '#ffd23f', 'PIXELS', '', { icon: 'pixels', isc: 2, wc: '#ffffff' }),
    P('bag_node', 'g', '#2f9e4a', '#bff08a', '#0e3d1a', '#bff08a', 'NODE', 'CHIPS', { icon: 'hex', isc: 2, wc: '#ffffff' }),
    P('bag_cache', 'g', '#f08a1c', '#ffd84a', '#5a2a00', '#ffd84a', 'CACHE', 'CHEESE', { icon: 'cheese', isc: 2, wc: '#fff3d0', sc: '#fff3d0' }),
    P('crate_vibecola', 'k', '#c8281e', '#f6efe0', '#4a0d08', '#c8281e', 'VIBE\nCOLA', '', {}),
    P('crate_clawd', 'k', '#d97757', '#f6e8d6', '#4a2010', '#a8503a', 'CLAWD', 'SODA', {}),
    P('crate_sprint', 'k', '#34b24a', '#f1f7d8', '#0f3d1a', '#1f7a37', 'SPRINT', 'LIME', {})
  ];

  function drawProduct(c, L) {
    const w = L.w, h = L.h, t = L.t, bg = L.bg, iw = w - 2;
    R(c, 0, 0, w, h, bg);
    let y0 = 3, y1 = h - 4;
    if (t === 's' || t === 'g') {
      for (const y of [1, h - 4]) { R(c, 1, y, w - 2, 3, shade(bg, -0.2)); for (let x = 2; x < w - 1; x += 2) R(c, x, y, 1, 3, shade(bg, 0.15)); }
      R(c, 1, 4, w - 2, 1, shade(bg, -0.38)); R(c, 1, h - 5, w - 2, 1, shade(bg, -0.38));
      if (t === 's') { R(c, w - 5, 1, 3, 1, shade(bg, -0.6)); R(c, w - 4, 2, 1, 1, shade(bg, -0.6)); }   // tear notch
      y0 = t === 's' ? 5 : 6; y1 = t === 's' ? h - 6 : h - 7;
    }
    if (t === 'c') {
      R(c, 1, 1, w - 2, 2, shade(bg, 0.3)); R(c, 1, 3, w - 2, 1, shade(bg, -0.3));
      R(c, 1, h - 3, w - 2, 2, shade(bg, 0.3)); R(c, 1, h - 4, w - 2, 1, shade(bg, -0.3));
      R(c, 3, 5, 2, h - 10, shade(bg, 0.22)); R(c, w - 5, 5, 3, h - 10, shade(bg, -0.16));
      y0 = 6; y1 = h - 7;
    }
    if (t === 'p') { R(c, 1, 1, w - 2, 2, shade(bg, -0.16)); R(c, 1, h - 3, w - 2, 2, shade(bg, -0.16)); y0 = 4; y1 = h - 5; }
    if (t === 'b') { R(c, 1, 1, w - 2, 1, L.c2); R(c, 1, h - 2, w - 2, 1, L.c2); y0 = 3; y1 = h - 4; }
    if (t === 'g') for (let y = 5; y < h - 5; y++) { const x = 5 + Math.floor((y - 5) / 3); R(c, x, y, 3, 1, shade(bg, 0.3)); R(c, x + 4, y, 1, 1, shade(bg, 0.18)); }   // foil stripe
    const cx = w >> 1, cy = h >> 1;
    if (L.back === 'burst') {
      const ink = shade(L.acc, -0.45), inb = (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; return Math.hypot(dx, dy) < 7.5 + 3 * Math.abs(Math.cos(Math.atan2(dy, dx) * 5)); };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inb(x, y)) R(c, x, y, 1, 1, inb(x - 1, y) && inb(x + 1, y) && inb(x, y - 1) && inb(x, y + 1) ? L.acc : ink);
    }
    if (L.back === 'swirl') for (let a = 0; a < 15; a += 0.08) R(c, Math.round(cx + 0.7 * a * Math.cos(a)) - 1, Math.round(cy + 0.7 * a * Math.sin(a)) - 1, 2, 2, L.acc);

    const items = [];
    const mk = (txt, font, col, sh, band, bandCol) => {
      const o = { font, maxWidth: iw, align: 'center' }, m = ptext(c, txt, 0, 0, col, Object.assign({ dry: true }, o));
      if (m.w > iw) warnings.push(L.n + ': "' + txt + '" overflows by ' + (m.w - iw));
      return { h: m.h + (band ? 2 : 0), draw: yy => {
        if (band) R(c, 1, yy, w - 2, m.h + 2, bandCol);
        ptext(c, txt, cx, yy + (band ? 1 : 0), col, Object.assign({ shadow: band ? null : sh }, o));
      } };
    };
    if (L.icon) {
      const art = ICONS[L.icon], [bw, bh] = bmSize(art), sc = L.isc || 1, rg = L.ring ? 3 : 0, th = bh * sc + rg * 2;
      const pal = Object.assign({ '#': L.ink, a: L.acc, b: L.c2 }, L.ip);
      items.push({ h: th, art: 1, draw: yy => {
        if (rg) { const rx = bw / 2 + 5, ry = th / 2; for (let y = 0; y < th; y++) for (let x = 0; x < w; x++) { const dx = (x + 0.5 - w / 2) / rx, dy = (y + 0.5 - th / 2) / ry; if (dx * dx + dy * dy <= 1) R(c, x, yy + y, 1, 1, L.c2); } }
        const bx = Math.round((w - bw * sc) / 2), by = yy + rg;
        bm(c, art, bx, by, pal, sc);
        if (L.slash) for (let i = 0; i < bh; i++) { const x = bx + Math.round(i * (bw - 1) / (bh - 1)); R(c, x - 1, by + i, 4, 1, '#000000'); R(c, x, by + i, 2, 1, '#e23b3b'); }
      } });
    }
    if (L.word) items.push(mk(L.word, L.f || 5, L.wc || '#ffffff', L.wsh || L.ink, L.band, L.c2));
    if (L.sub) items.push(mk(L.sub, L.sf || 3, L.sc || L.acc, L.ssh || null, L.subband, L.c2));
    const sum = () => items.reduce((a, i) => a + i.h, 0), avail = y1 - y0 + 1;
    if (sum() + items.length - 1 > avail && items[0].art) { items.shift(); warnings.push(L.n + ': icon dropped, no room'); }
    if (sum() + items.length - 1 > avail) warnings.push(L.n + ': stack taller than region by ' + (sum() + items.length - 1 - avail));
    const spare = Math.max(0, avail - sum()), gap = Math.max(1, Math.min(3, Math.floor(spare / (items.length + 1))));
    let yy = y0 + Math.max(0, (spare - gap * (items.length - 1)) >> 1);
    items.forEach(it => { it.draw(yy); yy += it.h + gap; });
    return shade(bg, -0.5);
  }

  function drawCrate(c, L) {
    const w = 64, h = 32, bg = L.bg, slot = shade(bg, -0.55);
    R(c, 0, 0, w, h, bg); R(c, 1, 1, w - 2, 3, shade(bg, 0.22)); R(c, 1, h - 4, w - 2, 3, shade(bg, -0.2));
    for (const x0 of [3, 52]) for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { R(c, x0 + k * 5, 6 + r * 7, 4, 4, slot); R(c, x0 + k * 5, 10 + r * 7, 4, 1, shade(bg, 0.12)); }
    R(c, 14, 6, 36, 20, shade(L.c2, -0.3)); R(c, 15, 7, 34, 18, L.c2);
    const o = { maxWidth: 32, align: 'center' };
    const m = ptext(c, L.word, 0, 0, '#000', Object.assign({ font: 5, dry: true }, o)), sh = L.sub ? 6 : 0;
    if (m.w > 32) warnings.push(L.n + ': overflow');
    let y = 7 + ((18 - m.h - sh) >> 1);
    ptext(c, L.word, 32, y, L.bg, Object.assign({ font: 5 }, o));
    if (L.sub) ptext(c, L.sub, 32, y + m.h + 2, L.acc, Object.assign({ font: 3 }, o));
    return shade(bg, -0.5);
  }

  // ---------- one-off signs and posters, each returns its border colour
  const SIGNS = {
    sign_store: [256, 48, c => {
      R(c, 0, 0, 256, 48, '#f2c230');
      for (let i = 0; i < 60; i++) R(c, 41 + Math.floor(rnd() * 170), 5 + Math.floor(rnd() * 38), 1 + Math.floor(rnd() * 3), 1, '#dcab1c');
      R(c, 0, 1, 256, 3, '#c8281e'); R(c, 0, 44, 256, 3, '#c8281e');
      R(c, 1, 4, 40, 40, '#1f4fb0'); R(c, 215, 4, 40, 40, '#1f4fb0'); R(c, 41, 4, 1, 40, '#b58a0f'); R(c, 214, 4, 1, 40, '#b58a0f');
      bm(c, ICONS.star, 12, 15, {}, 2); bm(c, ICONS.star, 226, 15, {}, 2);
      ptext(c, 'ALING NENA', 128, 5, '#c8281e', { font: 5, scale: 3, align: 'center', shadow: '#7a1410', sd: 1, wob: 1 });
      ptext(c, 'SARI-SARI STORE', 128, 30, '#1f4fb0', { font: 5, scale: 2, align: 'center', wob: 1 });
      for (const [x, y] of [[44, 6], [208, 6], [44, 39], [208, 39]]) R(c, x, y, 2, 2, '#5a3a08');
      return '#8a6410';
    }],
    sign_utang: [96, 64, c => {
      R(c, 0, 0, 96, 64, '#b98a52');
      for (let x = 0; x < 96; x++) if ((x & 3) < 2) R(c, x, 0, 1, 64, '#a97a45');
      for (let i = 0; i < 18; i++) R(c, 2 + Math.floor(rnd() * 90), 2 + Math.floor(rnd() * 58), 2 + Math.floor(rnd() * 4), 1, '#8f6232');
      R(c, 4, 2, 13, 6, '#e9dfb8'); R(c, 79, 2, 13, 6, '#e9dfb8');
      const k = '#15110f';
      ptext(c, 'BAWAL', 48, 11, k, { font: 5, scale: 2, align: 'center', wob: 1 });
      ptext(c, 'UTANG', 48, 28, k, { font: 5, scale: 2, align: 'center', wob: 1 });
      R(c, 14, 45, 68, 1, '#c23a2a');
      ptext(c, 'TECH DEBT PWEDE', 48, 49, k, { font: 5, align: 'center', wob: 1 });
      return '#6e4a22';
    }],
    sign_load: [160, 64, c => {
      R(c, 0, 0, 80, 64, '#1f5fc4'); R(c, 80, 0, 80, 64, '#25a05a');
      for (const x of [40, 120]) R(c, x, 0, 1, 64, x < 80 ? '#1a52aa' : '#1e8a4c');
      const inb = (x, y) => { const dx = (x + 0.5 - 80) / 62, dy = (y + 0.5 - 27) / 22, a = Math.atan2(dy, dx); return Math.pow(Math.pow(Math.abs(dx), 4) + Math.pow(Math.abs(dy), 4), 0.25) < 1 + 0.07 * Math.cos(a * 14); };
      for (let y = 0; y < 64; y++) for (let x = 0; x < 160; x++) if (inb(x, y)) R(c, x, y, 1, 1, inb(x - 1, y) && inb(x + 1, y) && inb(x, y - 1) && inb(x, y + 1) ? '#ffd51f' : '#c98a00');
      ptext(c, 'E-LOAD', 80, 17, '#d62020', { font: 5, scale: 3, align: 'center', shadow: '#7d1411', sd: 2 });
      ptext(c, 'DATA  TOKENS  WIFI', 80, 53, '#ffffff', { font: 5, align: 'center', shadow: '#0d2a66', sd: 1 });
      for (let x = 4; x < 156; x += 4) { R(c, x, 3, 2, 1, '#0d3f8a'); R(c, x, 60, 2, 1, '#0d3f8a'); }
      for (const [x, y] of [[4, 4], [151, 4], [4, 55], [151, 55]]) { R(c, x, y, 5, 5, '#d8dbe0'); R(c, x + 1, y + 1, 3, 3, '#20252b'); }
      return '#0a2a66';
    }],
    sign_pisowifi: [48, 72, c => {
      R(c, 0, 0, 48, 72, '#9aa3ad'); R(c, 1, 1, 46, 1, '#c7cfd6'); R(c, 1, 1, 1, 70, '#c7cfd6');
      for (const [x, y] of [[3, 66], [42, 66], [3, 3], [42, 3]]) { R(c, x, y, 3, 3, '#6b737c'); R(c, x + 1, y + 1, 1, 1, '#c7cfd6'); }
      R(c, 2, 6, 44, 32, '#eef2f4');
      ptext(c, 'PISO', 24, 8, '#d12a1e', { font: 5, scale: 2, align: 'center' });
      ptext(c, 'WIFI', 24, 23, '#1f4fb0', { font: 5, scale: 2, align: 'center' });
      R(c, 5, 40, 38, 14, '#4a5058'); R(c, 6, 41, 36, 12, '#0c0f10');
      ptext(c, '05:00', 24, 44, '#3df06b', { font: 5, align: 'center' });
      for (const x of [11, 22, 33]) { R(c, x, 56, 5, 3, '#3df06b'); R(c, x, 59, 5, 1, '#16803a'); }
      R(c, 17, 62, 14, 7, '#5b636c'); R(c, 23, 63, 2, 5, '#0c0f10'); R(c, 19, 64, 3, 3, '#ffd23f');
      return '#4a5058';
    }],
    sign_yelo: [64, 40, c => {
      R(c, 0, 0, 64, 40, '#f1f1ea'); R(c, 1, 13, 62, 1, '#d0d0c4'); R(c, 1, 27, 62, 1, '#d0d0c4');
      for (let i = 0; i < 10; i++) R(c, 2 + Math.floor(rnd() * 58), 2 + Math.floor(rnd() * 34), 2, 1, '#e0e0d2');
      bm(c, ICONS.pop, 2, 4, {}); bm(c, ICONS.pop, 57, 4, {});
      ptext(c, 'YELO', 32, 4, '#1f4fb0', { font: 5, scale: 2, align: 'center' });
      ptext(c, 'ICE CANDY\nICE TUBIG', 32, 22, '#1f4fb0', { font: 3, align: 'center', maxWidth: 60 });
      return '#9a9a8a';
    }],
    poster_missing: [48, 64, c => {
      R(c, 0, 0, 48, 64, '#f4f0e0'); R(c, 4, 1, 10, 3, '#d9d2a8'); R(c, 34, 1, 10, 3, '#d9d2a8');
      ptext(c, 'NAWAWALA:', 24, 5, '#2a2622', { font: 3, align: 'center' });
      ptext(c, 'USERS', 24, 12, '#c8281e', { font: 5, align: 'center' });
      bm(c, ICONS.person, 12, 20, {}, 2);
      ptext(c, '?', 24, 33, '#8f9399', { font: 5, align: 'center' });
      ptext(c, 'HULING\nNAKITA: NEVER', 24, 48, '#2a2622', { font: 3, align: 'center', maxWidth: 46 });
      R(c, 2, 60, 44, 1, '#b7b19a'); for (let x = 9; x < 46; x += 8) R(c, x, 61, 1, 2, '#b7b19a');
      return '#a8a28f';
    }],
    poster_calendar: [48, 64, c => {
      R(c, 0, 0, 48, 64, '#f7f3e6'); R(c, 1, 1, 46, 12, '#c8281e'); R(c, 22, 2, 4, 2, '#7a1410');
      ptext(c, 'OKTUBRE', 24, 5, '#ffffff', { font: 5, align: 'center' });
      [...'SMTWTFS'].forEach((ch, i) => ptext(c, ch, 5 + i * 6, 16, i % 7 === 0 ? '#c8281e' : '#7a7a72', { font: 3, align: 'center' }));
      for (let d = 1; d <= 31; d++) {
        const i = d - 1 + 4, col = i % 7, row = Math.floor(i / 7), x = 3 + col * 6, y = 23 + row * 6, pay = d === 15 || d === 30;
        R(c, x, y, 5, 5, pay ? '#c8281e' : '#cfcabb'); R(c, x + 1, y + 1, 3, 3, pay ? '#ffd23f' : (col === 0 || col === 6 ? '#f3dcdc' : '#ffffff'));
        if (d <= 6) { R(c, x + 1, y + 1, 1, 1, '#555555'); R(c, x + 3, y + 1, 1, 1, '#555555'); R(c, x + 2, y + 2, 1, 1, '#555555'); R(c, x + 1, y + 3, 1, 1, '#555555'); R(c, x + 3, y + 3, 1, 1, '#555555'); }
      }
      ptext(c, '2026', 24, 56, '#8a857a', { font: 3, align: 'center' });
      return '#a8a28f';
    }]
  };

  // ---------- assemble: shelf-pack, draw each cell clipped, then bleed edges into the 2px gutters
  const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH;
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  R(ctx, 0, 0, AW, AH, '#1d2127');
  const jobs = [];
  ['sign_store', 'sign_load', 'sign_utang', 'sign_pisowifi', 'poster_missing', 'poster_calendar', 'sign_yelo'].forEach(n => jobs.push({ n, w: SIGNS[n][0], h: SIGNS[n][1], draw: SIGNS[n][2] }));
  TABLE.filter(r => r.t === 'k').forEach(r => jobs.push({ n: r.n, w: r.w, h: r.h, draw: c => drawCrate(c, r) }));
  ['g', 'c', 'p', 's', 'b'].forEach(t => TABLE.filter(r => r.t === t).forEach(r => jobs.push({ n: r.n, w: r.w, h: r.h, draw: c => drawProduct(c, r) })));
  const cells = {};
  let px = GUT, py = GUT, rowH = 0;
  jobs.forEach(j => {
    if (px + j.w + GUT > AW) { px = GUT; py += rowH + GUT; rowH = 0; }
    cells[j.n] = { x: px, y: py, w: j.w, h: j.h };
    ctx.save(); ctx.translate(px, py); ctx.beginPath(); ctx.rect(0, 0, j.w, j.h); ctx.clip();
    const b = j.draw(ctx);                                    // returns the darker border colour
    R(ctx, 0, 0, j.w, 1, b); R(ctx, 0, j.h - 1, j.w, 1, b); R(ctx, 0, 0, 1, j.h, b); R(ctx, j.w - 1, 0, 1, j.h, b);
    ctx.restore();
    px += j.w + GUT; rowH = Math.max(rowH, j.h);
  });
  if (py + rowH + GUT > AH) warnings.push('atlas overflow: needs height ' + (py + rowH + GUT));
  Object.values(cells).forEach(({ x, y, w, h }) => {
    ctx.drawImage(cv, x, y, 1, h, x - GUT, y, GUT, h); ctx.drawImage(cv, x + w - 1, y, 1, h, x + w, y, GUT, h);
    ctx.drawImage(cv, x, y, w, 1, x, y - GUT, w, GUT); ctx.drawImage(cv, x, y + h - 1, w, 1, x, y + h, w, GUT);
    ctx.drawImage(cv, x, y, 1, 1, x - GUT, y - GUT, GUT, GUT); ctx.drawImage(cv, x + w - 1, y, 1, 1, x + w, y - GUT, GUT, GUT);
    ctx.drawImage(cv, x, y + h - 1, 1, 1, x - GUT, y + h, GUT, GUT); ctx.drawImage(cv, x + w - 1, y + h - 1, 1, 1, x + w, y + h, GUT, GUT);
  });
  return { canvas: cv, cells, warnings, ptext };
}
