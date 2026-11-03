// Recreación 3D de la Catedral Metropolitana de Brasília y generación de fotos 360 desde el modelo.
// Medidas tomadas de la documentación pública (Wikipedia pt): 16 columnas en hiperboloide sobre
// una base de ~60 m, nave 3 m bajo el nivel de la plaza, espejo de agua de 12 m de ancho,
// campanario de 20 m, evangelistas de bronce de 3 m y ángeles de 2,22 / 3,4 / 4,25 m.
//
// Unidades: metros. Y hacia arriba. El "norte" del plano es -Z (el altar está al norte,
// la entrada por el túnel al sur, +Z).
import * as THREE from "three";

export const PLAZA = 3; // nivel de la plaza; el piso de la nave está en 0
const ANILLO_Y = 31; // altura del anillo superior
const ANILLO_R = 5;
const BASE_R = 30; // radio de las columnas a nivel de la plaza
const PUNTA_Y = 40;
const R_VIDRIO = BASE_R;
const R_ESPEJO = 42;

// Perfil de las columnas: lados cóncavos que suben empinados hasta el anillo
// y después se abren en la "corona" de puntas.
export function radio(y) {
  if (y <= ANILLO_Y) {
    const s = Math.max(0, (y - PLAZA) / (ANILLO_Y - PLAZA));
    return ANILLO_R + (BASE_R - ANILLO_R) * (1 - s) ** 1.8;
  }
  return ANILLO_R + 5.5 * ((y - ANILLO_Y) / (PUNTA_Y - ANILLO_Y)) ** 1.5;
}
function dRadio(y) {
  return (radio(y + 0.01) - radio(y - 0.01)) / 0.02;
}

