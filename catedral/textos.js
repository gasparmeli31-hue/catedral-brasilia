// Textos de la interfaz, línea de tiempo, quiz y títulos de la galería en español, portugués e inglés
import { INFO } from "./info.js";
import { INFO_TR } from "./info-tr.js";

export const IDIOMAS = { es: "Español", pt: "Português", en: "English" };

// Por ahora la visita es solo en español. Las traducciones al portugués y al inglés quedan en este
// archivo y en info-tr.js por si se vuelven a usar.
let lang = "es";

export const idioma = () => lang;
export function cambiarIdioma(l) {
  lang = l;
  document.documentElement.lang = l;
  try { localStorage.setItem("idioma", l); } catch {}
}
document.documentElement.lang = lang;

// Elige el texto del idioma actual de un objeto { es, pt, en } (o devuelve el texto tal cual)
export const tr = (o) => (o == null || typeof o === "string" ? o : o[lang] ?? o.es);
export const t = (clave) => tr(UI[clave]) ?? clave;

// Ficha de información en el idioma actual
export function ficha(info) {
  const x = INFO_TR[lang]?.[info.clave];
  return x ? { ...info, ...x } : info;
}
export const infoDe = (clave) => ficha(INFO[clave]);

export const UI = {
  subtitulo: { es: "Caminata real · arrastrá para mirar alrededor", pt: "Caminhada real · arraste para olhar ao redor", en: "Real walk · drag to look around" },
  subtituloTV: { es: "Visita guiada", pt: "Visita guiada", en: "Guided tour" },
  fotos: { es: "Fotos", pt: "Fotos", en: "Photos" },
  historia: { es: "Historia", pt: "História", en: "History" },
  vista360: { es: "Vista 360° (recreación 3D)", pt: "Vista 360° (recriação 3D)", en: "360° view (3D recreation)" },
  streetView: { es: "Street View ↗", pt: "Street View ↗", en: "Street View ↗" },
  creditos: { es: "Créditos", pt: "Créditos", en: "Credits" },
  inicio: { es: "Inicio", pt: "Início", en: "Home" },
  hint: {
    es: "Arrastrá para mirar alrededor · Tocá ▲ para caminar · Tocá los + para saber más",
    pt: "Arraste para olhar ao redor · Toque ▲ para caminhar · Toque nos + para saber mais",
    en: "Drag to look around · Tap ▲ to walk · Tap the + to learn more",
  },
  hintTV: {
    es: "◀ ▶ mirar alrededor · ▲ caminar · ▼ volver · OK pausar",
    pt: "◀ ▶ olhar ao redor · ▲ caminhar · ▼ voltar · OK pausar",
    en: "◀ ▶ look around · ▲ walk · ▼ back · OK pause",
  },
  finRecorrido: { es: "Fin del recorrido", pt: "Fim do percurso", en: "End of the tour" },
  cargando: { es: "Cargando la caminata…", pt: "Carregando a caminhada…", en: "Loading the walk…" },
  creditoVideo: {
    es: "Videos de la caminata: autor original (canal «…Lifestyle»)",
    pt: "Vídeos da caminhada: autor original (canal «…Lifestyle»)",
    en: "Walk videos: original author («…Lifestyle» channel)",
  },
  foto: { es: "Foto", pt: "Foto", en: "Photo" },
  sabias: { es: "¿Sabías que…?", pt: "Você sabia?", en: "Did you know?" },
  // Pantalla de inicio
  bienvenida: {
    es: "Un recorrido real por la obra maestra de Oscar Niemeyer",
    pt: "Um percurso real pela obra-prima de Oscar Niemeyer",
    en: "A real walk through Oscar Niemeyer's masterpiece",
  },
  guiada: { es: "Visita guiada", pt: "Visita guiada", en: "Guided tour" },
  guiadaDesc: {
    es: "Avanza sola, con audioguía · unos 7 minutos",
    pt: "Avança sozinha, com audioguia · cerca de 7 minutos",
    en: "Plays on its own, with audio guide · about 7 minutes",
  },
  libre: { es: "Recorrer a mi ritmo", pt: "Percorrer no meu ritmo", en: "Explore at my own pace" },
  libreDesc: { es: "Vos elegís cuándo avanzar", pt: "Você escolhe quando avançar", en: "You choose when to move on" },
  idiomaEtiqueta: { es: "Idioma", pt: "Idioma", en: "Language" },
  // Audioguía
  audioguia: { es: "Audioguía", pt: "Audioguia", en: "Audio guide" },
  pausa: { es: "Pausa", pt: "Pausa", en: "Pause" },
  seguir: { es: "Seguir", pt: "Continuar", en: "Resume" },
  enPausa: { es: "En pausa", pt: "Em pausa", en: "Paused" },
  // Final y quiz
  finTitulo: { es: "¡Gracias por la visita!", pt: "Obrigado pela visita!", en: "Thanks for visiting!" },
  hacerQuiz: { es: "¿Cuánto aprendiste? Hacé el quiz", pt: "Quanto você aprendeu? Faça o quiz", en: "How much did you learn? Take the quiz" },
  volverEmpezar: { es: "Volver a empezar", pt: "Recomeçar", en: "Start again" },
  quiz: { es: "Quiz", pt: "Quiz", en: "Quiz" },
  pregunta: { es: "Pregunta", pt: "Pergunta", en: "Question" },
  correcto: { es: "¡Correcto!", pt: "Correto!", en: "Correct!" },
  incorrecto: { es: "No era esa…", pt: "Não era essa…", en: "Not quite…" },
  siguiente: { es: "Siguiente", pt: "Próxima", en: "Next" },
  resultado: { es: "Acertaste {n} de {total}", pt: "Você acertou {n} de {total}", en: "You got {n} out of {total}" },
  resultadoBien: { es: "¡Excelente! Ya sabés mucho de la catedral.", pt: "Excelente! Você já sabe muito sobre a catedral.", en: "Excellent! You know a lot about the cathedral." },
  resultadoMas: { es: "¡Bien! Hacé el recorrido otra vez para descubrir más.", pt: "Bom! Faça o percurso de novo para descobrir mais.", en: "Good! Take the tour again to discover more." },
  cerrar: { es: "Cerrar", pt: "Fechar", en: "Close" },
  // Línea de tiempo
  lineaTitulo: { es: "La historia de la catedral", pt: "A história da catedral", en: "The cathedral's story" },
  // Galería
  galeriaTitulo: { es: "Fotos de la catedral", pt: "Fotos da catedral", en: "Photos of the cathedral" },
  galeriaCuenta: { es: "{n} fotos reales · Wikimedia Commons, licencias libres", pt: "{n} fotos reais · Wikimedia Commons, licenças livres", en: "{n} real photos · Wikimedia Commons, free licenses" },
  creditosTitulo: { es: "Créditos y fuentes", pt: "Créditos e fontes", en: "Credits and sources" },
  creditosFichas: { es: "Fotos de las fichas (Wikimedia Commons, licencias libres):", pt: "Fotos das fichas (Wikimedia Commons, licenças livres):", en: "Card photos (Wikimedia Commons, free licenses):" },
  creditosGaleria: { es: "Fotos de la galería (Wikimedia Commons, licencias libres):", pt: "Fotos da galeria (Wikimedia Commons, licenças livres):", en: "Gallery photos (Wikimedia Commons, free licenses):" },
  creditosVoz: {
    es: "Audioguía: voz sintética de macOS (Paulina).",
    pt: "Audioguia: vozes sintéticas do macOS (Paulina, Luciana e Samantha).",
    en: "Audio guide: macOS synthetic voices (Paulina, Luciana and Samantha).",
  },
  creditosDatos: {
    es: "Datos: artículo «Catedral Metropolitana de Brasília» de Wikipedia en portugués.",
    pt: "Dados: artigo «Catedral Metropolitana de Brasília» da Wikipédia em português.",
    en: "Facts: «Catedral Metropolitana de Brasília» article, Portuguese Wikipedia.",
  },
  secciones: {
    exterior: { es: "Por fuera", pt: "Por fora", en: "Outside" },
    plaza: { es: "La plaza y los evangelistas", pt: "A praça e os evangelistas", en: "The square and the Evangelists" },
    interior: { es: "Por dentro", pt: "Por dentro", en: "Inside" },
    vitrales: { es: "Vitrales y cúpula", pt: "Vitrais e cúpula", en: "Stained glass and dome" },
    angeles: { es: "Los ángeles", pt: "Os anjos", en: "The angels" },
    arte: { es: "Arte y altar", pt: "Arte e altar", en: "Art and altar" },
    noche: { es: "De noche", pt: "À noite", en: "At night" },
    historia: { es: "La construcción (1958–1970)", pt: "A construção (1958–1970)", en: "Construction (1958–1970)" },
  },
};

