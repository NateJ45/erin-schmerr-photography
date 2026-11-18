// Safe to edit by hand
// The film-burn between frames of the story film (src/scripts/story-film.ts;
// picked 2026-11-18, design-directions "direction I", G's shader). Plain
// WebGL 1, no library: one full-screen quad and one fragment shader that draws
// two frames the way the page draws them (the photo shown whole or filling
// the frame, over its own blurred LQIP) and burns the first print into the
// second along a noise edge with a warm glow.
//
// It needs to READ the photographs, which WebGL may only do with CORS. The
// Sanity image CDN answers with CORS only for the project's listed origins
// (localhost:4321 and the workers.dev address today; the real domain joins at
// cutover). Anywhere else the texture load fails, `ready()` stays false, and the
// player falls back to its CSS crossfade and focus pull without a word. The
// texture URL has its own width (BURN_WIDTH in the page) so it never shares a
// cache entry with the page's non-CORS <img> of the same photo.
//
// Costs are kept small: the canvas is drawn only while a burn runs (1.6s),
// its pixel ratio is capped at 1.5, only the frames around the current one
// keep a texture, and a hidden tab stops the requestAnimationFrame loop by
// itself (the burn then finishes on return).

export interface BurnFrame {
  /** CORS-loadable photo URL, or empty for a frame with no photo. */
  src: string;
  /** The photo's LQIP data URI (same-origin, so it never needs CORS). */
  lqip: string;
  /** Width over height. */
  ratio: number;
  /** object-position of the photo when it fills the frame (0..1), from the hotspot. */
  x: number;
  y: number;
}

export interface BurnOptions {
  /** The outgoing photo's current push-in scale, so the burn starts where the frame is. */
  zoomA: number;
  /** Whether each photo is shown whole (contain) at this frame shape. */
  containA: boolean;
  containB: boolean;
  /** Milliseconds; the picked design runs 1600. */
  duration: number;
}

export interface FilmBurn {
  /** Start loading frame i's textures (no-op once loaded, failed or without a photo). */
  load(i: number): void;
  /** Both frames have their textures and the context is alive. */
  ready(a: number, b: number): boolean;
  /** Burns frame a into frame b. Resolves when b is fully shown on the canvas. */
  run(a: number, b: number, opts: BurnOptions): Promise<void>;
  /** Hide the canvas again (after the page has swapped the real frames underneath). */
  clear(): void;
  /** Drop textures for frames other than these. */
  keep(indexes: number[]): void;
  destroy(): void;
}

const VERT = `attribute vec2 p;varying vec2 v;
void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}`;

// v: 0..1 across the canvas, y down. pa/pb: (ratio, contain 1 or cover 0, object-position x, y).
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;
uniform sampler2D a,b,la,lb;
uniform float t,rs,za;
uniform vec4 pa,pb;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fb(vec2 p){float s=0.,m=.5;for(int i=0;i<4;i++){s+=m*n(p);p*=2.;m*=.5;}return s;}
vec3 bleed(sampler2D l,float ri){
  vec2 k=rs>ri?vec2(1.,ri/rs):vec2(rs/ri,1.);
  vec2 u=(v-.5)*k/1.2+.5;vec3 c=vec3(0.);
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)c+=texture2D(l,u+vec2(float(x),float(y))*.04).rgb;
  return c/9.;}
vec3 frame(sampler2D s,sampler2D l,vec4 p,float z){
  float ri=p.x;bool contain=p.y>.5;
  vec2 k=(contain==(rs>ri))?vec2(rs/ri,1.):vec2(1.,ri/rs);
  vec2 pos=contain?vec2(.5):p.zw;
  vec2 u=((v-.5)/z+.5)*k+(1.-k)*pos;
  if(u.x<0.||u.x>1.||u.y<0.||u.y>1.)return bleed(l,ri);
  return texture2D(s,u).rgb;}