// Generador pseudoaleatorio con semilla, para que la catedral salga igual siempre
function azar(semilla) {
  return () => {
    semilla |= 0;
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lienzo(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function texturaDe(canvas, { repetir = 1, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetir, repetir);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Texturas ----------

// Vitrales de Marianne Peretti: grandes ondas azules, verdes y blancas (y algo de marrón)
// sobre vidrio claro, con la grilla irregular de perfiles metálicos encima.
function texturaVitral() {
  const W = 4096, H = 1024;
  const [c, g] = lienzo(W, H);
  const r = azar(1990);
  g.fillStyle = "#f1f5f9";
  g.fillRect(0, 0, W, H);

  // Manchas suaves de vidrio blanco/celeste para que el fondo no sea plano
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(${200 + r() * 40},${215 + r() * 30},${235 + r() * 20},${0.25 + r() * 0.3})`;
    g.beginPath();
    g.ellipse(r() * W, r() * H, 80 + r() * 260, 30 + r() * 90, r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }

  const colores = ["#0f2f93", "#1d45c2", "#3f74dc", "#2a5bd0", "#137a6c", "#22917c", "#0d266f", "#5f8fe4", "#6b4f33"];
  const onda = (x, n, fase) => Math.sin((2 * Math.PI * n * x) / W + fase);
  for (let b = 0; b < 15; b++) {
    const marron = b === 11; // el marrón aparece poco, como acento
    const color = marron ? colores[8] : colores[Math.floor(r() * 8)];
    const yc = H * (0.12 + r() * 0.8);
    const a1 = H * (0.04 + r() * 0.1), n1 = 1 + Math.floor(r() * 3), p1 = r() * 6.28;
    const a2 = H * r() * 0.03, n2 = 3 + Math.floor(r() * 4), p2 = r() * 6.28;
    const grosor = H * (0.05 + r() * 0.12) * (marron ? 0.35 : 1), n3 = 1 + Math.floor(r() * 3), p3 = r() * 6.28;
    const borde = (x) => yc + a1 * onda(x, n1, p1) + a2 * onda(x, n2, p2);
    const ancho = (x) => Math.max(0, grosor * (onda(x, n3, p3) * 0.9 + 0.35));
    g.fillStyle = color;
    g.globalAlpha = 0.82 + r() * 0.18;
    // Se dibuja por tramos donde el grosor es positivo, así salen formas separadas y orgánicas
    let dentro = false, pts = [];
    const cerrar = () => {
      if (pts.length > 2) {
        g.beginPath();
        pts.forEach(([x], i) => (i ? g.lineTo(x, borde(x)) : g.moveTo(x, borde(x))));
        for (let i = pts.length - 1; i >= 0; i--) g.lineTo(pts[i][0], borde(pts[i][0]) + pts[i][1]);
        g.closePath();
        g.fill();
      }
      pts = [];
    };
    for (let x = 0; x <= W; x += 8) {
      const w = ancho(x);
      if (w > 1) {
        dentro = true;
        pts.push([x, w]);
      } else if (dentro) {
        dentro = false;
        cerrar();
      }
    }
    cerrar();
  }
  g.globalAlpha = 1;

  // Grilla de perfiles metálicos: líneas onduladas en dos direcciones
  g.strokeStyle = "rgba(60,68,78,0.75)";
  g.lineWidth = 2.2;
  const paso = 46;
  for (let k = -H; k < W + H; k += paso) {
    for (const dir of [1, -1]) {
      g.beginPath();
      for (let y = 0; y <= H; y += 16) {
        const x = k + dir * y * 0.55 + 6 * Math.sin(y / 70 + k);
        y ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
  }
  for (let y = 0; y < H; y += paso * 0.9) {
    g.beginPath();
    for (let x = 0; x <= W; x += 32) g.lineTo(x, y + 5 * Math.sin(x / 90));
    g.stroke();
  }
  return texturaDe(c);
}

// Vidrio visto desde afuera: oscuro, con la trama triangular
function texturaVidrioExterior() {
  const W = 2048, H = 512;
  const [c, g] = lienzo(W, H);
  g.fillStyle = "#39414b";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(150,160,172,0.55)";
  g.lineWidth = 2;
  for (let k = -H; k < W + H; k += 32) {
    for (const dir of [1, -1]) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + dir * H * 0.6, H);
      g.stroke();
    }
  }
  return texturaDe(c);
}

// Mármol claro en placas de 1 m (la textura cubre 4 × 4 m)
function texturaMarmol(repetir) {
  const S = 1024;
  const [c, g] = lienzo(S, S);
  const r = azar(500);
  const placa = S / 4;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const v = 212 + r() * 16;
      g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      g.fillRect(i * placa, j * placa, placa, placa);
    }
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(120,118,112,${0.05 + r() * 0.12})`;
    g.lineWidth = 0.6 + r() * 1.6;
    g.beginPath();
    let x = r() * S, y = r() * S;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      const nx = x + (r() - 0.3) * 160, ny = y + (r() - 0.5) * 160;
      g.quadraticCurveTo(x + (r() - 0.5) * 80, y + (r() - 0.5) * 80, nx, ny);
      x = nx;
      y = ny;
    }
    g.stroke();
  }
  g.strokeStyle = "rgba(90,88,84,0.22)";
  g.lineWidth = 2;
  for (let k = 0; k <= S; k += placa) {
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k, S); g.stroke();
    g.beginPath(); g.moveTo(0, k); g.lineTo(S, k); g.stroke();
  }
  return texturaDe(c, { repetir });
}

// Plaza: losas de hormigón con juntas de pasto (la textura cubre 8 × 8 m)
function texturaPlaza() {
  const S = 1024;
  const [c, g] = lienzo(S, S);
  const r = azar(1970);
  const losa = S / 4;
  g.fillStyle = "#6f7d3e";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const v = 172 + r() * 22;
      g.fillStyle = `rgb(${v},${v - 4},${v - 14})`;
      g.fillRect(i * losa + 6, j * losa + 6, losa - 12, losa - 12);
      for (let k = 0; k < 200; k++) {
        g.fillStyle = `rgba(${r() < 0.5 ? 90 : 230},${r() < 0.5 ? 85 : 225},80,0.08)`;
        g.fillRect(i * losa + 6 + r() * (losa - 12), j * losa + 6 + r() * (losa - 12), 3, 3);
      }
    }
  return texturaDe(c);
}

// ---------- Piezas ----------

