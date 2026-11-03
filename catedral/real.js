import { recorrido, videos, paradas } from "./paradas.js";
import { GUION } from "./guion.js";
import { fotosDe, fotoPorId, abrirFoto, abrirGaleria, armarGaleria, creditosGaleria } from "./fotos.js";
import { t, tr, ficha, formato, LINEA, QUIZ } from "./textos.js";

const $ = (id) => document.getElementById(id);
const escenario = $("escenario");
const paso = $("paso");
const avanzarBtn = $("avanzar");
const volverBtn = $("volver");
const saltarBtn = $("saltar");
const velocidadBtn = $("velocidad");
const sonidoBtn = $("sonido");
const narracionBtn = $("narracion");
const roomsNav = $("rooms");
const mapa = $("mapa");
const yo = mapa.querySelector(".yo");
const cono = mapa.querySelector(".cono");
const inicio = $("inicio");
const final = $("final");

// Modo TV: ?tv=1 en la dirección, o navegador de televisor. Interfaz grande y control remoto.
const TV = new URLSearchParams(location.search).has("tv") || /SmartTV|Tizen|Web0S|webOS|BRAVIA|AFT[A-Z]|CrKey|GoogleTV|Android TV/i.test(navigator.userAgent);
document.body.classList.toggle("tv", TV);
// Pantalla táctil (TV táctil, celular, tablet): se muestran los botones de paradas y las etiquetas de los +
const TACTIL = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
document.body.classList.toggle("tactil", TACTIL);

let actual = 0;
let ocupado = false;
let velocidad = recorrido.velocidad;
let mirada = 0.5; // 0 = todo a la izquierda, 1 = todo a la derecha
let saltarPedido = null;
let modo = "inicio"; // "inicio" | "guiada" | "libre"
let pausado = false;
let audioguia = true;

const nombre = (p) => tr(GUION[p.id].nombre);
const esperarMs = (ms) => new Promise((r) => setTimeout(r, ms));
const esperar = (el, evento) => new Promise((r) => el.addEventListener(evento, r, { once: true }));

// ---------- Tomas: un <video> por archivo + una toma de fotos, con sus puntos de información encima ----------
const tomas = {};
for (const [clave, v] of Object.entries(videos)) {
  const toma = document.createElement("div");
  toma.className = "toma";
  const video = document.createElement("video");
  Object.assign(video, { src: v.src, muted: true, playsInline: true, preload: "auto" });
  const puntos = document.createElement("div");
  puntos.className = "puntos";
  toma.append(video, puntos);
  escenario.prepend(toma);
  tomas[clave] = { ...v, toma, video, puntos };
}
{
  const toma = document.createElement("div");
  toma.className = "toma toma-fotos";
  const imgs = [0, 1].map(() => Object.assign(document.createElement("img"), { alt: "", className: "kb" }));
  const puntos = document.createElement("div");
  puntos.className = "puntos";
  toma.append(...imgs, puntos);
  escenario.prepend(toma);
  tomas.fotos = { toma, imgs, puntos, esFotos: true };
}

function medidas(t) {
  const W = escenario.clientWidth, H = escenario.clientHeight;
  const anchoUtil = t.recorte[1] - t.recorte[0];
  const s = Math.max(W / anchoUtil, H / t.alto);
  return {
    s,
    ancho: t.ancho * s,
    alto: t.alto * s,
    top: (H - t.alto * s) / 2,
    // rango de "left" que mantiene la franja útil cubriendo la pantalla
    min: W - t.recorte[1] * s,
    max: -t.recorte[0] * s,
    visible: W / (anchoUtil * s), // qué parte del ancho se ve
  };
}

function ubicar(t) {
  if (t.esFotos) return;
  const m = medidas(t);
  Object.assign(t.toma.style, {
    width: `${m.ancho}px`,
    height: `${m.alto}px`,
    top: `${m.top}px`,
    left: `${m.max + (m.min - m.max) * mirada}px`,
  });
  return m;
}
const ubicarTodo = () => {
  Object.values(tomas).forEach(ubicar);
  orientarCono();
};
addEventListener("resize", () => {
  ubicarTodo();
  marcarEnPlano(paradas[actual].plano);
});

