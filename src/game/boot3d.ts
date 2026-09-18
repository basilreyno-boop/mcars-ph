/**
 * Instant 3D boot: procedural WebGL showroom, Boss John on the dais,
 * Fidelity Security orbiting like a terracotta army, enemies held outside
 * the ring. No extra deps — paints on first frame.
 */

type Mesh = { buf: WebGLBuffer; nrm: WebGLBuffer; count: number };

const VS = `attribute vec3 aP;attribute vec3 aN;uniform mat4 uM;uniform mat4 uV;uniform mat4 uP;uniform mat3 uN;varying vec3 vN;varying vec3 vW;
void main(){vec4 w=uM*vec4(aP,1.0);vW=w.xyz;vN=uN*aN;gl_Position=uP*uV*w;}`;

const FS = `precision mediump float;varying vec3 vN;varying vec3 vW;uniform vec3 uC;uniform vec3 uL;uniform vec3 uEye;uniform vec3 uFog;uniform float uGlow;
void main(){vec3 n=normalize(vN);float ndl=max(0.16,dot(n,normalize(uL)));float rim=pow(1.0-max(0.0,dot(n,normalize(uEye-vW))),2.4);
vec3 col=uC*(0.22+ndl*0.9)+vec3(0.88,0.12,0.05)*rim*(0.5+uGlow)+vec3(0.95,0.76,0.28)*uGlow*0.35;
float f=clamp(length(vW.xz)/15.5,0.0,1.0);gl_FragColor=vec4(mix(col,uFog,f*f),1.0);}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function boxVerts(sx: number, sy: number, sz: number) {
  const x = sx * 0.5, y = sy * 0.5, z = sz * 0.5;
  const faces: number[][] = [
    [x, y, z, -x, y, z, -x, -y, z, -x, -y, z, x, -y, z, x, y, z],
    [x, y, -z, x, -y, -z, -x, -y, -z, -x, -y, -z, -x, y, -z, x, y, -z],
    [x, y, z, x, y, -z, -x, y, -z, -x, y, -z, -x, y, z, x, y, z],
    [x, -y, z, -x, -y, z, -x, -y, -z, -x, -y, -z, x, -y, -z, x, -y, z],
    [x, y, z, x, -y, z, x, -y, -z, x, -y, -z, x, y, -z, x, y, z],
    [-x, y, z, -x, y, -z, -x, -y, -z, -x, -y, -z, -x, -y, z, -x, y, z],
  ];
  const nrms: number[][] = [
    [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0],
  ];
  const p: number[] = [];
  const n: number[] = [];
  for (let i = 0; i < 6; i++) {
    p.push(...faces[i]);
    for (let k = 0; k < 6; k++) n.push(...nrms[i]);
  }
  return { p: new Float32Array(p), n: new Float32Array(n), count: 36 };
}

function ident(): Float32Array {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

function mul(a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      o[i * 4 + j] =
        a[j] * b[i * 4] +
        a[4 + j] * b[i * 4 + 1] +
        a[8 + j] * b[i * 4 + 2] +
        a[12 + j] * b[i * 4 + 3];
    }
  }
  return o;
}

function perspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

function lookAt(ex: number, ey: number, ez: number, cx: number, cy: number, cz: number) {
  let zx = ex - cx, zy = ey - cy, zz = ez - cz;
  let zl = Math.hypot(zx, zy, zz) || 1;
  zx /= zl; zy /= zl; zz /= zl;
  let xx = zz, xy = 0, xz = -zx;
  let xl = Math.hypot(xx, xy, xz) || 1;
  xx /= xl; xy /= xl; xz /= xl;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  const m = ident();
  m[0] = xx; m[1] = yx; m[2] = zx;
  m[4] = xy; m[5] = yy; m[6] = zy;
  m[8] = xz; m[9] = yz; m[10] = zz;
  m[12] = -(xx * ex + xy * ey + xz * ez);
  m[13] = -(yx * ex + yy * ey + yz * ez);
  m[14] = -(zx * ex + zy * ey + zz * ez);
  return m;
}

function translate(tx: number, ty: number, tz: number) {
  const m = ident();
  m[12] = tx; m[13] = ty; m[14] = tz;
  return m;
}

function rotateY(r: number) {
  const m = ident();
  const c = Math.cos(r), s = Math.sin(r);
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
  return m;
}

function scaleM(sx: number, sy: number, sz: number) {
  const m = ident();
  m[0] = sx; m[5] = sy; m[10] = sz;
  return m;
}

function nrmMat(m: Float32Array) {
  return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
}

type Part = {
  x: number; y: number; z: number;
  sx: number; sy: number; sz: number;
  color: [number, number, number];
  ry?: number; glow?: number;
};

const NAVY: [number, number, number] = [0.12, 0.22, 0.46];
const NAVY_D: [number, number, number] = [0.08, 0.14, 0.3];
const TERRA: [number, number, number] = [0.72, 0.38, 0.18];
const GOLD: [number, number, number] = [0.86, 0.66, 0.12];
const SKIN: [number, number, number] = [0.8, 0.58, 0.42];
const RED: [number, number, number] = [0.78, 0.05, 0.04];

function person(kind: "john" | "guard" | "rival" | "repo", x: number, z: number, ry: number): Part[] {
  const tall = kind === "john" ? 1.18 : 1;
  const jacket: [number, number, number] =
    kind === "john" ? [0.07, 0.07, 0.09] :
    kind === "guard" ? NAVY :
    kind === "repo" ? [0.42, 0.08, 0.1] : [0.32, 0.18, 0.1];
  const pants: [number, number, number] = kind === "guard" ? NAVY_D : [0.09, 0.09, 0.11];
  const parts: Part[] = [
    { x, y: 0.28 * tall, z, sx: 0.24, sy: 0.56 * tall, sz: 0.2, color: pants, ry },
    { x, y: 0.8 * tall, z, sx: 0.44, sy: 0.54 * tall, sz: 0.3, color: jacket, ry },
    { x, y: 1.2 * tall, z, sx: 0.3, sy: 0.3, sz: 0.28, color: SKIN, ry },
  ];
  if (kind === "john") {
    parts.push({ x, y: 0.72 * tall, z: z + 0.18, sx: 0.24, sy: 0.06, sz: 0.08, color: GOLD, ry, glow: 1 });
    parts.push({ x, y: 1.38 * tall, z, sx: 0.34, sy: 0.1, sz: 0.34, color: [0.1, 0.1, 0.12], ry });
    parts.push({ x: x + 0.16, y: 1.18 * tall, z: z + 0.12, sx: 0.06, sy: 0.08, sz: 0.04, color: GOLD, ry, glow: 0.6 });
  } else if (kind === "guard") {
    parts.push({ x, y: 1.36 * tall, z, sx: 0.36, sy: 0.12, sz: 0.36, color: NAVY_D, ry });
    parts.push({ x, y: 1.42 * tall, z, sx: 0.38, sy: 0.04, sz: 0.38, color: GOLD, ry, glow: 0.5 });
    parts.push({ x, y: 0.9 * tall, z: z + 0.16, sx: 0.16, sy: 0.08, sz: 0.08, color: GOLD, ry, glow: 1 });
    parts.push({ x: x - 0.28, y: 0.92 * tall, z, sx: 0.16, sy: 0.16, sz: 0.22, color: TERRA, ry });
    parts.push({ x: x + 0.28, y: 0.92 * tall, z, sx: 0.16, sy: 0.16, sz: 0.22, color: TERRA, ry });
    parts.push({ x: x + 0.38, y: 0.7 * tall, z, sx: 0.07, sy: 0.58, sz: 0.07, color: TERRA, ry });
  } else {
    parts.push({ x, y: 1.34 * tall, z, sx: 0.32, sy: 0.08, sz: 0.32, color: jacket, ry });
  }
  return parts;
}

export type BootHandle = { setProgress: (p: number) => void; destroy: () => void };

export function startBoot3D(canvas: HTMLCanvasElement, reduced: boolean): BootHandle | null {
  const raw = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!raw) return null;
  const gl: WebGLRenderingContext = raw;
  const vs = compile(gl, gl.VERTEX_SHADER, VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const aP = gl.getAttribLocation(prog, "aP");
  const aN = gl.getAttribLocation(prog, "aN");
  const uM = gl.getUniformLocation(prog, "uM");
  const uV = gl.getUniformLocation(prog, "uV");
  const uP = gl.getUniformLocation(prog, "uP");
  const uN = gl.getUniformLocation(prog, "uN");
  const uC = gl.getUniformLocation(prog, "uC");
  const uL = gl.getUniformLocation(prog, "uL");
  const uEye = gl.getUniformLocation(prog, "uEye");
  const uFog = gl.getUniformLocation(prog, "uFog");
  const uGlow = gl.getUniformLocation(prog, "uGlow");

  const cube = boxVerts(1, 1, 1);
  const mesh: Mesh = {
    buf: gl.createBuffer()!,
    nrm: gl.createBuffer()!,
    count: cube.count,
  };
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buf);
  gl.bufferData(gl.ARRAY_BUFFER, cube.p, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nrm);
  gl.bufferData(gl.ARRAY_BUFFER, cube.n, gl.STATIC_DRAW);

  const fog: [number, number, number] = [0.045, 0.045, 0.06];
  const staticParts: Part[] = [];
  staticParts.push({ x: 0, y: -0.04, z: 0, sx: 24, sy: 0.08, sz: 24, color: [0.07, 0.07, 0.09] });
  staticParts.push({ x: 0, y: 0.04, z: 0, sx: 3.6, sy: 0.14, sz: 3.6, color: [0.18, 0.16, 0.14], glow: 0.15 });
  staticParts.push({ x: 0, y: 0.08, z: 0, sx: 2.4, sy: 0.06, sz: 2.4, color: GOLD, glow: 0.7 });
  for (let i = -5; i <= 5; i++) {
    staticParts.push({ x: i * 2.05, y: 0.012, z: 0, sx: 0.07, sy: 0.03, sz: 20, color: RED, glow: 0.7 });
    staticParts.push({ x: 0, y: 0.012, z: i * 2.05, sx: 20, sy: 0.03, sz: 0.07, color: RED, glow: 0.32 });
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    staticParts.push({
      x: Math.cos(a) * 7.1,
      y: 0.4,
      z: Math.sin(a) * 7.1,
      sx: 1.55,
      sy: 0.4,
      sz: 0.72,
      color: i % 2 ? [0.11, 0.11, 0.13] : [0.58, 0.07, 0.05],
      ry: -a,
    });
  }
  staticParts.push({ x: 0, y: 2.55, z: -7.0, sx: 6.2, sy: 0.78, sz: 0.2, color: RED, glow: 1 });
  staticParts.push({ x: 0, y: 1.9, z: -7.0, sx: 4.4, sy: 0.16, sz: 0.14, color: GOLD, glow: 0.9 });
  staticParts.push({ x: -6.1, y: 2.2, z: 2.4, sx: 0.14, sy: 4.4, sz: 0.14, color: GOLD, glow: 0.9 });
  staticParts.push({ x: 6.1, y: 2.2, z: 2.4, sx: 0.14, sy: 4.4, sz: 0.14, color: GOLD, glow: 0.9 });
  staticParts.push({ x: 0, y: 3.6, z: 0, sx: 0.18, sy: 0.08, sz: 0.18, color: GOLD, glow: 1 });
  staticParts.push({ x: 0, y: 2.2, z: 0, sx: 0.12, sy: 2.6, sz: 0.12, color: [0.9, 0.82, 0.45], glow: 0.85 });

  const motes = Array.from({ length: reduced ? 10 : 28 }, (_, i) => ({
    a: (i / 28) * Math.PI * 2,
    r: 0.4 + (i % 7) * 0.35,
    s: 0.7 + (i % 5) * 0.15,
    ph: i * 0.37,
  }));

  let progress = 0;
  let raf = 0;
  let alive = true;
  const t0 = performance.now();

  function resize() {
    const dpr = Math.min(1.25, window.devicePixelRatio || 1);
    const w = Math.max(2, canvas.clientWidth);
    const h = Math.max(2, canvas.clientHeight);
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    gl.viewport(0, 0, W, H);
  }

  function drawPart(p: Part) {
    const model = mul(translate(p.x, p.y, p.z), mul(rotateY(p.ry ?? 0), scaleM(p.sx, p.sy, p.sz)));
    gl.uniformMatrix4fv(uM, false, model);
    gl.uniformMatrix3fv(uN, false, nrmMat(model));
    gl.uniform3fv(uC, p.color);
    gl.uniform1f(uGlow, p.glow ?? 0);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }

  function frame(now: number) {
    if (!alive) return;
    const dt = (now - t0) / 1000;
    resize();
    gl.clearColor(fog[0], fog[1], fog[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const aspect = canvas.width / Math.max(1, canvas.height);
    const proj = perspective((40 * Math.PI) / 180, aspect, 0.2, 42);
    const orbit = reduced ? 0.42 : dt * 0.32;
    const dist = 9.6 - progress * 2.1;
    const height = 3.85 - progress * 0.7;
    const ex = Math.sin(orbit) * dist;
    const ez = Math.cos(orbit) * dist;
    const ey = height + (reduced ? 0 : Math.sin(dt * 0.55) * 0.2);
    const view = lookAt(ex, ey, ez, 0, 1.12, 0);

    gl.useProgram(prog);
    gl.uniformMatrix4fv(uP, false, proj);
    gl.uniformMatrix4fv(uV, false, view);
    gl.uniform3f(uL, 0.28, 0.96, 0.22);
    gl.uniform3f(uEye, ex, ey, ez);
    gl.uniform3fv(uFog, fog);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buf);
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nrm);
    gl.enableVertexAttribArray(aN);
    gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);

    for (const p of staticParts) drawPart(p);
    for (const p of person("john", 0, 0, dt * (reduced ? 0 : 0.12))) drawPart(p);

    const guards = 8;
    for (let i = 0; i < guards; i++) {
      const a = (i / guards) * Math.PI * 2 + dt * 0.62;
      const r = 2.28;
      const gx = Math.cos(a) * r;
      const gz = Math.sin(a) * r;
      for (const p of person("guard", gx, gz, -a + Math.PI)) drawPart(p);
    }

    const foes = 6;
    for (let i = 0; i < foes; i++) {
      const a = (i / foes) * Math.PI * 2 - dt * 0.38;
      const r = 4.85;
      const fx = Math.cos(a) * r;
      const fz = Math.sin(a) * r;
      const kind = i % 2 ? "repo" : "rival";
      for (const p of person(kind, fx, fz, -a)) drawPart(p);
    }

    if (!reduced) {
      for (const m of motes) {
        const y = ((dt * m.s + m.ph) % 2.6) + 0.2;
        drawPart({
          x: Math.cos(m.a + dt * 0.2) * m.r,
          y,
          z: Math.sin(m.a + dt * 0.2) * m.r,
          sx: 0.05,
          sy: 0.05,
          sz: 0.05,
          color: GOLD,
          glow: 1,
        });
      }
    }

    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);

  return {
    setProgress: (p: number) => {
      progress = Math.max(0, Math.min(1, p));
    },
    destroy: () => {
      alive = false;
      cancelAnimationFrame(raf);
      gl.deleteBuffer(mesh.buf);
      gl.deleteBuffer(mesh.nrm);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
