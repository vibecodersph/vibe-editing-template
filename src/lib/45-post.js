// ---------- the finish: ink edges, glow from anything brighter than white, a grade, an ordered dither ----------
const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);
composer.setSize(W, H);
const ink = new RenderPixelatedPass(1, scene, camera, { normalEdgeStrength: 0.2, depthEdgeStrength: 0.36 });
composer.addPass(ink);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.12);
composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uExposure: { value: 1.0 }, uSat: { value: 1.12 }, uLevels: { value: 40 }, uFade: { value: 0 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uExposure, uSat, uLevels, uFade; varying vec2 vUv;
    vec3 toSRGB(vec3 c){ c = clamp(c, 0.0, 1.0); return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
    float bayer(vec2 p){
      const float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
      return (m[int(mod(p.x,4.0)) + int(mod(p.y,4.0))*4] + 0.5) / 16.0;
    }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb * uExposure;
      float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c *= (1.0 + L / 9.0) / (1.0 + L);                               // roll the highlights off, keep the hue
      L = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(L), c, uSat);
      vec3 s = toSRGB(c);
      s = mix(s, s*s*(3.0-2.0*s), 0.32);                               // a gentle S-curve
      float l2 = dot(s, vec3(0.299, 0.587, 0.114));
      s += vec3(0.012, 0.0, 0.045) * (1.0 - l2) + vec3(0.03, 0.012, -0.012) * l2;   // violet in the shadows, warmth on top
      vec2 q = (vUv - 0.5) * vec2(0.82, 1.0);
      s *= 1.0 - 0.34 * pow(length(q) * 1.42, 2.6);                    // hold the eye in the middle
      s = mix(s, vec3(0.045, 0.035, 0.09), uFade);
      s = floor(s * uLevels + bayer(gl_FragCoord.xy)) / uLevels;       // a limited palette, dithered like a sprite
      gl_FragColor = vec4(s, 1.0);
    }`,
});
composer.addPass(grade);