// ---------- Mirar alrededor: arrastrando o con ◀ ▶ ----------
let arrastre = null;
escenario.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".punto") || tomas[enPantalla]?.esFotos) return;
  const m = medidas(tomas[enPantalla]);
  arrastre = { x: e.clientX, mirada, rango: m.min - m.max };
  escenario.classList.add("arrastrando");
  escenario.setPointerCapture(e.pointerId);
  $("hint").classList.add("gone");
});
escenario.addEventListener("pointermove", (e) => {
  if (!arrastre || !arrastre.rango) return;
  mirada = Math.min(1, Math.max(0, arrastre.mirada + (e.clientX - arrastre.x) / arrastre.rango));
  ubicarTodo();
});
const soltar = () => {
  arrastre = null;
  escenario.classList.remove("arrastrando");
};
escenario.addEventListener("pointerup", soltar);
escenario.addEventListener("pointercancel", soltar);

function girar(d) {
  if (tomas[enPantalla]?.esFotos) return;
  mirada = Math.min(1, Math.max(0, mirada + d));
  escenario.classList.add("girando");
  ubicarTodo();
  clearTimeout(girar.timer);
  girar.timer = setTimeout(() => escenario.classList.remove("girando"), 500);
}

// ---------- Puntos de información ----------
function dibujarPuntos(i) {
  for (const t of Object.values(tomas)) t.puntos.replaceChildren();
  const p = paradas[i];
  for (const info of p.puntos) {
    const f = ficha(info);
    const b = document.createElement("button");
    b.className = "punto";
    b.style.left = `${info.x}%`;
    b.style.top = `${info.y}%`;
    b.innerHTML = '<span class="hotspot"></span><span class="etiqueta"></span>';
    b.querySelector(".etiqueta").textContent = f.nombre;
    b.setAttribute("aria-label", f.nombre);
    b.addEventListener("click", () => abrirFicha(info));
    tomas[p.tipo === "fotos" ? "fotos" : p.video].puntos.append(b);
  }
}

// Ficha: texto + todas sus fotos (la propia y las de la galería con el mismo tema), pasables con ‹ ›
const panel = $("product");
const fichaFotos = panel.querySelector(".ficha-fotos");
const fichaImg = panel.querySelector(".product-img");
const fichaCredito = panel.querySelector(".product-credit");
let fotosFicha = [];
let fotoFicha = 0;
function mostrarFotoFicha(k) {
  fotoFicha = (k + fotosFicha.length) % fotosFicha.length;
  const f = fotosFicha[fotoFicha];
  fichaImg.src = f.archivo;
  fichaCredito.textContent = `${t("foto")}: ${f.credito}`;
  fichaCredito.href = f.fuente;
  fichaFotos.querySelector(".ficha-num").textContent = `${fotoFicha + 1} / ${fotosFicha.length}`;
}
function abrirFicha(info) {
  const p = ficha(info);
  panel.querySelector(".product-name").textContent = p.nombre;
  panel.querySelector(".product-desc").textContent = p.descripcion;
  const propia = p.imagen ? [{ archivo: p.imagen, titulo: p.nombre, credito: p.credito, fuente: p.fuente }] : [];
  fotosFicha = [...propia, ...fotosDe(p.clave).filter((f) => f.archivo !== p.imagen)];
  fichaFotos.hidden = fichaCredito.hidden = !fotosFicha.length;
  fichaFotos.classList.toggle("varias", fotosFicha.length > 1);
  if (fotosFicha.length) mostrarFotoFicha(0);
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
}
fichaFotos.querySelector(".ficha-ant").addEventListener("click", () => mostrarFotoFicha(fotoFicha - 1));
fichaFotos.querySelector(".ficha-sig").addEventListener("click", () => mostrarFotoFicha(fotoFicha + 1));
fichaImg.addEventListener("click", () => abrirFoto(fotosFicha, fotoFicha));
function cerrarFicha() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
}
panel.querySelector(".product-close").addEventListener("click", cerrarFicha);