function geometriaColumna() {
  const N = 110, M = 16;
  const pos = [];
  const idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = PLAZA + t * (PUNTA_Y - PLAZA);
    const r = radio(y), dr = dRadio(y);
    const l = Math.hypot(1, dr);
    const nx = 1 / l, ny = -dr / l; // normal hacia afuera dentro del plano radial
    // Delgada al tocar el suelo y en la punta, ancha a media altura (forma de "bumerán")
    const ancho = 0.25 + 1.75 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.55);
    const prof = 0.25 + 2.5 * Math.pow(Math.sin(Math.PI * t), 0.7);
    for (let j = 0; j < M; j++) {
      const a = (j / M) * Math.PI * 2;
      const u = (Math.cos(a) * prof) / 2;
      const v = (Math.sin(a) * ancho) / 2;
      pos.push(r + nx * u, y + ny * u, v);
    }
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M; j++) {
      const a = i * M + j, b = i * M + ((j + 1) % M), c = (i + 1) * M + j, d = (i + 1) * M + ((j + 1) % M);
      idx.push(a, c, b, b, c, d);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function caja(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function perfilTorno(puntos, escala, segmentos, mat) {
  return new THREE.Mesh(
    new THREE.LatheGeometry(puntos.map(([r, y]) => new THREE.Vector2(r * escala, y * escala)), segmentos),
    mat
  );
}

// Ángel de Ceschiatti, estilizado: túnica larga, cabeza y dos alas hacia atrás
function angel(L, mat) {
  const g = new THREE.Group();
  const cuerpo = perfilTorno(
    [[0, 0], [0.06, 0.01], [0.1, 0.12], [0.115, 0.34], [0.095, 0.55], [0.11, 0.69], [0.095, 0.75], [0.035, 0.8], [0.03, 0.82]],
    L, 20, mat
  );
  cuerpo.scale.z = 0.7;
  g.add(cuerpo);
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.052 * L, 16, 12), mat);
  cabeza.position.y = 0.87 * L;
  g.add(cabeza);
  const forma = new THREE.Shape();
  forma.moveTo(0, 0);
  forma.bezierCurveTo(0.16 * L, 0.06 * L, 0.3 * L, 0.26 * L, 0.27 * L, 0.5 * L);
  forma.bezierCurveTo(0.2 * L, 0.36 * L, 0.1 * L, 0.18 * L, 0, 0.13 * L);
  const geoAla = new THREE.ExtrudeGeometry(forma, { depth: 0.012 * L, bevelEnabled: false });
  for (const lado of [1, -1]) {
    const ala = new THREE.Mesh(geoAla, mat);
    ala.position.set(0.03 * L * lado, 0.6 * L, -0.06 * L);
    ala.scale.x = lado;
    ala.rotation.y = -0.75 * lado;
    g.add(ala);
  }
  for (const lado of [1, -1]) {
    const brazo = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * L, 0.014 * L, 0.3 * L, 8), mat);
    brazo.position.set(0.1 * L * lado, 0.6 * L, 0.07 * L);
    brazo.rotation.set(0.9, 0, 0.5 * lado);
    g.add(brazo);
  }
  return g;
}

// Evangelista de bronce (3 m) sobre su base
function evangelista(mat, base) {
  const g = new THREE.Group();
  g.add(caja(0.9, 0.25, 0.9, base, 0, 0.125, 0));
  const cuerpo = perfilTorno(
    [[0, 0], [0.1, 0], [0.12, 0.05], [0.11, 0.45], [0.1, 0.7], [0.125, 0.79], [0.11, 0.84], [0.04, 0.87], [0.035, 0.89]],
    2.85, 18, mat
  );
  cuerpo.scale.z = 0.7;
  cuerpo.position.y = 0.25;
  g.add(cuerpo);
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), mat);
  cabeza.scale.y = 1.3;
  cabeza.position.y = 0.25 + 2.85 * 0.94;
  g.add(cabeza);
  return g;
}

function cielo() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec3 vDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<6;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }
      void main(){
        vec3 d = normalize(vDir);
        float t = clamp(d.y, 0., 1.);
        vec3 col = mix(vec3(.80,.87,.94), vec3(.24,.49,.80), pow(t, .55));
        if (d.y > 0.) {
          vec2 uv = d.xz / (d.y + .15) * .9;
          float c = smoothstep(.52, .78, fbm(uv * 1.3 + 3.));
          vec3 nube = mix(vec3(1.), vec3(.72,.76,.82), smoothstep(.6,1.,fbm(uv*2.6)));
          col = mix(col, nube, c * smoothstep(0., .25, d.y) * .92);
        } else {
          col = vec3(.62,.64,.58);
        }
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), mat);
}

