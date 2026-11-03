// =====================================================================
//  RECORRIDO DE LA CATEDRAL DE BRASÍLIA
// =====================================================================
//  - ojo:      dónde está parado el visitante en el modelo 3D [x, altura, z] en metros.
//              Centro de la nave = [0, 1.6, 0]. Norte (altar) = -z. Sur (entrada) = +z.
//              La plaza está 3 m más arriba que la nave.
//  - puntos:   información que aparece al tocar el "+". "objetivo" es el punto del modelo
//              donde se dibuja el "+" (se calcula solo hacia dónde mirar).
//  Las fotos son reales, de Wikimedia Commons, con licencia libre (ver credito/fuente).

import { INFO } from "./info.js";

export const catedral = {
  nombre: "Catedral de Brasília",
  subtitulo: "Recorrido 360° · recreación 3D con fotos reales",
  // El plano se dibuja a escala: 7 px = 1 m, centro de la nave en (300, 300)
  plano: { imagen: "plano.svg", ancho: 600, alto: 780 },
  fotosDeEjemplo: false,
  streetView: "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=-15.79806,-47.87528",
};


export const salas = [
  {
    id: "plaza",
    nombre: "Plaza",
    ojo: [0, 4.6, 64],
    conecta: ["tunel"],
    puntos: [
      { ...INFO.catedral, objetivo: [0, 22, 30] },
      { ...INFO.evangelistas, objetivo: [4.5, 5.8, 60] },
      { ...INFO.campanario, objetivo: [18, 21.5, 51] },
    ],
  },
  {
    id: "tunel",
    nombre: "Túnel de entrada",
    ojo: [0, 1.6, 40],
    conecta: ["entrada"],
    puntos: [
      { ...INFO.tunel, objetivo: [0, 1.6, 31] },
    ],
  },
  {
    id: "entrada",
    nombre: "Entrada a la nave",
    ojo: [0, 1.6, 23],
    conecta: ["centro", "lateral"],
    puntos: [
      { ...INFO.vitrales, objetivo: [-13, 12, -14] },
      { ...INFO.nave, objetivo: [0, 2.5, -10] },
    ],
  },
  {
    id: "centro",
    nombre: "Bajo los ángeles",
    ojo: [0, 1.6, 4],
    conecta: ["altar", "lateral"],
    puntos: [
      { ...INFO.angeles, objetivo: [-3.5, 17, 2.5] },
      { ...INFO.columnas, objetivo: [0, 30, 2] },
    ],
  },
  {
    id: "altar",
    nombre: "Altar",
    ojo: [0, 1.6, -12],
    conecta: ["lateral"],
    puntos: [
      { ...INFO.altar, objetivo: [0, 1.6, -20.8] },
      { ...INFO.aparecida, objetivo: [9, 3.4, -19] },
    ],
  },
  {
    id: "lateral",
    nombre: "Junto a los vitrales",
    ojo: [-19, 1.6, -4],
    conecta: [],
    puntos: [
      { ...INFO.bases, objetivo: [-29.4, 4, -5.85] },
    ],
  },
];
