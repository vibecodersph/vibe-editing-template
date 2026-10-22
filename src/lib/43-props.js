// ---------- episode 2 props: the headline phone, Aling Nena's phone, the utang notebook ----------
// Each one starts hidden and is shown, placed and animated from renderAt in 50-direct.js, so episode 1 is untouched.
// Their text is set in the store's own pixel type (the label atlas font, upper case only), drawn once and composed per frame.

const PTX = ATLAS && ATLAS.ptext ? ATLAS.ptext : null;
function pxCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; return { c, g }; }
function pxTex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; }
function phoneBody(parent, w, h, d, screenTex, boost) {
  const g = group(parent);
  mesh(g, new RoundedBoxGeometry(w, h, d, 2, d * 0.45), mat(0x16151b, R));
  const s = plane(g, w - 0.007, h - 0.007, new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(boost, boost, boost) }), 0, 0, d / 2 + 0.0006);
  return { g, screen: s };
}

// (a) the headline phone in Buloy's hand: red and white pixel type on two lines, held landscape so both lines read
const headScr = pxCanvas(440, 240);
{
  const g = headScr.g;
  g.fillStyle = "#d62020"; g.fillRect(0, 0, 440, 130);                                  // line one: big white on red
  g.fillStyle = "#8a1414"; g.fillRect(0, 126, 440, 5);
  g.fillStyle = "#0e0709"; g.fillRect(0, 131, 440, 109);                                  // line two: white on near black, the red kept for the frame
  g.fillStyle = "#d62020"; g.fillRect(0, 232, 440, 8);
  if (PTX) {
    PTX(g, "TRABAHO MO,", 220, 46, "#ffffff", { font: 5, scale: 6, align: "center", shadow: "#5a0c0c", sd: 3 });
    PTX(g, "MAPAPALITAN NA", 220, 146, "#ffffff", { font: 5, scale: 4, align: "center" });
    PTX(g, "BA NG AI?", 220, 184, "#ffffff", { font: 5, scale: 4, align: "center" });
  }
}
const headTex = pxTex(headScr.c);
const headPhone = phoneBody(scene, 0.34, 0.185, 0.012, headTex, 1.25).g;
headPhone.visible = false;

// (b) Aling Nena's phone: a chat with Jonalyn; her message is already sent, the reply pops in
const chatBase = pxCanvas(108, 192), chatScr = chatBase;
function wrapPx(text, maxW) {
  const wd = (s) => PTX(chatBase.g, s, 0, 0, "#000", { font: 5, dry: true }).w, out = []; let cur = "";
  for (const w of text.split(" ")) { const t = cur ? cur + " " + w : w; if (cur && wd(t) > maxW) { out.push(cur); cur = w; } else cur = t; }
  out.push(cur); return out.join("\n");
}
function bubblePx(text, fg, bg, maxW) {
  const wrapped = wrapPx(text, maxW), m = PTX(chatBase.g, wrapped, 0, 0, "#000", { font: 5, dry: true });
  const b = pxCanvas(m.w + 9, m.h + 9), g = b.g;
  g.fillStyle = bg; g.fillRect(1, 0, b.c.width - 2, b.c.height); g.fillRect(0, 1, b.c.width, b.c.height - 2);
  PTX(g, wrapped, 4, 4, fg, { font: 5 });
  return b;
}
const bubSent = PTX ? bubblePx("PUNTA KA DITO BUKAS. TITINGNAN NI BULOY ANG RESUME MO.", "#08240f", "#4ad06f", 80) : null;
const bubGot = PTX ? bubblePx("OPO TITA, PUNTA PO AKO BUKAS.", "#2a2a33", "#f6f3ec", 76) : null;
const chatTex = pxTex(chatScr.c);
function drawChat(tp) {                                                      // tp: seconds since the phone shot began
  const g = chatScr.g;
  g.fillStyle = "#d9d2c6"; g.fillRect(0, 0, 108, 192);
  g.fillStyle = "#23283d"; g.fillRect(0, 0, 108, 26);
  g.fillStyle = "#e9c46a"; g.beginPath(); g.arc(14, 15, 6, 0, 7); g.fill(); g.fillStyle = "#7a4a2c"; g.fillRect(11, 12, 6, 2);
  g.fillStyle = "#ffffff"; g.fillRect(3, 14, 2, 1); g.fillRect(4, 13, 1, 3);
  if (PTX) PTX(g, "JONALYN", 26, 11, "#ffffff", { font: 5 });
  g.fillStyle = "#3df06b"; g.fillRect(26, 21, 2, 2);
  if (PTX) PTX(g, "ONLINE", 31, 20, "#8fd1a0", { font: 3 });
  if (bubSent) g.drawImage(bubSent.c, 108 - 4 - bubSent.c.width, 34);
  const y2 = 34 + (bubSent ? bubSent.c.height : 0) + 8;
  if (tp > 0.35 && tp < 0.9) {                                               // she is typing
    g.fillStyle = "#f6f3ec"; g.fillRect(5, y2, 22, 11);
    for (let k = 0; k < 3; k++) { g.fillStyle = (Math.floor(tp * 6) % 3 === k) ? "#4a4a55" : "#a9a6a0"; g.fillRect(9 + k * 6, y2 + 4, 3, 3); }
  }
  if (tp >= 0.9 && bubGot) {
    const u = clamp01((tp - 0.9) / 0.2), s = u < 1 ? 0.4 + 0.75 * Math.sin(u * Math.PI * 0.55) : 1;   // a little pop
    g.save(); g.translate(5, y2 + bubGot.c.height); g.scale(s, s); g.drawImage(bubGot.c, 0, -bubGot.c.height); g.restore();
  }
  g.fillStyle = "#f6f3ec"; g.fillRect(0, 176, 108, 16); g.fillStyle = "#c9c3b8"; g.fillRect(6, 180, 78, 8);
  chatTex.needsUpdate = true;
}
drawChat(0);
const nenaPhone = phoneBody(scene, 0.078, 0.14, 0.009, chatTex, 1.15).g;
nenaPhone.visible = false;

