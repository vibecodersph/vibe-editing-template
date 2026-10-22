// stage.js of episode 13, "Legit Developer": joined right after src/sets/kwarto.js, so it sees the set's names (ACTST, HS, KW, actLine, win, env, ramp, ...).
// It stages what belongs to this episode only: Buloy's and Claude's acts, the laptop's screens, the mug's print (the hidden gag, CK-21) and the screen's light.

SET.cine.look = Object.assign({}, SET.cine.look, TL.cine_look || {});                          // the episode tunes the night look from script.json

// ---------- the clock (from the script's acts and the voiced words in audio/manifest.json) ----------
const L13 = (n) => actLine(n);
const T_PROD = L13("b_broke").s + 1.259;                  // "production"
const T_GOODS = L13("c_shipped").s + 2.381;               // "Goods"
const T_HIST = [L13("c_search").s - 0.3, L13("b_defend").e + 0.6];          // the browser history, from the cut to the laptop until Buloy's answer is done
const T_RED = [L13("b_broke").s - 0.25, L13("c_fixed").s];                  // the deploy log in red; it turns green on the word "Inayos"
const T_GREEN = L13("c_fixed").s;

// ---------- the mug (CK-21): a print only a close camera can read, never pointed at ----------
KW.mug = ["WHILE TRUE:", "KAPE( )"];

// ---------- the screens: words only where a camera shows them whole (rd), bars elsewhere ----------
function drawHistory(t, rd, g) {
  g.fillStyle = "#14172a"; g.fillRect(0, 0, SW, SH); g.fillStyle = "#232846"; g.fillRect(0, 0, SW, 14);
  g.fillStyle = "#ee5f5f"; g.fillRect(5, 5, 4, 4); g.fillStyle = "#f2c230"; g.fillRect(12, 5, 4, 4); g.fillStyle = "#5fd87a"; g.fillRect(19, 5, 4, 4);
  g.fillStyle = "#10121f"; g.fillRect(36, 3, 120, 9);
  for (let i = 0; i < 3; i++) {
    const y = 18 + i * 40;
    g.fillStyle = "#1e2440"; g.fillRect(4, y, SW - 8, 37);
    g.fillStyle = "#4a5a9a"; g.fillRect(9, y + 13, 9, 9); g.fillStyle = "#1e2440"; g.fillRect(12, y + 15, 3, 3);
    SCT(rd, "HOW TO WRITE A", 26, y + 3, "#f2f0ff", { font: 5, scale: 2 });
    SCT(rd, "FOR LOOP IN PYTHON", 26, y + 20, "#f2f0ff", { font: 5, scale: 2 });
  }
  g.fillStyle = "#e02424"; g.fillRect(SW - 184, SH - 24, 180, 21);
  SCT(rd, "11X THIS MONTH", SW - 94, SH - 21, "#ffffff", { font: 5, scale: 2, align: "center" });
}
function drawLog(t, rd, g, ok) {
  const pulse = Math.floor(t * 2.4) % 2 === 0;
  g.fillStyle = ok ? "#06210f" : (pulse ? "#3a0a0c" : "#2c070a"); g.fillRect(0, 0, SW, SH);
  g.fillStyle = ok ? "#1c6a34" : (pulse ? "#ff3b3b" : "#a82424"); g.fillRect(0, 0, SW, 5); g.fillRect(0, SH - 5, SW, 5);
  SCT(rd, "DEPLOY PRODUCTION", SW / 2, 12, ok ? "#c4ffd2" : "#ffd2cc", { font: 5, scale: 2, align: "center" });
  SCT(rd, ok ? "... OK" : "... FAILED", SW / 2, 34, ok ? "#5fff8a" : (pulse ? "#ff4a3d" : "#e03a30"), { font: 5, scale: 4, align: "center" });
  SCT(rd, ok ? "BUILD OK" : "ERROR: BUILD FAILED", SW / 2, 74, ok ? "#c4ffd2" : "#ffd2cc", { font: 5, scale: 2, align: "center" });
  SCT(rd, ok ? "STATUS 200" : "STATUS 500", SW / 2, 100, ok ? "#ffffff" : "#ff6a5a", { font: 5, scale: 4, align: "center" });
}
KW.screen = (t, rd, g) => {
  if (t >= T_GREEN) drawLog(t, rd, g, true);
  else if (t >= T_RED[0]) drawLog(t, rd, g, false);
  else if (t >= T_HIST[0] && t < T_HIST[1]) drawHistory(t, rd, g);
  else drawEditor(t);
};
KW.screenLight = (t) => {
  if (t >= T_GREEN) return { c: [0.55, 1.0, 0.65], i: 1.5 };
  if (t >= T_RED[0]) return { c: [1.0, 0.26, 0.2], i: 1.6 + 0.3 * Math.sin(t * 17) * Math.sin(t * 5.3) };
  return { c: [1.0, 0.72, 0.47], i: NIGHT.screen };
};

