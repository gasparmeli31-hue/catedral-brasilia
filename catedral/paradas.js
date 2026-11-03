// =====================================================================
//  RECORRIDO CON VIDEO REAL — paradas de la caminata
// =====================================================================
//  Cada parada es un momento del video (t, en segundos). Al tocar ▲ se reproduce
//  la caminata real hasta la parada siguiente; si la siguiente está en otro video
//  o muy lejos en el tiempo, se pasa con la transición de "paso".
//  - plano:  posición aproximada sobre plano.svg (px)
//  - puntos: los "+" de información; x / y en % del cuadro completo del video
//  - llegada (opcional): cómo se llega caminando desde la parada anterior cuando no es
//    un tramo continuo: { video, desde, hasta } — se entra a ese video en "desde" y se
//    reproduce hasta "hasta" (o hasta t si es el mismo video de la parada)

import { INFO } from "./info.js";

export const recorrido = {
  nombre: "Catedral de Brasília",
  // El crédito de los videos está en textos.js (creditoVideo): completá el nombre del autor/canal
  velocidad: 2,
  plano: { imagen: "plano.svg", ancho: 600, alto: 780 },
  streetView: "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=-15.79806,-47.87528",
  // Campo de visión horizontal de la cámara (gran angular), para el cono del plano
  fov: 118,
  // Más lejos que esto (en segundos de video) se salta con transición en lugar de reproducir
  maxTramo: 35,
};

// Versiones mejoradas con IA (_ia): superresolución Real-ESRGAN a 1080 px de alto, 30 cuadros/s.
// Al video 2 ya se le recortaron las bandas laterales. Los originales siguen en videos/.
// enlace: el tramo entre "Mirar arriba" y "Los ángeles" del video 1, en cámara rápida (5×).
// recorte: franja horizontal útil del cuadro
export const videos = {
  calle: { src: "videos/video2_ia.mp4", ancho: 1964, alto: 1080, recorte: [0, 1964] },
  nave: { src: "videos/video1_ia.mp4", ancho: 2384, alto: 1080, recorte: [0, 2384] },
  enlace: { src: "videos/enlace-angeles.mp4", ancho: 2384, alto: 1080, recorte: [0, 2384] },
};

// Paradas de video (video + t) o de fotos (tipo: "fotos", fotos: ids de la galería, en presentación).
// rumbo: hacia dónde mira la cámara en el plano (grados, 0 = hacia el altar / arriba; null = mirando al techo).
// Los nombres, la narración y el «¿Sabías que…?» de cada parada están en guion.js.
export const paradas = [
  {
    id: "llegada", video: "calle", t: 57.5, plano: [300, 776], rumbo: 0,
    puntos: [{ ...INFO.catedral, x: 55, y: 50 }, { ...INFO.campanario, x: 68, y: 44 }],
  },
  {
    id: "plaza", video: "calle", t: 76, plano: [300, 758], rumbo: 0,
    puntos: [{ ...INFO.catedral, x: 62, y: 44 }, { ...INFO.evangelistas, x: 42, y: 52 }, { ...INFO.campanario, x: 91, y: 40 }],
  },
  {
    id: "evangelistas", video: "calle", t: 100.47, plano: [300, 712], rumbo: 0,
    puntos: [{ ...INFO.evangelistas, x: 27, y: 50 }, { ...INFO.campanario, x: 80, y: 30 }],
  },
  {
    id: "rampa", video: "calle", t: 114, plano: [300, 668], rumbo: 0,
    puntos: [{ ...INFO.bautisterio, x: 32, y: 49 }, { ...INFO.tunel, x: 56, y: 62 }, { ...INFO.campanario, x: 85, y: 30 }],
  },
  {
    id: "bautisterio", tipo: "fotos", fotos: ["bautisterio"], plano: [196, 640], rumbo: -90,
    puntos: [{ ...INFO.bautisterio, x: 28, y: 66 }],
  },
  {
    id: "tunel", video: "calle", t: 126.87, llegada: { video: "calle", desde: 114 }, plano: [300, 580], rumbo: 0,
    puntos: [{ ...INFO.tunel, x: 52, y: 52 }],
  },
  {
    id: "nave", video: "calle", t: 152.6, plano: [300, 486], rumbo: 0,
    puntos: [{ ...INFO.vitrales, x: 32, y: 20 }, { ...INFO.nave, x: 68, y: 56 }],
  },
  {
    id: "cupula", video: "nave", t: 53.67, llegada: { video: "nave", desde: 46 }, plano: [300, 305], rumbo: null,
    puntos: [{ ...INFO.columnas, x: 55, y: 30 }, { ...INFO.angeles, x: 63, y: 62 }],
  },
  {
    id: "angeles", video: "nave", t: 107.8, llegada: { video: "enlace", desde: 0, hasta: 10.8 }, plano: [312, 292], rumbo: 20,
    puntos: [{ ...INFO.angeles, x: 85, y: 45 }],
  },
  {
    id: "arte", video: "calle", t: 182.73, llegada: { video: "calle", desde: 166 }, plano: [236, 430], rumbo: -45,
    puntos: [{ ...INFO.pinturas, x: 25, y: 66 }],
  },
  {
    id: "haciaAltar", video: "calle", t: 210, plano: [300, 330], rumbo: 0,
    puntos: [{ ...INFO.bases, x: 62, y: 45 }, { ...INFO.altar, x: 92, y: 56 }],
  },
  {
    id: "altar", video: "calle", t: 231, plano: [300, 196], rumbo: 0,
    puntos: [{ ...INFO.altar, x: 14, y: 62 }, { ...INFO.vitrales, x: 37, y: 16 }],
  },
  {
    id: "noche", tipo: "fotos", fotos: ["noche-dorada", "noche-cielo", "noche-evangelistas", "noche-ciudad"], plano: [300, 745], rumbo: 0,
    puntos: [],
  },
];
