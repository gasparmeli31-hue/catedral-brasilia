// Galería de fotos y visor a pantalla completa, compartidos por la caminata y las fichas
import { SECCIONES, FOTOS } from "./galeria.js";
import { idioma, t, tr, formato, UI, TITULOS_GALERIA } from "./textos.js";

const galeria = document.getElementById("galeria");
const visor = document.getElementById("foto");
const visorImg = visor.querySelector("img");
const pie = visor.querySelector(".foto-pie");

// Título de una foto en el idioma actual
export function tituloFoto(f) {
  const otros = TITULOS_GALERIA[f.id];
  if (idioma() === "pt" && otros) return otros[0];
  if (idioma() === "en" && otros) return otros[1];
  return f.titulo;
}

// Fotos de la galería que van con una ficha (las de su mismo tema)
export const fotosDe = (clave) => FOTOS.filter((f) => f.tema === clave);
export const fotoPorId = (id) => FOTOS.find((f) => f.id === id);

// ---------- Visor ----------
let lista = [];
let i = 0;

function mostrar() {
  const f = lista[i];
  visorImg.src = f.archivo;
  visorImg.alt = tituloFoto(f);
  pie.querySelector(".foto-titulo").textContent = tituloFoto(f);
  Object.assign(pie.querySelector("a"), { href: f.fuente, textContent: `${t("foto")}: ${f.credito}` });
  pie.querySelector(".foto-num").textContent = `${i + 1} / ${lista.length}`;
  visor.classList.toggle("unica", lista.length < 2);
  // la siguiente ya queda cargando
  if (lista.length > 1) new Image().src = lista[(i + 1) % lista.length].archivo;
}
const mover = (d) => {
  i = (i + d + lista.length) % lista.length;
  mostrar();
};

export function abrirFoto(fotos, desde = 0) {
  lista = fotos;
  i = desde;
  mostrar();
  if (!visor.open) visor.showModal();
}

visor.querySelector(".foto-ant").addEventListener("click", () => mover(-1));
visor.querySelector(".foto-sig").addEventListener("click", () => mover(1));
visor.querySelector(".foto-cerrar").addEventListener("click", () => visor.close());
document.addEventListener("keydown", (e) => {
  if (!visor.open) return;
  if (e.key === "ArrowLeft") mover(-1);
  if (e.key === "ArrowRight") mover(1);
});
// Deslizar con el dedo
let inicioX = null;
visor.addEventListener("pointerdown", (e) => (inicioX = e.clientX));
visor.addEventListener("pointerup", (e) => {
  const dx = inicioX === null ? 0 : e.clientX - inicioX;
  inicioX = null;
  if (Math.abs(dx) > 50 && lista.length > 1) mover(dx < 0 ? 1 : -1);
  // tocar fuera de la foto cierra
  else if (e.target === visor || e.target.classList.contains("foto-marco")) visor.close();
});

// ---------- Galería ----------
const cuerpo = galeria.querySelector(".galeria-cuerpo");
export function armarGaleria() {
  galeria.querySelector("h2").textContent = t("galeriaTitulo");
  galeria.querySelector(".galeria-cuenta").textContent = formato(t("galeriaCuenta"), { n: FOTOS.length });
  cuerpo.replaceChildren();
  for (const s of SECCIONES) {
    const fotos = FOTOS.filter((f) => f.seccion === s.id);
    if (!fotos.length) continue;
    const h = document.createElement("h3");
    h.textContent = tr(UI.secciones[s.id]) ?? s.nombre;
    const grilla = document.createElement("div");
    grilla.className = "grilla";
    fotos.forEach((f, k) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", tituloFoto(f));
      const img = Object.assign(document.createElement("img"), { src: f.miniatura, alt: "", loading: "lazy" });
      b.append(img);
      b.addEventListener("click", () => abrirFoto(fotos, k));
      grilla.append(b);
    });
    cuerpo.append(h, grilla);
  }
}
galeria.querySelector(".galeria-cerrar").addEventListener("click", () => galeria.close());
export function abrirGaleria() {
  galeria.showModal();
  galeria.querySelector(".grilla button")?.focus();
}

// Créditos de todas las fotos de la galería
export function creditosGaleria(ul) {
  ul.replaceChildren();
  for (const f of FOTOS) {
    const li = document.createElement("li");
    const a = Object.assign(document.createElement("a"), { href: f.fuente, target: "_blank", rel: "noopener", textContent: tituloFoto(f) });
    li.append(a, ` — ${f.credito}`);
    ul.append(li);
  }
}