// ---------- Plano, con el cono de hacia dónde se mira ----------
const kPlano = () => mapa.clientWidth / recorrido.plano.ancho;
let rumboActual = 0;
function marcarEnPlano([x, y], rumbo = rumboActual) {
  for (const el of [yo, cono]) {
    el.style.left = `${x * kPlano()}px`;
    el.style.top = `${y * kPlano()}px`;
  }
  rumboActual = rumbo;
  orientarCono();
}
function orientarCono() {
  const toma = tomas[enPantalla];
  if (!toma || rumboActual === null) {
    cono.classList.add("arriba"); // mirando al techo
    return;
  }
  cono.classList.remove("arriba");
  let ancho = recorrido.fov, desvio = 0;
  if (!toma.esFotos) {
    const m = medidas(toma);
    ancho = recorrido.fov * Math.min(1, m.visible);
    desvio = (mirada - 0.5) * recorrido.fov * Math.max(0, 1 - m.visible);
  } else ancho = 60;
  cono.style.setProperty("--ancho", `${ancho}deg`);
  cono.style.transform = `translate(-50%, -50%) rotate(${rumboActual + desvio}deg)`;
}
paradas.forEach((p, i) => {
  const b = document.createElement("button");
  b.className = "parada";
  b.style.left = `${(p.plano[0] / recorrido.plano.ancho) * 100}%`;
  b.style.top = `${(p.plano[1] / recorrido.plano.alto) * 100}%`;
  b.addEventListener("click", () => irAManual(i));
  mapa.insertBefore(b, cono);
});
const mezclar = (a, b, f) => (a === null || b === null ? (f < 0.5 ? a : b) : a + (b - a) * f);

// ---------- Fotos de las paradas de fotos (presentación con zoom lento) ----------
let presentacion = null;
function mostrarFotos(p) {
  clearInterval(presentacion);
  const { imgs } = tomas.fotos;
  const fotos = p.fotos.map(fotoPorId);
  let k = 0, capa = 0;
  const poner = () => {
    const img = imgs[capa];
    img.src = fotos[k].archivo;
    img.classList.remove("visible");
    void img.offsetWidth; // reinicia el zoom lento
    img.classList.add("visible");
    imgs[1 - capa].classList.remove("visible");
    capa = 1 - capa;
    k = (k + 1) % fotos.length;
  };
  poner();
  if (fotos.length > 1) presentacion = setInterval(() => !pausado && poner(), 6500);
}

// ---------- Moverse ----------
async function posicionar(video, t) {
  if (Math.abs(video.currentTime - t) < 0.02 && video.readyState >= 2) return;
  video.currentTime = t;
  await esperar(video, "seeked");
}

let enPantalla = null; // clave de la toma que se ve ahora
function activar(clave) {
  enPantalla = clave;
  for (const [k, t] of Object.entries(tomas)) t.toma.classList.toggle("activa", k === clave);
  escenario.classList.toggle("en-fotos", clave === "fotos");
}

// Caminata real: reproduce un video de t0 a t1 moviendo el punto en el plano.
// Devuelve false si en el medio se pidió saltar a otra parada.
let caminandoVideo = null;
async function reproducir(clave, t0, t1, desde, hasta) {
  const video = tomas[clave].video;
  escenario.classList.add("caminando");
  saltarBtn.hidden = false;
  video.playbackRate = velocidad;
  caminandoVideo = video;
  if (!pausado) await video.play();
  await new Promise((listo) => {
    let fin = false;
    const llego = () => saltarPedido !== null || video.currentTime >= t1 - 0.04 || video.ended;
    const terminar = () => {
      if (fin) return;
      fin = true;
      video.pause();
      video.removeEventListener("timeupdate", control);
      listo();
    };
    // con la pestaña oculta no corre requestAnimationFrame: "timeupdate" frena igual en la parada
    const control = () => llego() && terminar();
    video.addEventListener("timeupdate", control);
    const tick = () => {
      if (fin) return;
      const f = Math.min(1, Math.max(0, (video.currentTime - t0) / (t1 - t0)));
      marcarEnPlano([0, 1].map((k) => desde.plano[k] + (hasta.plano[k] - desde.plano[k]) * f), mezclar(desde.rumbo, hasta.rumbo, f));
      if (llego()) return terminar();
      requestAnimationFrame(tick);
    };
    tick();
  });
  caminandoVideo = null;
  saltarBtn.hidden = true;
  escenario.classList.remove("caminando");
  if (saltarPedido !== null) return false;
  await posicionar(video, t1);
  return true;
}