// ---------- Escena completa ----------
export function construirCatedral() {
  const escena = new THREE.Scene();
  escena.fog = new THREE.Fog(0xd8e2ec, 180, 900);
  escena.add(cielo());

  escena.add(new THREE.HemisphereLight(0xe4edff, 0xa9a69e, 1.25));
  const sol = new THREE.DirectionalLight(0xfff1dc, 1.7);
  sol.position.set(50, 90, 35);
  escena.add(sol);
  // Luz azulada que entra por los vitrales
  const luzVitral = new THREE.PointLight(0x9cc2ff, 220, 70, 1.6);
  luzVitral.position.set(0, 22, 0);
  escena.add(luzVitral);

  const blanco = new THREE.MeshStandardMaterial({ color: 0xf3f3f0, roughness: 0.82 });
  const hormigon = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.9 });
  const madera = new THREE.MeshStandardMaterial({ color: 0x6e4126, roughness: 0.55 });
  const rojo = new THREE.MeshStandardMaterial({ color: 0x9b1c1f, roughness: 0.95 });
  const oscuro = new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 0.3, roughness: 0.45 });
  const bronce = new THREE.MeshStandardMaterial({ color: 0x4d5641, metalness: 0.55, roughness: 0.6 });
  const dorado = new THREE.MeshStandardMaterial({ color: 0xc8a24a, metalness: 0.9, roughness: 0.3 });

  // Columnas (desfasadas medio paso para dejar libre el eje del túnel)
  const geoCol = geometriaColumna();
  for (let k = 0; k < 16; k++) {
    const col = new THREE.Mesh(geoCol, blanco);
    col.rotation.y = ((k + 0.5) * Math.PI * 2) / 16;
    escena.add(col);
  }
  // Losa/anillo superior
  const losa = new THREE.Mesh(new THREE.CylinderGeometry(ANILLO_R + 0.9, ANILLO_R + 0.6, 0.9, 64), hormigon);
  losa.position.y = ANILLO_Y - 0.2;
  escena.add(losa);

  // Vitrales: superficie del hiperboloide entre la plaza y el anillo
  const perfil = [];
  for (let y = PLAZA; y <= ANILLO_Y - 0.4; y += 0.25) perfil.push(new THREE.Vector2(radio(y), y));
  const geoVidrio = new THREE.LatheGeometry(perfil, 160);
  const vitral = new THREE.MeshBasicMaterial({ map: texturaVitral(), side: THREE.BackSide });
  vitral.color.setScalar(1.25);
  escena.add(new THREE.Mesh(geoVidrio, vitral));
  escena.add(
    new THREE.Mesh(
      geoVidrio,
      new THREE.MeshStandardMaterial({ map: texturaVidrioExterior(), side: THREE.FrontSide, metalness: 0.4, roughness: 0.3 })
    )
  );

  // Piso de mármol y muro perimetral (la nave está 3 m bajo la plaza)
  const piso = new THREE.Mesh(
    new THREE.CircleGeometry(R_VIDRIO, 128),
    new THREE.MeshStandardMaterial({ map: texturaMarmol(15), roughness: 0.3, metalness: 0.0 })
  );
  piso.rotation.x = -Math.PI / 2;
  escena.add(piso);
  const hueco = 5.4 / R_VIDRIO; // abertura del túnel en el muro (lado +Z)
  const muro = new THREE.Mesh(
    new THREE.CylinderGeometry(R_VIDRIO, R_VIDRIO, PLAZA, 160, 1, true, hueco / 2, Math.PI * 2 - hueco),
    new THREE.MeshStandardMaterial({ color: 0xeceae5, roughness: 0.4, side: THREE.DoubleSide })
  );
  muro.position.y = PLAZA / 2;
  escena.add(muro);
  const cornisa = new THREE.Mesh(new THREE.TorusGeometry(R_VIDRIO - 0.15, 0.18, 8, 160), blanco);
  cornisa.rotation.x = Math.PI / 2;
  cornisa.position.y = PLAZA;
  escena.add(cornisa);

  // Pasillo central con alfombra roja, de la entrada al altar
  escena.add(caja(2.4, 0.02, 44, rojo, 0, 0.01, 6.5));

  // Bancos de madera, dos bloques mirando al altar (norte)
  for (let i = 0; i < 20; i++) {
    const z = -9 + i * 1.1;
    for (const lado of [-1, 1]) {
      const largo = 9.5;
      const x = lado * (1.6 + largo / 2);
      escena.add(caja(largo, 0.08, 0.45, madera, x, 0.45, z));
      escena.add(caja(largo, 0.5, 0.06, madera, x, 0.72, z + 0.24));
      escena.add(caja(0.06, 0.45, 0.45, madera, x - largo / 2, 0.22, z));
      escena.add(caja(0.06, 0.45, 0.45, madera, x + largo / 2, 0.22, z));
    }
  }

  // Presbiterio: escalones, alfombra roja, altar blanco y crucifijo de madera
  [[18, 9], [15, 7.6], [12, 6.2]].forEach(([w, d], i) => escena.add(caja(w, 0.3, d, blanco, 0, 0.15 + i * 0.3, -21.5 + i * 0.7)));
  [[0, -17.2], [0.3, -17.9], [0.6, -18.6]].forEach(([y, z]) => escena.add(caja(4, 0.31, 0.75, rojo, 0, y + 0.16, z)));
  escena.add(caja(3.4, 1.05, 1.3, new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 }), 0, 0.9 + 0.52, -20.8));
  escena.add(caja(0.28, 6, 0.22, madera, 0, 0.9 + 3, -23.2));
  escena.add(caja(2.8, 0.26, 0.22, madera, 0, 0.9 + 4.9, -23.2));
  const cristo = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.5, 6, 12), new THREE.MeshStandardMaterial({ color: 0x9a6a3c, roughness: 0.6 }));
  cristo.position.set(0, 0.9 + 4.1, -23.05);
  escena.add(cristo);
  for (const x of [-1.2, 1.2]) escena.add(caja(0.08, 0.9, 0.08, dorado, x, 0.9 + 1.05 + 0.45, -20.8));

  // Nicho de Nuestra Señora Aparecida: farol de vidrio verde-agua sobre un pilar blanco
  escena.add(caja(0.3, 2.8, 0.3, blanco, 9, 1.4, -19));
  const farol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.4, 1.1, 4, 1),
    new THREE.MeshStandardMaterial({ color: 0x7fd3c8, roughness: 0.15, transparent: true, opacity: 0.75 })
  );
  farol.rotation.y = Math.PI / 4;
  farol.position.set(9, 3.35, -19);
  escena.add(farol);
  const virgen = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0x1f3c8a }));
  virgen.position.set(9, 3.3, -19);
  escena.add(virgen);

  // Luminaria ovalada colgante (blanca con centro rojo), cerca del altar
  const ovalo = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 32, 20),
    new THREE.MeshStandardMaterial({ color: 0xf6f3ee, roughness: 0.5, transparent: true, opacity: 0.85 })
  );
  ovalo.scale.set(1, 1.25, 0.6);
  ovalo.position.set(0, 13, -14);
  escena.add(ovalo);
  const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.8, 20, 14), new THREE.MeshStandardMaterial({ color: 0x8a2a1c }));
  nucleo.scale.set(1, 0.8, 0.5);
  nucleo.position.set(0, 12.7, -14);
  escena.add(nucleo);

  // Los tres ángeles colgados de cables de acero
  const cables = [];
  const angeles = [
    { L: 4.25, pos: [0.5, 21, -3], giro: 0.4 },
    { L: 3.4, pos: [-3.5, 17, 2.5], giro: -0.8 },
    { L: 2.22, pos: [2.8, 13.5, 7], giro: 2.2 },
  ];
  for (const a of angeles) {
    const ang = angel(a.L, metal);
    ang.position.set(...a.pos);
    ang.rotation.set(-1.15, a.giro, 0.15);
    escena.add(ang);
    cables.push(new THREE.Vector3(a.pos[0], a.pos[1] + 0.3, a.pos[2]), new THREE.Vector3(a.pos[0] * 0.4, ANILLO_Y - 0.6, a.pos[2] * 0.4));
  }
  cables.push(new THREE.Vector3(0, 14.9, -14), new THREE.Vector3(0, ANILLO_Y - 0.6, -2));
  escena.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cables), new THREE.LineBasicMaterial({ color: 0x7c828a })));

  // Túnel de entrada: pasa por debajo del espejo de agua y sale a la nave
  const zMuro = Math.sqrt(R_VIDRIO ** 2 - 2.7 ** 2);
  const largoTunel = R_ESPEJO - zMuro;
  const zTunel = zMuro + largoTunel / 2;
  escena.add(caja(5.4, 0.1, largoTunel, oscuro, 0, -0.05, zTunel));
  escena.add(caja(5.4, 0.2, largoTunel, oscuro, 0, 2.7, zTunel));
  for (const lado of [-1, 1]) escena.add(caja(0.3, 2.8, largoTunel + 10, oscuro, lado * 2.85, 1.4, zTunel + 5));
  for (let z = zMuro + 2; z < R_ESPEJO; z += 3) {
    const l = new THREE.PointLight(0xffe3b8, 2.5, 5, 2);
    l.position.set(0, 1.9, z);
    escena.add(l);
  }
  // Rampa descubierta que baja desde la plaza hasta el túnel
  const rampa = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 10.4), hormigon);
  rampa.rotation.x = -Math.PI / 2 - Math.atan2(PLAZA, 10); // baja hacia el túnel (norte)
  rampa.position.set(0, PLAZA / 2, R_ESPEJO + 5);
  escena.add(rampa);
  for (const lado of [-1, 1]) escena.add(caja(0.3, PLAZA, 10, hormigon, lado * 2.85, PLAZA / 2, R_ESPEJO + 5));

  // Espejo de agua (12 m de ancho) alrededor de la catedral
  const agua = new THREE.Mesh(
    new THREE.RingGeometry(R_VIDRIO + 0.2, R_ESPEJO, 160, 1),
    new THREE.MeshStandardMaterial({ color: 0x5a7f96, metalness: 0.85, roughness: 0.06 })
  );
  agua.rotation.x = -Math.PI / 2;
  agua.position.y = PLAZA - 0.12;
  escena.add(agua);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(R_ESPEJO, 0.25, 6, 160), hormigon);
  borde.rotation.x = Math.PI / 2;
  borde.position.y = PLAZA;
  escena.add(borde);

  // Plaza con un hueco para el espejo de agua y la rampa
  const plaza = new THREE.Shape();
  plaza.moveTo(-600, -600).lineTo(600, -600).lineTo(600, 600).lineTo(-600, 600).closePath();
  const hueco2 = new THREE.Path();
  const zc = Math.sqrt(R_ESPEJO ** 2 - 2.7 ** 2);
  const a0 = Math.atan2(-zc, -2.7), a1 = Math.atan2(-zc, 2.7);
  hueco2.moveTo(2.7, -zc).lineTo(2.7, -(R_ESPEJO + 10)).lineTo(-2.7, -(R_ESPEJO + 10)).lineTo(-2.7, -zc);
  hueco2.absarc(0, 0, R_ESPEJO, a0, a1, true);
  plaza.holes.push(hueco2);
  const texPlaza = texturaPlaza();
  texPlaza.repeat.set(1 / 8, 1 / 8);
  const suelo = new THREE.Mesh(new THREE.ShapeGeometry(plaza, 96), new THREE.MeshStandardMaterial({ map: texPlaza, roughness: 0.95 }));
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = PLAZA;
  escena.add(suelo);

  // Los cuatro evangelistas a lo largo del acceso
  const baseBronce = new THREE.MeshStandardMaterial({ color: 0x8b877c, roughness: 0.9 });
  [[-4.5, 55, 0.3], [4.5, 55, -0.3], [-4.5, 60, 0.2], [4.5, 60, -0.2]].forEach(([x, z, giro]) => {
    const e = evangelista(bronce, baseBronce);
    e.position.set(x, PLAZA, z);
    e.rotation.y = giro;
    escena.add(e);
  });

  // Campanario de 20 m: pilar blanco con una caja voladiza que sostiene 4 campanas
  const campanario = new THREE.Group();
  const pilar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.1, 17.5, 20), blanco);
  pilar.position.y = 17.5 / 2;
  campanario.add(pilar);
  campanario.add(caja(9.5, 1.6, 2.4, blanco, 2.5, 18.3, 0));
  const geoCampana = new THREE.LatheGeometry(
    [[0, 1], [0.25, 0.98], [0.4, 0.8], [0.45, 0.4], [0.62, 0.05], [0.66, 0]].map(([r, y]) => new THREE.Vector2(r, y)),
    20
  );
  for (let i = 0; i < 4; i++) {
    const campana = new THREE.Mesh(geoCampana, bronce);
    campana.position.set(-1.2 + i * 2.3, 19.1, 0);
    campanario.add(campana);
  }
  campanario.position.set(17, PLAZA, 52);
  campanario.rotation.y = -0.5;
  escena.add(campanario);

  // Techo ovalado del bautisterio, apenas sobre el nivel de la plaza
  const bautisterio = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), blanco);
  bautisterio.scale.set(8, 2.4, 5.5);
  bautisterio.position.set(-21, PLAZA, 47);
  escena.add(bautisterio);

  // Cruz metálica sobre la corona
  const cruz = new THREE.Group();
  cruz.add(caja(0.25, 16, 0.25, metal, 0, ANILLO_Y + 8, 0));
  cruz.add(caja(4.2, 0.25, 0.25, metal, 0, ANILLO_Y + 13, 0));
  for (let i = 0; i < 4; i++) {
    const rayo = caja(3.2, 0.1, 0.1, metal, 0, ANILLO_Y + 13, 0);
    rayo.rotation.z = Math.PI / 4 + (i * Math.PI) / 2;
    rayo.position.x += Math.cos(rayo.rotation.z) * 1.6;
    rayo.position.y += Math.sin(rayo.rotation.z) * 1.6;
    cruz.add(rayo);
  }
  escena.add(cruz);

  return { escena, piso, agua };
}