void main(){
  vec3 A=frame(a,la,pa,za),B=frame(b,lb,pb,1.);
  float g=fb(v*vec2(rs,1.)*3.)*.75+(1.-v.y)*.25;
  float e=t*1.3-.15;
  float m=smoothstep(e-.08,e,g);
  float edge=smoothstep(e-.08,e-.02,g)*(1.-smoothstep(e-.02,e+.03,g));
  vec3 col=mix(B,A,m)*(1.-edge*.25);
  gl_FragColor=vec4(col+vec3(1.,.55,.2)*edge*1.2,1.);}`;

interface Tex {
  photo: WebGLTexture;
  lqip: WebGLTexture;
}

/** Returns null where WebGL is unavailable; the player then never asks for a burn. */
export function createFilmBurn(canvas: HTMLCanvasElement, frames: BurnFrame[]): FilmBurn | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const g = gl;

  const shader = (kind: number, src: string) => {
    const s = g.createShader(kind);
    if (!s) return null;
    g.shaderSource(s, src);
    g.compileShader(s);
    return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null;
  };
  const vs = shader(g.VERTEX_SHADER, VERT);
  const fs = shader(g.FRAGMENT_SHADER, FRAG);
  const prog = g.createProgram();
  if (!vs || !fs || !prog) return null;
  g.attachShader(prog, vs);
  g.attachShader(prog, fs);
  g.linkProgram(prog);
  if (!g.getProgramParameter(prog, g.LINK_STATUS)) return null;
  g.useProgram(prog);

  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const loc = g.getAttribLocation(prog, 'p');
  g.enableVertexAttribArray(loc);
  g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
  const U = (k: string) => g.getUniformLocation(prog, k);
  const uT = U('t');
  const uRs = U('rs');
  const uZa = U('za');
  const uPa = U('pa');
  const uPb = U('pb');
  g.uniform1i(U('a'), 0);
  g.uniform1i(U('b'), 1);
  g.uniform1i(U('la'), 2);
  g.uniform1i(U('lb'), 3);

  let lost = false;
  // Once one photo fails CORS they all will on this origin: stop downloading them.
  let corsBroken = false;
  const textures = new Map<number, Tex>();
  const pending = new Set<number>();
  let raf = 0;

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    textures.clear();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const upload = (img: TexImageSource): WebGLTexture | null => {
    const tx = g.createTexture();
    if (!tx) return null;
    g.bindTexture(g.TEXTURE_2D, tx);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    try {
      // Throws a SecurityError for a cross-origin image without CORS.
      g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, img);
    } catch {
      g.deleteTexture(tx);
      return null;
    }
    return tx;
  };

  const fetchImage = (src: string, cors: boolean) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      if (cors) im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('image failed'));
      im.src = src;
    });

  const load = (i: number) => {
    const f = frames[i];
    if (lost || corsBroken || !f?.src || !f.lqip || textures.has(i) || pending.has(i)) return;
    pending.add(i);
    Promise.all([fetchImage(f.src, true), fetchImage(f.lqip, false)])
      .then(([photo, lqip]) => {
        if (lost) return;
        const p = upload(photo);
        const l = upload(lqip);
        if (!p || !l) {
          corsBroken = true;
          return;
        }
        textures.set(i, { photo: p, lqip: l });
      })
      .catch(() => {
        // A refused CORS request reads as a plain image error.
        corsBroken = true;
      })
      .finally(() => pending.delete(i));
  };

  const resize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 1.5);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * d));
    canvas.height = Math.max(1, Math.round(r.height * d));
    g.viewport(0, 0, canvas.width, canvas.height);
  };

  const bind = (unit: number, tx: WebGLTexture) => {
    g.activeTexture(g.TEXTURE0 + unit);
    g.bindTexture(g.TEXTURE_2D, tx);
  };

  return {
    load,
    ready: (a, b) => !lost && textures.has(a) && textures.has(b),
    run(a, b, opts) {
      const ta = textures.get(a);
      const tb = textures.get(b);
      if (!ta || !tb || lost) return Promise.resolve();
      resize();
      const fa = frames[a];
      const fb = frames[b];
      bind(0, ta.photo);
      bind(1, tb.photo);
      bind(2, ta.lqip);
      bind(3, tb.lqip);
      g.uniform1f(uRs, canvas.width / canvas.height);
      g.uniform1f(uZa, opts.zoomA || 1);
      g.uniform4f(uPa, fa.ratio, opts.containA ? 1 : 0, fa.x, fa.y);
      g.uniform4f(uPb, fb.ratio, opts.containB ? 1 : 0, fb.x, fb.y);
      g.uniform1f(uT, 0);
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      canvas.classList.add('is-burning');
      return new Promise<void>((resolve) => {
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / opts.duration);
          g.uniform1f(uT, p);
          g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
          if (p < 1 && !lost) raf = requestAnimationFrame(step);
          else resolve();
        };
        raf = requestAnimationFrame(step);
      });
    },
    clear() {
      canvas.classList.remove('is-burning');
    },
    keep(indexes) {
      for (const [i, tx] of textures) {
        if (indexes.includes(i)) continue;
        g.deleteTexture(tx.photo);
        g.deleteTexture(tx.lqip);
        textures.delete(i);
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      for (const tx of textures.values()) {
        g.deleteTexture(tx.photo);
        g.deleteTexture(tx.lqip);
      }
      textures.clear();
    },
  };
}
