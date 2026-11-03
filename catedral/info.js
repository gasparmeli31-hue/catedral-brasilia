// Textos y fotos reales de cada punto de información, compartidos por el recorrido
// con video real (index.html) y el recorrido 360° recreado (360.html).
// Fuente de los datos: «Catedral Metropolitana de Brasília», Wikipedia en portugués.
// Fotos: Wikimedia Commons, licencias libres.

const commons = (archivo) => `https://commons.wikimedia.org/wiki/File:${archivo}`;

export const INFO = {
  catedral: {
    nombre: "Catedral Metropolitana Nossa Senhora Aparecida",
    descripcion:
      "Obra de Oscar Niemeyer, con cálculo estructural del ingeniero Joaquim Cardozo. La piedra fundamental se colocó el 12 de septiembre de 1958, la estructura quedó lista en 1960 y fue inaugurada el 31 de mayo de 1970. A veces se la considera la obra maestra de Niemeyer, que en 1988 ganó el Premio Pritzker. Desde afuera, casi todo lo que se ve es el techo: la mayor parte del edificio está bajo tierra.",
    imagen: "fotos/exterior.jpg",
    credito: "Agência Brasília · CC BY 2.0",
    fuente: commons("Catedral_Metropolitana_de_Brasília_(16425039893).jpg"),
  },
  evangelistas: {
    nombre: "Los cuatro evangelistas",
    descripcion:
      "Cuatro esculturas de bronce de 3 metros de altura que representan a los evangelistas. Son de Alfredo Ceschiatti, con la colaboración de Dante Croce, de 1970. Reciben a los visitantes en la plaza de acceso.",
    imagen: "fotos/evangelistas.jpg",
    credito: "Daderot · CC0",
    fuente: commons("Catedral_de_Brasília_-_DSC00233.JPG"),
  },
  campanario: {
    nombre: "Campanario",
    descripcion:
      "Torre de 20 metros que sostiene cuatro grandes campanas, donadas por residentes españoles en Brasil y traídas de Miranda de Ebro (España).",
    imagen: "fotos/campanario.jpg",
    credito: "Fwsbsb · CC BY-SA 4.0",
    fuente: commons("Campanário_da_Catedral_Metropolitana_de_Brasília_1.jpg"),
  },
  tunel: {
    nombre: "De la oscuridad a la luz",
    descripcion:
      "Se entra a la catedral por un túnel oscuro que pasa por debajo del espejo de agua, y se sale a una nave llena de luz bajo un techo de vidrio. El espejo de agua que rodea el edificio mide 12 metros de ancho y 40 cm de profundidad, y ayuda a refrescar el interior.",
  },
  vitrales: {
    nombre: "Vitrales de Marianne Peretti",
    descripcion:
      "2.000 m² de vitrales en tonos de azul, verde, blanco y marrón, creados originalmente por Marianne Peretti en 1990. Reemplazaron los vidrios incoloros de 1970. En la renovación iniciada en 2012 se cambiaron por vidrio uniforme cortado y montado en Brasil.",
    imagen: "fotos/vitrales.jpg",
    credito: "NayaraRN · CC BY-SA 4.0",
    fuente: commons("Vitrais_da_Catedral_Metropolitana_de_Brasília.jpg"),
  },
  nave: {
    nombre: "La nave",
    descripcion:
      "La nave está unos 3 metros por debajo del nivel de la plaza. El interior está revestido con 500 toneladas de mármol. El Vía Crucis es obra de Di Cavalcanti.",
    imagen: "fotos/nave.jpg",
    credito: "Vânia Mareco · CC BY-SA 4.0",
    fuente: commons("Catedral_Moderna.JPG"),
  },
  angeles: {
    nombre: "Los tres ángeles",
    descripcion:
      "Esculturas de Alfredo Ceschiatti, con la colaboración de Dante Croce (1970), colgadas de cables de acero sobre la nave. El más chico mide 2,22 m y pesa 100 kg; el mediano, 3,4 m y 200 kg; el más grande, 4,25 m y 300 kg.",
    imagen: "fotos/angeles.jpg",
    credito: "Guilherme Rocha · CC BY-SA 4.0",
    fuente: commons("Os_Anjos,_estátuas_suspensas_da_Catedral_de_Brasilia.jpg"),
  },
  columnas: {
    nombre: "16 columnas hacia el cielo",
    descripcion:
      "Dieciséis columnas de hormigón de 90 toneladas cada una forman un hiperboloide; se dice que representan dos manos que se elevan al cielo. Niemeyer había proyectado 21, y Joaquim Cardozo las redujo a 16 con bases finas que apenas tocan el suelo. Arriba, un anillo de hormigón de unos 6,8 m de diámetro absorbe la compresión; abajo, otro anillo de 60 m funciona como tensor.",
    imagen: "fotos/cupula.jpg",
    credito: "Vânia Mareco · CC BY-SA 4.0",
    fuente: commons("Interior_da_Catedral.JPG"),
  },
  altar: {
    nombre: "El altar",
    descripcion:
      "El altar fue donado por el papa Pablo VI. Debajo del altar principal hay una pequeña capilla, a la que se accede por cada lado.",
    imagen: "fotos/altar.jpg",
    credito: "Cayambe · CC BY-SA 3.0",
    fuente: commons("Brasilia_Cathedral_Altar.jpg"),
  },
  aparecida: {
    nombre: "Nuestra Señora Aparecida",
    descripcion:
      "La catedral está dedicada a Nuestra Señora Aparecida, patrona de Brasil. Su imagen es una réplica de la original que se encuentra en Aparecida, São Paulo.",
  },
  bases: {
    nombre: "Columnas que apenas tocan el suelo",
    descripcion:
      "El cálculo de Joaquim Cardozo permitió que las bases de las columnas fueran delgadas, apenas apoyadas en el suelo, y se ensancharan al subir. También calculó el efecto del viento sobre vitrales y columnas, algo avanzado para la época.",
  },
  bautisterio: {
    nombre: "El bautisterio",
    descripcion:
      "Edificio ovalado, separado de la catedral, junto a la plaza de acceso. Sus azulejos son obra de Athos Bulcão, uno de los artistas que más marcaron Brasília.",
    imagen: "galeria/bautisterio.jpg",
    credito: "Agência Brasília · CC BY 2.0",
    fuente: commons("11_01_2024_-_-TBT_um_templo_de_fé,_arte_e_história_(53457489185).jpg"),
  },
  pinturas: {
    nombre: "Arte en la nave",
    descripcion:
      "Además de los vitrales y los ángeles, la catedral reúne obras de grandes artistas brasileños: el Camino de la Cruz (Vía Crucis) es de Emiliano Di Cavalcanti, y Athos Bulcão pintó el pilar de la entrada con escenas de la vida de María y los azulejos del bautisterio.",
  },
};

// Cada ficha conoce su clave, para sumarle las fotos de la galería con el mismo tema
for (const [clave, info] of Object.entries(INFO)) info.clave = clave;