// ---------- Fotos 360 ----------
// Renderiza la escena desde cada punto a un cubemap y lo convierte a una imagen
// equirectangular 2:1. El centro de la imagen mira al norte (-Z), igual que el plano.
export async function generarPanoramas(puntos, { ancho = 4096, cubo = 2048, alAvanzar } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(ancho, ancho / 2, false);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const { escena, piso, agua } = construirCatedral();

  // Reflejos: un cubemap chico del interior para el mármol y otro del exterior para el agua
  const reflejo = (x, y, z) => {
    const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cam = new THREE.CubeCamera(0.1, 2000, rt);
    cam.position.set(x, y, z);
    cam.update(renderer, escena);
    return rt.texture;
  };
  piso.material.envMap = reflejo(0, 1.5, 0);
  piso.material.envMapIntensity = 0.3;
  agua.material.envMap = reflejo(0, PLAZA + 0.5, 50);
  piso.material.needsUpdate = agua.material.needsUpdate = true;

  const rt = new THREE.WebGLCubeRenderTarget(cubo, {
    type: THREE.HalfFloatType,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const camara = new THREE.CubeCamera(0.05, 3000, rt);

  const conversion = new THREE.Scene();
  conversion.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: { cubo: { value: rt.texture } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
        fragmentShader: `
          uniform samplerCube cubo; varying vec2 vUv;
          void main(){
            float lon = (vUv.x - .5) * 6.2831853;
            float lat = (vUv.y - .5) * 3.1415927;
            vec3 dir = vec3(sin(lon) * cos(lat), sin(lat), -cos(lon) * cos(lat));
            gl_FragColor = textureCube(cubo, dir);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      })
    )
  );
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const urls = [];
  for (let i = 0; i < puntos.length; i++) {
    camara.position.set(...puntos[i]);
    renderer.toneMapping = THREE.NoToneMapping; // el tono se aplica una sola vez, en la conversión
    camara.update(renderer, escena);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.render(conversion, ortho);
    const blob = await new Promise((r) => renderer.domElement.toBlob(r, "image/jpeg", 0.9));
    urls.push(URL.createObjectURL(blob));
    alAvanzar?.(i + 1, puntos.length);
    await new Promise((r) => setTimeout(r)); // deja respirar a la página entre foto y foto
  }
  rt.dispose();
  renderer.dispose();
  return urls;
}