// (c) the utang notebook, open on the counter: ruled pages, BULOY on every row in hand-set pixel type, no numbers
function pageTex(head) {
  const p = pxCanvas(80, 112), g = p.g;
  g.fillStyle = "#f3ecd6"; g.fillRect(0, 0, 80, 112);
  g.fillStyle = "#c8281e"; g.fillRect(9, 0, 1, 112);
  for (let y = 26; y < 108; y += 8) { g.fillStyle = "#9db4d8"; g.fillRect(0, y + 6, 80, 1); }
  if (PTX) {
    if (head) PTX(g, "UTANG", 46, 8, "#c8281e", { font: 5, scale: 2, align: "center", wob: 1 });
    for (let y = 26; y < 108; y += 8) PTX(g, "BULOY", 14, y, "#1d2f78", { font: 5, wob: 1 });
  }
  return pxTex(p.c);
}
const bookRight = pageTex(true), bookLeft = pageTex(false);
const utangBook = group(scene, -0.14, 1.04, -1.6);
box(utangBook, 0.17, 0.012, 0.23, 0x2a3f7a, 0.085, 0.006, 0, { noShadow: true });
box(utangBook, 0.15, 0.01, 0.21, 0xe8e0c8, 0.085, 0.017, 0, { noShadow: true });
plane(utangBook, 0.15, 0.21, new THREE.MeshBasicMaterial({ map: bookRight, color: new THREE.Color(1.08, 1.08, 1.08) }), 0.085, 0.0225, 0).rotation.x = -Math.PI / 2;
const bookLeftPage = group(utangBook);
box(bookLeftPage, 0.15, 0.01, 0.21, 0xe8e0c8, -0.085, 0.017, 0, { noShadow: true });
plane(bookLeftPage, 0.15, 0.21, new THREE.MeshBasicMaterial({ map: bookLeft, color: new THREE.Color(1.08, 1.08, 1.08) }), -0.085, 0.0225, 0).rotation.x = -Math.PI / 2;
const bookCoverPivot = group(utangBook, 0, 0.016, 0);
box(bookCoverPivot, 0.17, 0.012, 0.23, 0x2a3f7a, 0.085, 0.012, 0, { noShadow: true });
box(bookCoverPivot, 0.015, 0.014, 0.23, 0xf2c230, 0.01, 0.012, 0, { noShadow: true });                  // a yellow spine tape
utangBook.visible = false;
