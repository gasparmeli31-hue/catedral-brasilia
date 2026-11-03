import { iniciarTour } from "../viewer.js";
import { generarPanoramas } from "./catedral3d.js";
import { catedral, salas } from "./tour.js";

const ESCALA = 7; // px del plano por metro
const CENTRO = 300;

const grados = (r) => (r * 180) / Math.PI;

// Posición en el plano y hacia dónde mirar cada punto de información, a partir del modelo
for (const s of salas) {
  const [x, y, z] = s.ojo;
  s.plano = { x: CENTRO + x * ESCALA, y: CENTRO + z * ESCALA };
  s.orientacion = 0; // las fotos generadas miran al norte en el centro
  for (const p of s.puntos) {
    const [tx, ty, tz] = p.objetivo;
    p.yaw = grados(Math.atan2(tx - x, -(tz - z)));
    p.pitch = grados(Math.atan2(ty - y, Math.hypot(tx - x, tz - z)));
  }
}

const carga = document.getElementById("carga");
const barra = carga.querySelector(".carga-barra span");
const chico = Math.min(screen.width, screen.height) < 700;

const fotos = await generarPanoramas(
  salas.map((s) => s.ojo),
  {
    ancho: chico ? 2048 : 4096,
    cubo: chico ? 1024 : 2048,
    alAvanzar: (n, total) => (barra.style.width = `${(n / total) * 100}%`),
  }
);
salas.forEach((s, i) => (s.foto = fotos[i]));

iniciarTour(catedral, salas);
carga.classList.add("lista");
setTimeout(() => carga.remove(), 900);

// ---------- Street View real y créditos ----------
document.getElementById("street-view").href = catedral.streetView;

const dialogo = document.getElementById("creditos");
document.getElementById("ver-creditos").addEventListener("click", () => dialogo.showModal());
dialogo.querySelector("button").addEventListener("click", () => dialogo.close());
const lista = dialogo.querySelector("ul");
for (const p of salas.flatMap((s) => s.puntos).filter((p) => p.credito)) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = p.fuente;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = p.nombre;
  li.append(a, ` — ${p.credito}`);
  lista.append(li);
}