export const formato = (texto, valores) => texto.replace(/\{(\w+)\}/g, (_, k) => valores[k]);

// Línea de tiempo (datos del artículo de Wikipedia en portugués). foto: id de la galería
export const LINEA = [
  {
    anio: "1958",
    foto: "obra-aerea",
    texto: {
      es: "12 de septiembre: se coloca la piedra fundamental de la catedral, proyectada por Oscar Niemeyer.",
      pt: "12 de setembro: é lançada a pedra fundamental da catedral, projetada por Oscar Niemeyer.",
      en: "September 12: the cornerstone of the cathedral, designed by Oscar Niemeyer, is laid.",
    },
  },
  {
    anio: "1960",
    foto: "obra-columnas",
    texto: {
      es: "Queda lista la estructura: 16 columnas de hormigón calculadas por Joaquim Cardozo. Es el mismo año en que se inaugura Brasília.",
      pt: "A estrutura fica pronta: 16 colunas de concreto calculadas por Joaquim Cardozo. É o mesmo ano da inauguração de Brasília.",
      en: "The structure is finished: 16 concrete columns engineered by Joaquim Cardozo. It is the same year Brasília is inaugurated.",
    },
  },
  {
    anio: "1970",
    foto: "evangelistas-camino",
    texto: {
      es: "31 de mayo: se inaugura la catedral, con vidrios incoloros. Los evangelistas y los ángeles de Alfredo Ceschiatti son de ese mismo año.",
      pt: "31 de maio: a catedral é inaugurada, com vidros incolores. Os evangelistas e os anjos de Alfredo Ceschiatti são desse mesmo ano.",
      en: "May 31: the cathedral opens, with clear glass. Alfredo Ceschiatti's Evangelists and angels date from that same year.",
    },
  },
  {
    anio: "1987",
    foto: "desde-lo-alto",
    texto: {
      es: "La UNESCO declara a Brasília Patrimonio de la Humanidad.",
      pt: "A UNESCO declara Brasília Patrimônio da Humanidade.",
      en: "UNESCO declares Brasília a World Heritage Site.",
    },
  },
  {
    anio: "1988",
    foto: "hiperboloide",
    texto: {
      es: "Oscar Niemeyer gana el Premio Pritzker, el más importante de la arquitectura.",
      pt: "Oscar Niemeyer ganha o Prêmio Pritzker, o mais importante da arquitetura.",
      en: "Oscar Niemeyer wins the Pritzker Prize, architecture's highest honor.",
    },
  },
  {
    anio: "1990",
    foto: "vitrales-nave",
    texto: {
      es: "Llegan los vitrales de color de Marianne Peretti: 2.000 m² en azul, verde, blanco y marrón.",
      pt: "Chegam os vitrais coloridos de Marianne Peretti: 2.000 m² em azul, verde, branco e marrom.",
      en: "Marianne Peretti's colored stained glass arrives: 2,000 m² in blue, green, white and brown.",
    },
  },
  {
    anio: "2012",
    foto: "nave-luz",
    texto: {
      es: "Comienza una renovación: los vitrales se cambian por vidrio cortado y montado en Brasil.",
      pt: "Começa uma reforma: os vitrais são trocados por vidro cortado e montado no Brasil.",
      en: "A renovation begins: the stained glass is replaced with glass cut and assembled in Brazil.",
    },
  },
];