// Pasa a una parada sin caminar. Entre videos, con transición de "paso" (la imagen actual se agranda y
// desvanece, la nueva aparece un poco más lejos y se acerca); hacia o desde fotos, con un fundido.
async function pasar(clave, t, { suave = false } = {}) {
  const origen = tomas[enPantalla];
  const destino = tomas[clave];
  if (origen.esFotos || destino.esFotos) {
    if (!destino.esFotos) {
      mirada = 0.5;
      ubicar(destino);
      await posicionar(destino.video, t);
    }
    activar(clave);
    await esperarMs(400);
    return;
  }
  const W = escenario.clientWidth, H = escenario.clientHeight;
  paso.width = W * devicePixelRatio;
  paso.height = H * devicePixelRatio;
  const g = paso.getContext("2d");
  const m = medidas(origen);
  g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  g.drawImage(origen.video, parseFloat(origen.toma.style.left), m.top, m.ancho, m.alto);
  paso.classList.remove("go", "fundir");
  paso.classList.add("visible");

  if (!suave) mirada = 0.5;
  ubicar(destino);
  await posicionar(destino.video, t);
  destino.toma.classList.remove("acercar", "llegando");
  if (!suave) destino.toma.classList.add("llegando");
  activar(clave);
  void paso.offsetWidth;
  if (!suave) {
    destino.toma.classList.add("acercar");
    destino.toma.classList.remove("llegando");
  }
  paso.classList.add(suave ? "fundir" : "go");
  setTimeout(() => paso.classList.remove("visible", "go", "fundir"), 850);
}

const irDirecto = (p) => (p.tipo === "fotos" ? (mostrarFotos(p), pasar("fotos", 0)) : pasar(p.video, p.t));

async function irA(j) {
  if (j < 0 || j >= paradas.length || j === actual) return;
  if (ocupado) {
    saltarPedido = j;
    return;
  }
  ocupado = true;
  cerrarFicha();
  callar();
  ocultarSabias();
  const desde = paradas[actual], hasta = paradas[j];
  const tramo = hasta.t - desde.t;
  const l = hasta.llegada;
  let destinoFinal = j;
  try {
    let completo = true;
    if (j === actual + 1 && !desde.tipo && desde.video === hasta.video && tramo > 0 && tramo <= recorrido.maxTramo) {
      completo = await reproducir(hasta.video, desde.t, hasta.t, desde, hasta);
    } else if (j === actual + 1 && l) {
      // no es un tramo continuo: se entra caminando por el tramo real que lleva a la parada
      await pasar(l.video, l.desde);
      completo = await reproducir(l.video, l.desde, l.hasta ?? hasta.t, desde, hasta);
      if (completo && l.video !== hasta.video) await pasar(hasta.video, hasta.t, { suave: true });
    } else {
      await irDirecto(hasta);
    }
    if (!completo) {
      destinoFinal = saltarPedido;
      saltarPedido = null;
      await irDirecto(paradas[destinoFinal]);
    }
  } finally {
    actual = destinoFinal;
    ocupado = false;
    mostrarParada();
  }
}

// Moverse a mano corta la visita guiada (queda el botón para retomarla)
function irAManual(j) {
  if (modo === "guiada") pasarALibre();
  irA(j);
}

function mostrarParada() {
  const p = paradas[actual];
  dibujarPuntos(actual);
  marcarEnPlano(p.plano, p.rumbo);
  for (const b of roomsNav.children) b.classList.toggle("active", b.dataset.i == actual);
  roomsNav.children[actual]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  const siguiente = paradas[actual + 1];
  avanzarBtn.disabled = !siguiente;
  avanzarBtn.querySelector(".destino").textContent = siguiente ? nombre(siguiente) : t("finRecorrido");
  volverBtn.disabled = actual === 0;
  if (modo === "libre") {
    const ultima = actual === paradas.length - 1;
    // en la última parada, al terminar la narración aparece el final con el quiz
    if (audioguia) narrar(p.id).then(() => ultima && modo === "libre" && actual === paradas.length - 1 && mostrarFinal());
    else if (ultima) setTimeout(() => modo === "libre" && actual === paradas.length - 1 && mostrarFinal(), 6000);
    setTimeout(() => modo !== "inicio" && mostrarSabias(p.id), 1200);
  }
}

// ---------- Audioguía ----------
const narrador = new Audio();
narrador.preload = "auto";
const activarSonido = $("activar-sonido");
let narracion = null; // { id, fin, sinAudio, timer }

