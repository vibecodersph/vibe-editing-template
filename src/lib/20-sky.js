// ---------- the sky: the last ten minutes of light over a barangay ----------
const SUN = new THREE.Vector3(-0.5, 0.07, -1).normalize();
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(500, 40, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sun: { value: SUN }, night: { value: 0 } },
    vertexShader: "varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      varying vec3 d; uniform vec3 sun; uniform float night;
      void main(){
        vec3 n = normalize(d);
        float h = clamp(n.y, -0.05, 1.0);
        float az = max(dot(normalize(n.xz), normalize(sun.xz)), 0.0);
        float toSun = pow(az, 1.4);
        // colours are linear light; the grade pass turns them into what the eye sees
        vec3 ember  = mix(vec3(0.30,0.10,0.30), vec3(1.25,0.36,0.06), toSun);
        vec3 rose   = mix(vec3(0.20,0.08,0.36), vec3(0.95,0.13,0.30), toSun);
        vec3 violet = mix(vec3(0.07,0.05,0.28), vec3(0.34,0.09,0.44), toSun * 0.85);
        vec3 indigo = vec3(0.022,0.026,0.15);
        vec3 c = mix(ember, rose, smoothstep(0.0, 0.14, h));
        c = mix(c, violet, smoothstep(0.10, 0.36, h));
        c = mix(c, indigo, smoothstep(0.30, 0.85, h));
        c += vec3(1.3,0.5,0.12) * pow(max(dot(n, sun), 0.0), 10.0) * 0.55;      // the glow around where the sun went
        c = mix(c, c * vec3(0.30, 0.34, 0.66) + vec3(0.003, 0.005, 0.028), night * 0.85);
        gl_FragColor = vec4(c, 1.0);
      }`,
  }),
);
scene.add(sky);
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(13, 24), mat(0xff9a3c, { glow: 3.2 }));
sunDisc.position.copy(SUN).multiplyScalar(420); sunDisc.lookAt(0, 0, 0); scene.add(sunDisc);
// crescent moon: a bright disc with a sky-coloured bite taken out of it
const moonG = group(scene, 120, 250, 330); moonG.lookAt(0, 0, 0);
mesh(moonG, new THREE.CircleGeometry(9, 20), mat(0xf2ecff, { glow: 1.7 }));
mesh(moonG, new THREE.CircleGeometry(8.2, 20), mat(0x0d1040, { glow: 1 }), 3.6, 1.6, 0.5);

// Clouds: stacked slabs with a flat belly, the belly lit by the sun that has just gone under.
const clouds = group(scene);
{
  const r = rng(7), sunXZ = new THREE.Vector3(SUN.x, 0, SUN.z).normalize();
  for (let i = 0; i < 44; i++) {
    const az = r() * Math.PI * 2, dist = 190 + r() * 150, y = 55 + r() * 120;
    const g = group(clouds, Math.sin(az) * dist, y, Math.cos(az) * dist);
    g.rotation.y = az;
    const lit = Math.pow(Math.max(0, new THREE.Vector3(Math.sin(az), 0, Math.cos(az)).dot(sunXZ)), 1.2);
    const top = new THREE.Color(0x3a2a7a).lerp(new THREE.Color(0xb04a9a), lit);
    const belly = new THREE.Color(0x553a94).lerp(new THREE.Color(0xff7a2a), lit);
    const wide = 30 + r() * 46, k = 1 + lit * 0.5;
    box(g, wide, 4.2, 9, belly.getHex(), 0, 0, 0, { glow: k });
    let x = -wide * 0.3;
    for (let s = 0; s < 3 + Math.floor(r() * 3); s++) {
      const w = wide * (0.22 + r() * 0.3);
      box(g, w, 4 + r() * 5, 9.2, top.getHex(), x + w * 0.3, 3.6 + r() * 2.5, 0, { glow: 0.9 });
      x += w * 0.55;
    }
  }
}
const stars = [];
{
  const r = rng(11);
  for (let i = 0; i < 70; i++) {
    const az = r() * Math.PI * 2, el = 0.42 + r() * 1.0;
    const p = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(470);
    stars.push({ m: box(scene, 1.7, 1.7, 1.7, 0xe6e2ff, p.x, p.y, p.z, { glow: 1.6 }), f: 1.5 + r() * 3, o: r() * 6 });
  }
}
// The far city: towers in haze, a few lit floors, a red light on the tallest.
const beacons = [];
{
  const r = rng(17);
  const winTex = painted(16, 32, (g, w, h) => {
    g.fillStyle = "#2a2058"; g.fillRect(0, 0, w, h);
    for (let y = 2; y < h; y += 3) for (let x = 1; x < w; x += 3) if (r() > 0.62) { g.fillStyle = r() > 0.3 ? "#ffcf7a" : "#9ad0ff"; g.fillRect(x, y, 2, 1); }
  }, { mip: false });
  for (let i = 0; i < 26; i++) {
    const x = -170 + i * 13.5 + r() * 7, hgt = 16 + r() * r() * 70, w = 7 + r() * 9, z = -150 - r() * 60;
    const b = mesh(scene, new THREE.BoxGeometry(w, hgt, w), mat(0xffffff, { map: winTex, glow: 0.62 + r() * 0.2 }), x, hgt / 2 - 2, z, { noShadow: true });
    if (hgt > 52) beacons.push(box(scene, 1.2, 1.2, 1.2, 0xff3a2a, x, hgt - 1, z, { glow: 3 }));
    void b;
  }
}
// Bats leave the trees at dusk. A handful cross the sky as the film opens.
const bats = [];
{
  const r = rng(23), wingG = new THREE.BufferGeometry();
  wingG.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.42, 0.05, -0.1, 0.2, 0, 0.16], 3));
  wingG.computeVertexNormals();
  for (let i = 0; i < 9; i++) {
    const g = group(scene), m = mat(0x140f22, { glow: 1, side: 1 });
    const l = mesh(g, wingG, m), rr = mesh(g, wingG, m); rr.scale.x = -1;
    box(g, 0.08, 0.06, 0.18, 0x140f22, 0, 0, 0.02, { glow: 1 });
    bats.push({ g, l, rr, o: r() * 6, y: 7.5 + r() * 4, z: -3 - r() * 9, sp: 2.2 + r() * 1.2, x0: -16 - r() * 14, f: 9 + r() * 4 });
  }
}
const cloudMats = [];
clouds.traverse((o) => { if (o.isMesh && !cloudMats.some((c) => c[0] === o.material)) cloudMats.push([o.material, o.material.color.clone()]); });
function skyAt(t, night = 0) {
  sky.material.uniforms.night.value = night;
  for (const c of cloudMats) c[0].color.copy(c[1]).multiplyScalar(1 - 0.7 * night);
  clouds.rotation.y = t * 0.0018;
  for (const s of stars) { const k = (0.75 + 0.45 * Math.sin(t * s.f + s.o)) * (0.55 + 0.75 * night); s.m.scale.setScalar(1.7 * k); }
  for (const b of beacons) b.visible = (t % 2.2) < 1.1;
  for (const b of bats) {
    const x = b.x0 + t * b.sp * 1.9;
    b.g.position.set(x, b.y + Math.sin(t * 1.3 + b.o) * 0.5, b.z + Math.sin(t * 0.7 + b.o) * 0.8);
    b.g.rotation.y = Math.PI / 2;
    const flap = Math.sin(t * b.f + b.o) * 0.9;
    b.l.rotation.z = flap; b.rr.rotation.z = -flap;
  }
}