// ---------- Buloy ----------
// face keys: sad brow smile lid gx gy wet cheek anger open; u: [turn, lean] (lean + forward, - back)
ACTST.b_ask = { h: [0.0, 0.05, 0.03], u: [0, 0.1], f: { sad: 0.8, brow: -0.75, smile: -0.3, lid: -0.2, gx: 0.4, gy: 0.0, wet: 0.25 }, hands: (t) => { const k = ramp(0.7, 1.3, t); return { rest: 1 - k, lift: k }; } };   // the hands leave the desk, the worry turns to Claude
ACTST.b_explain = { h: [0.0, 0.0, 0.04], u: [0, 0.14], f: { brow: 0.35, smile: 0.1, lid: 0.0, gx: 0.4 }, hands: "open" };
ACTST.b_grabe = { h: [0.0, -0.04, 0.0], u: [0, -0.12], f: { brow: 0.9, anger: 0.25, smile: -0.2, lid: -0.2, gx: 0.4 }, hands: "chest" };
ACTST.b_defend = { h: [0.0, 0.0, 0.05], u: [0, 0.1], f: { brow: 0.7, smile: 0.05, lid: 0.1, anger: 0.1, gx: 0.4 }, hands: "shrug" };
ACTST.b_point = { h: [0.0, 0.02, 0.0], u: [0, 0.22], f: { brow: 0.3, smile: -0.1, lid: 0.15, gx: 0.4 }, hands: "rest" };
ACTST.b_online = { h: [0.0, 0.1, 0.0], u: [0, 0.1], f: { brow: -0.2, sad: 0.3, smile: -0.15, lid: 0.2, gx: 0.2, gy: 0.5 }, hands: "rest" };
ACTST.b_broke = { h: [0.0, 0.05, 0.0], u: [0, 0.06], f: { sad: 0.7, brow: -0.7, smile: -0.5, lid: 0.1, wet: 0.3, gx: 0.3, gy: 0.3 }, hands: (t) => { const k = ramp(T_PROD - 0.3, T_PROD - 0.02, t); return { rest: 1 - k, head: k }; } };
ACTST.b_legit = { h: [0.0, -0.05, 0.07], u: [0, -0.12], f: { smile: 1.0, cheek: 1.0, brow: 0.6, lid: 0.28, gx: 0.4 }, hands: "rest" };       // a teasing grin: corners and cheeks up, the eyes narrowed
ACTST.b_thanks = { h: [0.0, 0.0, 0.0], u: [0, 0.04], f: { smile: 0.85, cheek: 0.7, brow: 0.4, lid: -0.1, gx: 0.4 }, hands: "chest" };
ACTST.b_ano = { h: [0.0, 0.0, 0.05], u: [0, 0.22], f: { brow: 0.7, smile: 0.05, gx: 0.4 }, hands: "rest" };
KW.buloy = (t, P) => {                                                                          // small head moves added after the eyeline
  const nod = (a, b, n) => { const u = (t - a) / (b - a); return u > 0 && u < 1 ? Math.sin(u * Math.PI * n) ** 2 : 0; };
  P.hx += 0.14 * nod(L13("b_online").s + 0.5, L13("b_online").s + 1.6, 2);                       // a nod at the screen
  P.hx += 0.06 * nod(L13("b_ask").s + 0.1, L13("b_ask").s + 0.7, 1);
  P.look = Math.max(win(L13("b_online"), t, 0.1, 0.12), win(L13("b_broke"), t, 0.1, 0.12));      // he looks at the screen, turning there and back smoothly
};

// ---------- Claude ----------
KW.claude = (t, S) => {
  const E = (n, pi = 0.12, po = 0.2) => win(L13(n), t, pi, po);
  S.tilt += 0.09 * E("c_define") * Math.sin(smooth((t - L13("c_define").s) / 0.5) * Math.PI * 0.5 + 0.2);
  const bump = (a, b) => { const u = (t - a) / (b - a); return u > 0 && u < 1 ? Math.abs(Math.sin(u * Math.PI * 2)) * Math.sin(u * Math.PI) : 0; };
  S.hop += 0.035 * bump(L13("c_tama").s, L13("c_tama").s + 0.5);                                // a small hop on "Tama!"
  S.hop += 0.03 * bump(T_GOODS - 0.1, T_GOODS + 0.4);                                           // a bounce on "Goods"
  const point = Math.max(E("c_search"), E("c_fixed"));                                          // a nub out toward the screen
  S.nubL = [0.1 * point, 0.09 * point, 0.14 * point];
  S.yaw += CSCREEN * point;                                                                      // and he turns to it, and back
  S.lean += 0.1 * Math.max(E("c_nobody"), E("c_impostor"));                                     // he leans toward Buloy, soft
  S.yaw += 0.3 * E("c_admit");                                                                  // a little turned away
  S.lean += 0.12 * E("c_forloop"); S.tilt += 0.05 * E("c_forloop");                              // sheepish: a small dip forward
};

// ---------- frame 0: his face is the brightest thing in the hook ----------
// The laptop's deck, the mug and the desk catch the screen's light and the bloom hazes the lower third: both are turned down in the hook shot only.
{ const upd = SET.update.bind(SET), B0 = { s: bloom.strength, t: bloom.threshold };
  SET.update = (t, ctx) => { upd(t, ctx); const hook = ctx.shot === "hook"; if (hook) screenL.intensity *= 0.6; bloom.strength = hook ? 0.1 : B0.s; bloom.threshold = hook ? 1.7 : B0.t; }; }