// Narra una parada. Si el navegador todavía no deja reproducir audio (nadie tocó la pantalla),
// espera lo que duraría la narración y ofrece «Tocá para activar el sonido».
function narrar(id) {
  callar();
  const texto = tr(GUION[id].narracion);
  return new Promise((resolver) => {
    const n = { id, fin: resolver, sinAudio: false };
    narracion = n;
    narrador.src = `audio/es/${id}.m4a`;
    const terminar = () => {
      if (narracion !== n) return;
      narracion = null;
      clearInterval(n.timer);
      resolver();
    };
    narrador.onended = terminar;
    const esperarSinAudio = (ofrecerSonido) => {
      n.sinAudio = true;
      activarSonido.hidden = !ofrecerSonido;
      let quedan = texto.length / 14; // segundos, a ritmo de lectura
      n.timer = setInterval(() => {
        if (!pausado) quedan -= 0.25;
        if (quedan <= 0) terminar();
      }, 250);
    };
    if (!audioguia) return esperarSinAudio(false);
    if (!pausado) narrador.play().then(() => (activarSonido.hidden = true), () => esperarSinAudio(true));
  });
}
function callar() {
  if (!narracion) return;
  const n = narracion;
  narracion = null;
  clearInterval(n.timer);
  narrador.pause();
  n.fin();
}
// El toque habilita el audio: la narración de la parada actual arranca de nuevo, ahora con sonido
activarSonido.addEventListener("click", () => {
  activarSonido.hidden = true;
  const n = narracion;
  if (!n || !n.sinAudio) return;
  clearInterval(n.timer);
  n.sinAudio = false;
  narrador.currentTime = 0;
  narrador.play().catch(() => {});
});

// ---------- ¿Sabías que…? ----------
const sabias = $("sabias");
function mostrarSabias(id) {
  sabias.querySelector(".sabias-titulo").textContent = t("sabias");
  sabias.querySelector(".sabias-texto").textContent = tr(GUION[id].sabias);
  sabias.classList.add("visible");
}
const ocultarSabias = () => sabias.classList.remove("visible");

// ---------- Visita guiada: avanza sola, narra cada parada y sigue ----------
const estado = $("guiada-estado");
let vuelta = 0;
async function guiar() {
  const mia = ++vuelta;
  const sigue = () => modo === "guiada" && vuelta === mia;
  while (sigue()) {
    const p = paradas[actual];
    setTimeout(() => sigue() && mostrarSabias(p.id), 1500);
    await narrar(p.id);
    await pausaAtenta(p.tipo === "fotos" ? 4000 : 2500, sigue);
    if (!sigue()) return;
    if (actual === paradas.length - 1) return mostrarFinal();
    await irA(actual + 1);
  }
}
// Espera respetando la pausa
async function pausaAtenta(ms, sigue) {
  let quedan = ms;
  while (quedan > 0 && sigue()) {
    await esperarMs(200);
    if (!pausado) quedan -= 200;
  }
}

function pasarALibre() {
  modo = "libre";
  vuelta++;
  pausado = false;
  actualizarEstado();
}
function actualizarEstado() {
  estado.hidden = modo === "inicio";
  estado.classList.toggle("libre", modo === "libre");
  estado.querySelector(".guiada-texto").textContent =
    modo === "guiada" ? (pausado ? t("enPausa") : t("guiada")) : t("guiada");
  $("guiada-pausa").textContent = modo === "guiada" ? (pausado ? `▶ ${t("seguir")}` : `❚❚ ${t("pausa")}`) : `▶ ${t("guiada")}`;
}
function alternarPausa() {
  if (modo === "libre" && !narracion) return;
  pausado = !pausado;
  if (pausado) {
    narrador.pause();
    caminandoVideo?.pause();
  } else {
    if (narracion && !narracion.sinAudio) narrador.play().catch(() => {});
    caminandoVideo?.play();
  }
  actualizarEstado();
}
$("guiada-pausa").addEventListener("click", () => {
  if (modo === "guiada") alternarPausa();
  else {
    modo = "guiada";
    actualizarEstado();
    guiar();
  }
});