// Quiz: la respuesta correcta es "ok" (índice de la opción)
export const QUIZ = [
  {
    pregunta: { es: "¿Quién diseñó la catedral?", pt: "Quem projetou a catedral?", en: "Who designed the cathedral?" },
    opciones: [
      { es: "Oscar Niemeyer", pt: "Oscar Niemeyer", en: "Oscar Niemeyer" },
      { es: "Le Corbusier", pt: "Le Corbusier", en: "Le Corbusier" },
      { es: "Antoni Gaudí", pt: "Antoni Gaudí", en: "Antoni Gaudí" },
    ],
    ok: 0,
  },
  {
    pregunta: { es: "¿Cuántas columnas forman la estructura?", pt: "Quantas colunas formam a estrutura?", en: "How many columns make up the structure?" },
    opciones: [{ es: "12" }, { es: "16" }, { es: "21" }],
    ok: 1,
  },
  {
    pregunta: { es: "¿Cómo se entra a la catedral?", pt: "Como se entra na catedral?", en: "How do you enter the cathedral?" },
    opciones: [
      { es: "Por una gran escalinata", pt: "Por uma grande escadaria", en: "Up a grand staircase" },
      { es: "Por un túnel bajo el espejo de agua", pt: "Por um túnel sob o espelho d'água", en: "Through a tunnel under the reflecting pool" },
      { es: "Por un puente", pt: "Por uma ponte", en: "Over a bridge" },
    ],
    ok: 1,
  },
  {
    pregunta: { es: "¿Cuánto mide el ángel más grande?", pt: "Quanto mede o maior anjo?", en: "How long is the largest angel?" },
    opciones: [{ es: "2,22 m", en: "2.22 m" }, { es: "4,25 m", en: "4.25 m" }, { es: "8 m" }],
    ok: 1,
  },
  {
    pregunta: { es: "¿En qué año se inauguró la catedral?", pt: "Em que ano a catedral foi inaugurada?", en: "In what year did the cathedral open?" },
    opciones: [{ es: "1960" }, { es: "1970" }, { es: "1988" }],
    ok: 1,
  },
];

