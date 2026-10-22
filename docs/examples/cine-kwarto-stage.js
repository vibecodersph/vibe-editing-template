// stage.js of the cine test: joined right after src/sets/kwarto.js. The set poses Buloy and Claude itself, so the cinematographer is told how to treat it.
//   pose: "after"  the eyelines (Buloy's head and eyes) and Claude's eye shapes are applied after the set's own acting, blended in at 0.85
//   look           the shot's key (warm, from the screen side), rim (cool, behind) and the fog that lets the room fall away behind the faces
//   objects        what insert: and duo: may name besides a prop with a screen: its centre c, front normal n, size w x h and corner points
SET.cine = {
  pose: "after",
  look: { fog: "#070b1a", key: "#ffb070", keyI: 0.6, rim: "#6c8cff", rimI: 0.8, fogFar: 1.8 },
  objects: {
    bookopen: () => {                                       // the open book: its pages face its own +z
      obook.g.updateWorldMatrix(true, true);
      const pts = []; for (const x of [-OB.W, OB.W]) for (const y of [-OB.H / 2, OB.H / 2]) pts.push(obook.g.localToWorld(v3(x, y, 0)));
      return { c: obook.g.localToWorld(v3(0, 0, 0)), n: v3(0, 0, 1).transformDirection(obook.g.matrixWorld), w: OB.W * 2, h: OB.H, pts, prop: obook };
    },
  },
};
// Claude turns to the other principal: the set sets his yaw with C.rotation.set(0, cy, 0) right after it has moved him, so ask CINE.facing for the yaw it is about to set
const TURN = 1.0; // facing weight
{ const rs = C.rotation.set.bind(C.rotation); C.rotation.set = (x, y, z) => rs(x, CINE.facing("claude", y, TURN), z); }
// a close camera sits a hand from the candle: in the grammar shots the candle's light is turned down and the set's warm face helper is off, the cinematographer's key does that job
{ const upd = SET.update.bind(SET); SET.update = (t, ctx) => { upd(t, ctx); if (!SHOTS[ctx.shot]) { candleL.intensity *= 0.45; bulL.intensity = 0; } }; }
// Claude now faces Buloy all the time, so two things the set staged for a Claude who looked at the lens move a little: his folding fan lies at his right hand (he reaches it with
// his right nub), and when he leans to the page he stands a hand further from the laptop that opens beside him
FAN_REST.p.set(0.52, DESK_Y + 0.0078, 0.16); C_HOME.set(0.40, DESK_Y, 0.40); C_LEAN.set(0.45, DESK_Y, 0.56);