// ---------- Inicio y final ----------
function empezar(nuevoModo) {
  inicio.classList.add("oculto");
  final.hidden = true;
  modo = nuevoModo;
  pausado = false;
  actualizarEstado();
  if (modo === "guiada") guiar();
  else mostrarParada();
  setTimeout(() => (modo === "libre" ? avanzarBtn : $("guiada-pausa")).focus(), 600);
}
async function volverAlInicio() {
  modo = "inicio";
  vuelta++;
  callar();
  ocultarSabias();
  cerrarFicha();
  for (const d of document.querySelectorAll("dialog[open]")) d.close();
  final.hidden = true;
  actualizarEstado();
  if (ocupado) {
    saltarPedido = 0;
    while (ocupado) await esperarMs(100);
  }
  if (actual !== 0) {
    actual = 0;
    await irDirecto(paradas[0]);
    mostrarParada();
  }
  inicio.classList.remove("oculto");
  $("empezar-guiada").focus();
  esperaInicio();
}
function mostrarFinal() {
  final.hidden = false;
  $("final-quiz").focus();
  // en la TV, si nadie toca nada, vuelve al inicio
  clearTimeout(mostrarFinal.timer);
  mostrarFinal.timer = setTimeout(() => !final.hidden && !$("quiz").open && volverAlInicio(), 30000);
}
$("empezar-guiada").addEventListener("click", () => empezar("guiada"));
$("empezar-libre").addEventListener("click", () => empezar("libre"));
$("ir-inicio").addEventListener("click", volverAlInicio);
$("final-reiniciar").addEventListener("click", volverAlInicio);
$("final-quiz").addEventListener("click", () => {
  final.hidden = true;
  abrirQuiz();
});

// En la TV, la pantalla de inicio arranca sola la visita guiada después de un rato (modo exhibición)
function esperaInicio() {
  clearTimeout(esperaInicio.timer);
  if (TV) esperaInicio.timer = setTimeout(() => modo === "inicio" && empezar("guiada"), 60000);
}

// ---------- Quiz ----------
const quiz = $("quiz");
let q = 0, aciertos = 0;
function abrirQuiz() {
  q = 0;
  aciertos = 0;
  quiz.showModal();
  mostrarPregunta();
}
function mostrarPregunta() {
  const preg = QUIZ[q];
  quiz.querySelector(".quiz-num").textContent = `${t("pregunta")} ${q + 1} / ${QUIZ.length}`;
  quiz.querySelector(".quiz-pregunta").textContent = tr(preg.pregunta);
  const caja = quiz.querySelector(".quiz-opciones");
  caja.replaceChildren();
  quiz.querySelector(".quiz-feedback").textContent = "";
  const sig = quiz.querySelector(".quiz-siguiente");
  sig.hidden = true;
  preg.opciones.forEach((o, k) => {
    const b = document.createElement("button");
    b.className = "quiz-opcion";
    b.textContent = tr(o);
    b.addEventListener("click", () => {
      for (const x of caja.children) x.disabled = true;
      const bien = k === preg.ok;
      if (bien) aciertos++;
      b.classList.add(bien ? "bien" : "mal");
      caja.children[preg.ok].classList.add("bien");
      quiz.querySelector(".quiz-feedback").textContent = bien ? t("correcto") : t("incorrecto");
      sig.textContent = t("siguiente");
      sig.hidden = false;
      sig.focus();
    });
    caja.append(b);
  });
  caja.children[0].focus();
}
quiz.querySelector(".quiz-siguiente").addEventListener("click", () => {
  if (q < QUIZ.length - 1) {
    q++;
    return mostrarPregunta();
  }
  if (quiz.dataset.resultado) {
    delete quiz.dataset.resultado;
    quiz.close();
    return;
  }
  // resultado
  quiz.dataset.resultado = "1";
  quiz.querySelector(".quiz-num").textContent = t("quiz");
  quiz.querySelector(".quiz-pregunta").textContent = formato(t("resultado"), { n: aciertos, total: QUIZ.length });
  quiz.querySelector(".quiz-opciones").replaceChildren();
  quiz.querySelector(".quiz-feedback").textContent = aciertos >= 4 ? t("resultadoBien") : t("resultadoMas");
  const sig = quiz.querySelector(".quiz-siguiente");
  sig.textContent = t("volverEmpezar");
  sig.focus();
});
quiz.addEventListener("close", () => {
  delete quiz.dataset.resultado;
  if (modo !== "inicio") volverAlInicio();
});
quiz.querySelector(".dialogo-cerrar").addEventListener("click", () => quiz.close());