// Títulos de las fotos de la galería en portugués e inglés: nombre → [pt, en]
export const TITULOS_GALERIA = {
  "desde-lo-alto": ["Vista do alto, com o lago Paranoá ao fundo", "View from above, with Lake Paranoá behind"],
  "con-campanario": ["A catedral e o campanário", "The cathedral and the bell tower"],
  corona: ["A coroa de colunas", "The crown of columns"],
  nubes: ["Sob um céu de nuvens", "Under a cloudy sky"],
  fachada: ["Chegando à catedral", "Arriving at the cathedral"],
  hiperboloide: ["Dezesseis colunas em hiperboloide", "Sixteen columns in a hyperboloid"],
  cruz: ["A cruz sobre o anel das colunas", "The cross above the ring of columns"],
  bases: ["As bases das colunas", "The column bases"],
  reflejo: ["Refletida no espelho d'água", "Reflected in the pool"],
  rampa: ["A rampa que desce ao túnel de entrada", "The ramp down to the entrance tunnel"],
  atardecer: ["Ao entardecer", "At dusk"],
  ipes: ["Com os ipês-amarelos em flor", "With the yellow ipê trees in bloom"],
  arboles: ["Do Eixo Monumental", "From the Monumental Axis"],
  "evangelistas-camino": ["Os evangelistas, a caminho da entrada", "The Evangelists, on the way in"],
  "evangelistas-fila": ["Os quatro evangelistas", "The four Evangelists"],
  "evangelistas-plaza": ["Os evangelistas na praça", "The Evangelists on the square"],
  evangelista: ["Um dos evangelistas de Ceschiatti", "One of Ceschiatti's Evangelists"],
  "evangelista-columnas": ["Evangelista diante das colunas", "An Evangelist before the columns"],
  siluetas: ["Silhuetas dos evangelistas", "Silhouettes of the Evangelists"],
  "campanario-alto": ["O campanário", "The bell tower"],
  campanas: ["Os quatro sinos", "The four bells"],
  bautisterio: ["O batistério, junto à catedral", "The baptistery, next to the cathedral"],
  "vitrales-altar": ["Os vitrais sobre o altar", "The stained glass above the altar"],
  "vitrales-nave": ["Vitrais azuis, verdes e brancos", "Blue, green and white stained glass"],
  "vitrales-angel": ["Vitrais e anjo", "Stained glass and angel"],
  vidrio: ["O vidro de perto", "The glass up close"],
  "cupula-centro": ["A cúpula vista do centro", "The dome from the center"],
  anillo: ["O anel central, visto de baixo", "The central ring, seen from below"],
  "cupula-azul": ["Olhando para cima", "Looking up"],
  "angeles-vuelo": ["Os anjos em voo", "The angels in flight"],
  "angeles-nave": ["Os anjos sobre a nave", "The angels above the nave"],
  "angel-cerca": ["Um anjo de perto", "An angel up close"],
  "nave-luz": ["A nave cheia de luz", "The nave full of light"],
  "nave-reflejo": ["O teto refletido no piso", "The ceiling reflected in the floor"],
  pasillo: ["O corredor central", "The central aisle"],
  "nave-bancos": ["Bancos sob os vitrais", "Pews under the stained glass"],
  "nave-2009": ["A nave", "The nave"],
  "nave-visitantes": ["Visitantes na nave", "Visitors in the nave"],
  "nave-daderot": ["Interior da catedral", "Inside the cathedral"],
  "altar-cruz": ["O altar e o crucifixo", "The altar and the crucifix"],
  "altar-frente": ["O altar visto de frente", "The altar seen from the front"],
  crucifijo: ["O crucifixo", "The crucifix"],
  capilla: ["Uma das capelas", "One of the chapels"],
  "capilla-altar": ["Altar da capela", "The chapel altar"],
  aparecida: ["Nossa Senhora Aparecida", "Our Lady Aparecida"],
  "obra-columnas": ["As colunas em construção", "The columns under construction"],
  "obra-cartel": ["A obra, com sua placa", "The building site, with its sign"],
  "obra-aerea": ["A obra vista de cima", "The building site from above"],
  "obra-grua": ["Montagem da estrutura", "Assembling the structure"],
  "obra-cubierta": ["Trabalhos na cobertura", "Work on the roof"],
  "obra-campana": ["A chegada de um sino", "A bell arriving"],
  "noche-ciudad": ["À noite, com o Museu Nacional", "At night, with the National Museum"],
  "noche-evangelistas": ["Os evangelistas à noite", "The Evangelists at night"],
  "noche-dorada": ["Iluminada à noite", "Lit up at night"],
  "noche-cielo": ["Sob o céu noturno", "Under the night sky"],
};
