// ---------- hand-drawn surfaces: every wall, roof and plank is painted here, pixel by pixel ----------
function speck(g, r, w, h, n, colors, sw = 1, sh = 1) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    g.fillRect(Math.floor(r() * w), Math.floor(r() * h), sw, sh);
  }
}
const TEX = {
  // painted hollow blocks, two courses of paint showing where it has chipped
  block: (base, dark, light, seed = 1) => painted(64, 64, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let col = -1; col < 2; col++) {
      const x = col * 32 + (row % 2 ? 16 : 0), y = row * 16;
      g.fillStyle = r() > 0.6 ? light : base; g.fillRect(x + 1, y + 1, 31, 15);
      g.fillStyle = dark; g.fillRect(x, y + 15, 32, 1); g.fillRect(x + 31, y, 1, 16);
    }
    speck(g, r, w, h, 70, [dark, light, base]);
    speck(g, r, w, h, 9, ["#8d8a80", "#77746c"], 3, 2);            // bare cement where the paint is gone
  }, { repeat: true }),
  plaster: (base, stain, seed = 2) => painted(64, 64, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    speck(g, r, w, h, 120, [stain, base, "#f3e2b6"]);
    for (let i = 0; i < 5; i++) { g.fillStyle = stain; const x = Math.floor(r() * w); g.fillRect(x, 0, 1 + Math.floor(r() * 2), 6 + Math.floor(r() * 26)); }   // rain streaks
    g.strokeStyle = stain; g.lineWidth = 1; g.beginPath(); let x = 10, y = 60; g.moveTo(x, y);
    for (let i = 0; i < 7; i++) { x += 2 + r() * 5; y -= 3 + r() * 5; g.lineTo(Math.round(x) + 0.5, Math.round(y) + 0.5); } g.stroke();
  }, { repeat: true }),
  // corrugated iron: light crest, dark trough, rust creeping up from the edge
  yero: (lite, mid, dark, rust, seed = 3) => painted(32, 64, (g, w, h) => {
    const r = rng(seed);
    for (let x = 0; x < w; x++) { const p = x % 8; g.fillStyle = p < 2 ? lite : p < 5 ? mid : dark; g.fillRect(x, 0, 1, h); }
    for (let i = 0; i < 26; i++) { g.fillStyle = rust; const x = Math.floor(r() * w); g.fillRect(x, h - 2 - Math.floor(r() * 22), 1, 3 + Math.floor(r() * 16)); }
    speck(g, r, w, h, 30, [rust, dark]);
    g.fillStyle = dark; for (let x = 3; x < w; x += 8) g.fillRect(x, 6, 1, 1);                                        // roofing nails
  }, { repeat: true }),
  wood: (base, dark, lite, seed = 4) => painted(64, 64, (g, w, h) => {
    const r = rng(seed);
    for (let p = 0; p < 4; p++) {
      g.fillStyle = p % 2 ? base : lite; g.fillRect(0, p * 16, w, 16);
      g.fillStyle = dark; g.fillRect(0, p * 16 + 15, w, 1);
      for (let i = 0; i < 7; i++) { g.fillStyle = dark; g.fillRect(Math.floor(r() * w), p * 16 + 2 + Math.floor(r() * 12), 6 + Math.floor(r() * 18), 1); }
      g.fillStyle = dark; g.fillRect(Math.floor(r() * 56) + 2, p * 16 + 5 + Math.floor(r() * 6), 3, 2);              // a knot
      g.fillStyle = "#3a2416"; g.fillRect(3 + Math.floor(r() * 4), p * 16 + 7, 1, 1); g.fillRect(58, p * 16 + 7, 1, 1); // nail heads
    }
  }, { repeat: true }),
  concrete: (seed = 5) => painted(64, 64, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = "#978c84"; g.fillRect(0, 0, w, h);
    speck(g, r, w, h, 260, ["#8a7f77", "#a59a92", "#90857d", "#7d726b"]);
    g.fillStyle = "#6f655f"; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);                                           // slab joints
    g.fillStyle = "#5f7a52"; for (let i = 0; i < 14; i++) g.fillRect(Math.floor(r() * w), r() > 0.5 ? 1 : 0, 2, 1);     // moss in the joint
    g.strokeStyle = "#6f655f"; g.beginPath(); let x = 40, y = 2; g.moveTo(x, y);
    for (let i = 0; i < 8; i++) { x += (r() - 0.6) * 8; y += 4 + r() * 5; g.lineTo(Math.round(x) + 0.5, Math.round(y) + 0.5); } g.stroke();
    speck(g, r, w, h, 4, ["#55504c"], 2, 2);                                                                          // old gum
  }, { repeat: true }),
  floral: (base, seed = 6) => painted(32, 32, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(r() * 28) + 1, y = Math.floor(r() * 28) + 1, c = ["#ffd95a", "#fff3e0", "#7fd8a6"][i % 3];
      g.fillStyle = c; g.fillRect(x + 1, y, 1, 3); g.fillRect(x, y + 1, 3, 1);
      g.fillStyle = "#e8452e"; g.fillRect(x + 1, y + 1, 1, 1);
    }
  }, { repeat: true }),
  jalousie: (lit, seed = 7) => painted(24, 32, (g, w, h) => {
    g.fillStyle = "#3a2c2a"; g.fillRect(0, 0, w, h);
    for (let y = 2; y < h - 2; y += 4) { g.fillStyle = lit; g.fillRect(2, y, 9, 3); g.fillRect(13, y, 9, 3); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(2, y + 2, 9, 1); g.fillRect(13, y + 2, 9, 1); }
  }, { mip: false }),
};