// ---------- Línea de tiempo ----------
const historia = $("historia");
function armarLinea() {
  const lista = historia.querySelector(".linea-lista");
  lista.replaceChildren();
  for (const h of LINEA) {
    const li = document.createElement("li");
    li.tabIndex = 0;
    const f = fotoPorId(h.foto);
    li.innerHTML = '<img alt="" loading="lazy"><span class="linea-anio"></span><p></p>';
    li.querySelector("img").src = f.miniatura;
    li.querySelector(".linea-anio").textContent = h.anio;
    li.querySelector("p").textContent = tr(h.texto);
    li.addEventListener("click", () => abrirFoto([f]));
    li.addEventListener("keydown", (e) => e.key === "Enter" && abrirFoto([f]));
    lista.append(li);
  }
}
$("ver-historia").addEventListener("click", () => {
  if (modo === "guiada" && !pausado) alternarPausa();
  historia.showModal();
  historia.querySelector("li").focus();
});
historia.querySelector(".dialogo-cerrar").addEventListener("click", () => historia.close());
historia.addEventListener("keydown", (e) => {
  const items = [...historia.querySelectorAll("li")];
  const k = items.indexOf(document.activeElement);
  if (k < 0) return;
  const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
  if (!d) return;
  e.preventDefault();
  const sig = items[Math.min(items.length - 1, Math.max(0, k + d))];
  sig.focus();
  sig.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
});

// ---------- Textos en el idioma elegido ----------
function aplicarIdioma() {
  for (const el of document.querySelectorAll("[data-t]")) el.textContent = t(el.dataset.t);
  $("brand-name").textContent = recorrido.nombre;
  $("brand-sub").textContent = TV ? t("subtituloTV") : t("subtitulo");
  $("hint").textContent = TV && !TACTIL ? t("hintTV") : t("hint");
  $("credito-video").textContent = t("creditoVideo");
  $("creditos-video").textContent = `${t("creditoVideo")}.`;
  [...roomsNav.children].forEach((b, i) => (b.textContent = nombre(paradas[i])));
  [...mapa.querySelectorAll(".parada")].forEach((b, i) => (b.title = nombre(paradas[i])));
  const siguiente = paradas[actual + 1];
  avanzarBtn.querySelector(".destino").textContent = siguiente ? nombre(siguiente) : t("finRecorrido");
  dibujarPuntos(actual);
  armarGaleria();
  armarLinea();
  creditosGaleria($("creditos-galeria"));
  const ul = $("creditos-fichas");
  ul.replaceChildren();
  const vistas = new Set();
  for (const info of paradas.flatMap((p) => p.puntos)) {
    if (!info.credito || vistas.has(info.fuente)) continue;
    vistas.add(info.fuente);
    const li = document.createElement("li");
    const a = Object.assign(document.createElement("a"), { href: info.fuente, target: "_blank", rel: "noopener", textContent: ficha(info).nombre });
    li.append(a, ` — ${info.credito}`);
    ul.append(li);
  }
  actualizarEstado();
}

// ---------- Interfaz ----------
$("street-view").href = recorrido.streetView;
paradas.forEach((p, i) => {
  const b = document.createElement("button");
  b.dataset.i = i;
  b.addEventListener("click", () => irAManual(i));
  roomsNav.append(b);
});

avanzarBtn.addEventListener("click", () => irAManual(actual + 1));
volverBtn.addEventListener("click", () => irAManual(actual - 1));
saltarBtn.addEventListener("click", () => (saltarPedido = actual + 1));
velocidadBtn.addEventListener("click", () => {
  velocidad = velocidad === 2 ? 1 : 2;
  velocidadBtn.textContent = `${velocidad}×`;
  for (const t of Object.values(tomas)) if (t.video) t.video.playbackRate = velocidad;
});
sonidoBtn.addEventListener("click", () => {
  const mudo = !tomas.calle.video.muted;
  for (const t of Object.values(tomas)) if (t.video) t.video.muted = mudo;
  sonidoBtn.textContent = mudo ? "🔇" : "🔊";
});
narracionBtn.addEventListener("click", () => {
  audioguia = !audioguia;
  narracionBtn.classList.toggle("apagado", !audioguia);
  if (!audioguia) callar();
});
const dialogoCreditos = $("creditos");
$("ver-creditos").addEventListener("click", () => dialogoCreditos.showModal());
dialogoCreditos.querySelector("button").addEventListener("click", () => dialogoCreditos.close());
$("ver-galeria").addEventListener("click", () => {
  if (modo === "guiada" && !pausado) alternarPausa();
  abrirGaleria();
});

