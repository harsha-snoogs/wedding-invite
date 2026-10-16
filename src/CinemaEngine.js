/**
 * CinemaEngine - WebGL compositor for the scroll film.
 *
 * Draws up to two photo layers per frame (a full-screen base plus a soft-edged inset that
 * the camera zooms through), with radial motion blur, a gentle film grade,
 * vignette and grain. Falls back to plain 2D canvas drawing if WebGL is unavailable.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform vec4 u_rect0;
uniform vec4 u_rect1;
uniform vec4 u_lay1;      // alpha, unused, edge-extension weight, enabled
uniform vec2 u_feather1;  // feather width in layer UVs
uniform vec4 u_tone0;     // rgb gain, saturation
uniform vec4 u_tone1;
uniform vec3 u_blur;      // centre (screen uv), strength
uniform float u_vignette;
uniform float u_seed;
uniform float u_lod;      // 1.0 when mipmaps exist

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 tone(vec3 c, vec4 t) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, t.a) * t.rgb;
}

// Inside the photo: a normal sample. Outside it (wide screens with tall photos): a mirrored,
// heavily blurred continuation, warmed towards sandalwood rather than darkened to black.
vec3 photo(sampler2D tex, vec2 uv) {
  vec2 o = max(-uv, uv - 1.0);
  float d = max(max(o.x, o.y), 0.0);
  float outside = step(1e-5, d);
  vec2 m = 1.0 - abs(1.0 - mod(uv, 2.0));
  // The mirror continues the picture exactly at the edge, so ramp blur and shade in from
  // zero there - no visible boundary.
  float bias = u_lod * outside * mix(1.0, 7.5, smoothstep(0.0, 0.045, d));
  vec3 c = texture2D(tex, m, bias).rgb;
  vec3 warm = mix(c * vec3(0.95, 0.85, 0.74), vec3(0.93, 0.85, 0.7), 0.25);
  return mix(c, warm, smoothstep(0.0, 0.22, d) * outside);
}

vec3 composite(vec2 suv) {
  vec3 c = tone(photo(u_tex0, (suv - u_rect0.xy) / u_rect0.zw), u_tone0);
  if (u_lay1.w > 0.5) {
    vec2 uv = (suv - u_rect1.xy) / u_rect1.zw;
    vec2 e = smoothstep(vec2(0.0), u_feather1, uv) * smoothstep(vec2(0.0), u_feather1, 1.0 - uv);
    float a = u_lay1.x * mix(e.x * e.y, 1.0, u_lay1.z);
    c = mix(c, tone(photo(u_tex1, uv), u_tone1), a);
  }
  return c;
}

void main() {
  vec2 suv = v_uv;
  float n = hash(gl_FragCoord.xy + u_seed);
  vec3 col;
  if (u_blur.z > 0.0005) {
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 10; i++) {
      float k = (float(i) + n) / 10.0;
      acc += composite(u_blur.xy + (suv - u_blur.xy) * (1.0 - u_blur.z * k));
    }
    col = acc / 10.0;
  } else {
    col = composite(suv);
  }

  // Shared grade so every photo feels like part of one film.
  col = clamp(col, 0.0, 1.0);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.14);
  col += vec3(0.014, 0.007, 0.0) * (1.0 - col);

  // Vignette shades the corners towards a warm red-brown, never to black.
  float vd = length((suv - 0.5) * 2.0);
  col = mix(col, col * vec3(0.74, 0.52, 0.44), u_vignette * smoothstep(0.45, 1.45, vd));
  col += (n - 0.5) * 0.03;

  gl_FragColor = vec4(col, 1.0);
}`;

export class CinemaEngine {
  constructor(canvas, { preserveDrawingBuffer = false } = {}) {
    this.canvas = canvas;
    this.images = [];
    this.textures = [];
    this.W = 1;
    this.H = 1;
    this.scale = 1;

    const attrs = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance', preserveDrawingBuffer };
    this.gl = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs);
    this.isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && this.gl instanceof WebGL2RenderingContext;

    if (this.gl) {
      this.initGL();
      canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
      canvas.addEventListener('webglcontextrestored', () => {
        this.textures = [];
        this.initGL();
        this.images.forEach((img, i) => img && this.upload(i, img));
        this.onRestore?.();
      });
    } else {
      this.ctx = canvas.getContext('2d');
    }

    this.resize();
  }

  initGL() {
    const gl = this.gl;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    this.prog = prog;

    // One oversized triangle covers the screen.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {};
    ['u_tex0', 'u_tex1', 'u_rect0', 'u_rect1', 'u_lay1', 'u_feather1', 'u_tone0', 'u_tone1',
      'u_blur', 'u_vignette', 'u_seed', 'u_lod'].forEach((n) => {
      this.u[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform1i(this.u.u_tex0, 0);
    gl.uniform1i(this.u.u_tex1, 1);
    gl.uniform1f(this.u.u_lod, this.isWebGL2 ? 1 : 0);
  }

  /** Hand a decoded image to the engine; uploads it to the GPU straight away. */
  addFrame(i, img) {
    this.images[i] = img;
    if (this.gl) this.upload(i, img);
  }

  upload(i, img) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (this.isWebGL2) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    this.textures[i] = tex;
  }

  hasFrame(i) {
    return !!this.images[i];
  }

  /** Match the drawing buffer to the canvas' CSS size. Returns true if it changed. */
  resize() {
    const W = this.canvas.clientWidth || window.innerWidth;
    const H = this.canvas.clientHeight || window.innerHeight;
    // The photos are ~1400px, so there's nothing to gain past ~2.4MP, and the blur pass
    // gets expensive.
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.4e6 / (W * H)));
    const bw = Math.round(W * dpr);
    const bh = Math.round(H * dpr);
    const changed = bw !== this.canvas.width || bh !== this.canvas.height || W !== this.W || H !== this.H;
    this.W = W;
    this.H = H;
    this.scale = dpr;
    if (changed) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    return changed;
  }

  render(state, blur) {
    if (!this.gl) return this.render2d(state);
    const gl = this.gl;
    const u = this.u;
    const { W, H } = this;
    const [L0, L1] = state.layers;
    if (!this.textures[L0.frame]) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[L0.frame]);
    gl.uniform4f(u.u_rect0, L0.rect.x / W, L0.rect.y / H, L0.rect.w / W, L0.rect.h / H);
    gl.uniform4fv(u.u_tone0, L0.tone);

    const top = L1 && this.textures[L1.frame] && L1.alpha > 0.001;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[top ? L1.frame : L0.frame]);
    if (top) {
      const r = L1.rect;
      const px = Math.min(r.w, r.h) * L1.feather;
      gl.uniform4f(u.u_rect1, r.x / W, r.y / H, r.w / W, r.h / H);
      gl.uniform4f(u.u_lay1, L1.alpha, 0, L1.ext, 1);
      gl.uniform2f(u.u_feather1, Math.max(px / r.w, 1e-4), Math.max(px / r.h, 1e-4));
      gl.uniform4fv(u.u_tone1, L1.tone);
    } else {
      gl.uniform4f(u.u_lay1, 0, 0, 0, 0);
    }

    const [bx, by] = state.blurCenter;
    const cx = Math.min(1.6, Math.max(-0.6, bx / W));
    const cy = Math.min(1.6, Math.max(-0.6, by / H));
    gl.uniform3f(u.u_blur, cx, cy, blur);
    gl.uniform1f(u.u_vignette, state.vignette);
    gl.uniform1f(u.u_seed, (performance.now() % 1000) * 0.13);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  render2d(state) {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = this.scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#3e0d16';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    state.layers.forEach((l, idx) => {
      const img = this.images[l.frame];
      if (!img) return;
      ctx.globalAlpha = idx === 0 ? 1 : l.alpha;
      ctx.drawImage(img, l.rect.x * s, l.rect.y * s, l.rect.w * s, l.rect.h * s);
    });
    ctx.globalAlpha = 1;
  }
}