$("inicio-fotos").addEventListener("click", abrirGaleria);
$("inicio-historia").addEventListener("click", () => {
  historia.showModal();
  historia.querySelector("li").focus();
});
$("inicio-creditos").addEventListener("click", () => dialogoCreditos.showModal());

// En menús (inicio, final, galería, quiz) las flechas mueven el foco entre los botones, para el control remoto
function moverFoco(contenedor, d) {
  const botones = [...contenedor.querySelectorAll("button:not(:disabled):not([hidden]), a[href]")].filter((b) => b.offsetParent !== null);
  if (!botones.length) return;
  const k = botones.indexOf(document.activeElement);
  botones[k < 0 ? 0 : Math.min(botones.length - 1, Math.max(0, k + d))].focus();
}

// Teclado y control remoto: ▲ caminar · ▼ volver · ◀ ▶ mirar · OK pausa · Atrás cierra / vuelve al inicio
document.addEventListener("keydown", (e) => {
  tocar();
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  const dialogo = document.querySelector("dialog[open]");
  if (dialogo) {
    // el visor de fotos y la línea de tiempo usan ◀ ▶ a su manera
    if (d && dialogo !== $("foto") && dialogo !== historia) {
      e.preventDefault();
      moverFoco(dialogo, d);
    }
    return;
  }
  if (modo === "inicio" || !final.hidden) {
    if (d) {
      e.preventDefault();
      moverFoco(modo === "inicio" ? inicio : final, d);
    }
    return;
  }
  const enBoton = document.activeElement?.matches("button, a");
  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      irAManual(actual + 1);
      break;
    case "ArrowDown":
      e.preventDefault();
      irAManual(actual - 1);
      break;
    case "ArrowLeft":
      e.preventDefault();
      girar(-0.15);
      break;
    case "ArrowRight":
      e.preventDefault();
      girar(0.15);
      break;
    case "Enter":
    case " ":
    case "MediaPlayPause":
      if (enBoton && e.key !== "MediaPlayPause") return; // el botón con foco se activa solo
      e.preventDefault();
      if (modo === "guiada") alternarPausa();
      else if (narracion || pausado) alternarPausa();
      else narrar(paradas[actual].id);
      break;
    case "Escape":
    case "Backspace":
    case "BrowserBack":
    case "GoBack":
      e.preventDefault();
      if (panel.classList.contains("open")) cerrarFicha();
      else volverAlInicio();
      break;
  }
});
setTimeout(() => $("hint").classList.add("gone"), 12000);

// Sin actividad un buen rato en modo libre, vuelve al inicio (pensado para la TV) y esconde el cursor
let ultimoToque = Date.now();
let cursorTimer;
function tocar() {
  ultimoToque = Date.now();
  document.body.classList.remove("sin-cursor");
  clearTimeout(cursorTimer);
  cursorTimer = setTimeout(() => document.body.classList.add("sin-cursor"), 3000);
}
for (const ev of ["pointermove", "pointerdown", "wheel", "touchstart"]) addEventListener(ev, tocar, { passive: true });
setInterval(() => {
  if (modo === "libre" && !ocupado && !narracion && Date.now() - ultimoToque > (TV ? 180000 : 600000)) volverAlInicio();
}, 10000);

// ---------- Arranque ----------
aplicarIdioma();
ubicarTodo();
esperaInicio();
inicio.classList.add("cargando");
await Promise.all(Object.values(tomas).map((t) => (!t.video || t.video.readyState >= 1 ? null : esperar(t.video, "loadedmetadata"))));
await posicionar(tomas[paradas[0].video].video, paradas[0].t);
activar(paradas[0].video);
dibujarPuntos(0);
marcarEnPlano(paradas[0].plano, paradas[0].rumbo);
mostrarParada();
inicio.classList.remove("cargando");
$("empezar-guiada").focus();
