import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { MapPlugin } from "@photo-sphere-viewer/map-plugin";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";

const deg = (d) => (d * Math.PI) / 180;
const rad2deg = (r) => Math.round((r * 180) / Math.PI);

// Arma el recorrido completo a partir de la configuración (ver tour.js) y la lista de salas.
// Usa los elementos de la página con ids: viewer, brand-name, brand-sub, demo-banner, hint, rooms, product.
export function iniciarTour(showroom, salas) {
  // Las conexiones se declaran una sola vez y valen en los dos sentidos.
  const vecinos = new Map(salas.map((s) => [s.id, new Set()]));
  for (const s of salas) {
    for (const otro of s.conecta || []) {
      vecinos.get(s.id).add(otro);
      vecinos.get(otro)?.add(s.id);
    }
  }
  const porId = new Map(salas.map((s) => [s.id, s]));

  // Dirección en el plano (0 = arriba, sentido horario), en radianes.
  function rumbo(a, b) {
    return Math.atan2(b.plano.x - a.plano.x, -(b.plano.y - a.plano.y));
  }

  const nodes = salas.map((s) => ({
    id: s.id,
    name: s.nombre,
    caption: `${showroom.nombre} · ${s.nombre}`,
    panorama: s.foto,
    thumbnail: s.miniatura,
    // Gira la foto para que "arriba del plano" sea siempre el mismo yaw en todas las salas;
    // así las flechas y la flecha del minimapa apuntan bien sin calcular nada a mano.
    // (en PSV un pan positivo lleva el centro de la foto a yaw negativo, por eso el signo)
    sphereCorrection: s.orientacion ? { pan: deg(-s.orientacion) } : undefined,
    map: { x: s.plano.x, y: s.plano.y },
    links: [...vecinos.get(s.id)].map((id) => ({
      nodeId: id,
      position: { yaw: rumbo(s, porId.get(id)), pitch: 0 },
    })),
    markers: (s.puntos || s.productos || []).map((p, i) => ({
      id: `${s.id}-producto-${i}`,
      position: { yaw: deg(p.yaw + (s.orientacion || 0)), pitch: deg(p.pitch) },
      html: '<span class="hotspot"></span>',
      size: { width: 34, height: 34 },
      anchor: "center center",
      tooltip: { content: p.nombre, position: "top center" },
      data: p,
    })),
  }));

  const viewer = new Viewer({
    container: "viewer",
    loadingTxt: "Cargando…",
    // Margen de zoom para el efecto de caminar (la sala nueva aparece un poco más lejos y se acerca)
    maxFov: 100,
    defaultZoomLvl: 25,
    // Permite copiar la imagen del canvas para la transición
    rendererParameters: { preserveDrawingBuffer: true },
    touchmoveTwoFingers: false,
    mousewheelCtrlKey: false,
    navbar: ["zoom", "move", "caption", "gyroscope", "map", "fullscreen"],
    lang: {
      zoom: "Zoom",
      zoomOut: "Alejar",
      zoomIn: "Acercar",
      moveUp: "Mirar arriba",
      moveDown: "Mirar abajo",
      moveLeft: "Mirar a la izquierda",
      moveRight: "Mirar a la derecha",
      fullscreen: "Pantalla completa",
      loadError: "No se pudo cargar la foto",
      map: "Plano",
      mapMaximize: "Agrandar",
      mapMinimize: "Achicar",
      mapReset: "Centrar",
      gyroscope: "Mover con el celular",
    },
    plugins: [
      MarkersPlugin,
      GyroscopePlugin,
      MapPlugin.withConfig({
        static: true,
        size: "220px",
        // En celular el plano arranca minimizado para no tapar la foto
        visibleOnLoad: window.innerWidth > 640,
        position: "bottom right",
        defaultZoom: 35,
        minimizeOnHotspotClick: false,
        spotStyle: { size: 14, color: "#ffffff", borderColor: "rgba(0,0,0,.35)", borderSize: 2 },
      }),
      VirtualTourPlugin.withConfig({
        positionMode: "manual",
        renderMode: "3d",
        preload: true,
        nodes,
        startNodeId: salas[0].id,
        map: {
          imageUrl: showroom.plano.imagen,
          size: { width: showroom.plano.ancho, height: showroom.plano.alto },
        },
        transitionOptions: { showLoader: false, speed: "25rpm", effect: "fade", rotation: true },
      }),
    ],
  });

  const markers = viewer.getPlugin(MarkersPlugin);
  const tour = viewer.getPlugin(VirtualTourPlugin);

  // ---------- Transición de caminar ----------
  // Al tocar una flecha: girar hacia el destino, congelar la imagen actual en un canvas encima,
  // cambiar la sala por debajo y animar las dos hacia adelante (la vieja se agranda y se
  // desvanece, la nueva se acerca). Los botones de salas y el plano siguen con fundido normal.
  const PASO = 750; // duración del "paso", en ms

  const canvasContainer = viewer.container.querySelector(".psv-canvas-container");
  const glCanvas = canvasContainer.querySelector("canvas");
  const paso = document.createElement("canvas");
  paso.className = "walk-overlay";
  canvasContainer.append(paso);

  function congelarImagen() {
    paso.width = glCanvas.width;
    paso.height = glCanvas.height;
    paso.getContext("2d").drawImage(glCanvas, 0, 0);
    paso.style.setProperty("--paso", `${PASO}ms`);
    paso.classList.remove("go");
    paso.classList.add("visible");
  }

  function avanzarImagen() {
    void paso.offsetWidth; // fuerza el estado inicial antes de animar
    paso.classList.add("go");
    setTimeout(() => paso.classList.remove("visible", "go"), PASO + 100);
  }

  function distanciaAngular(a, b) {
    const d = Math.abs(a - b) % (2 * Math.PI);
    return d > Math.PI ? 2 * Math.PI - d : d;
  }

  const irANodo = tour.setCurrentNode.bind(tour);
  let caminando = false;

  tour.setCurrentNode = async (nodeId, options, fromLink) => {
    if (!fromLink?.position || caminando) return irANodo(nodeId, options, fromLink);
    caminando = true;
    try {
      const zoom = viewer.getZoomLevel();
      const destino = { yaw: fromLink.position.yaw, pitch: 0 };

      // 1. Girar la cabeza hacia donde vamos (más rápido si el giro es chico)
      const actual = viewer.getPosition();
      const giro = distanciaAngular(actual.yaw, destino.yaw) + Math.abs(actual.pitch);
      if (giro > 0.05) {
        await viewer.animate({ ...destino, speed: 250 + giro * 260, easing: "inOutSine" });
      }

      // 2. Inclinarse hacia adelante (respuesta inmediata al click)
      await viewer.animate({ zoom: Math.min(100, zoom + 8), speed: 220, easing: "inQuad" });

      // 3. Dar el paso
      congelarImagen();
      const zoomInicial = Math.max(0, zoom - 22);
      const listo = await irANodo(
        nodeId,
        { effect: "none", rotation: false, showLoader: false, rotateTo: destino, zoomTo: zoomInicial },
        fromLink
      );
      // Esperar a que la foto nueva se dibuje (subirla a la GPU traba un instante) y recién ahí animar
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      avanzarImagen();
      viewer.animate({ zoom, speed: PASO + 150, easing: "outCubic" });
      return listo;
    } catch (e) {
      paso.classList.remove("visible", "go");
      throw e;
    } finally {
      caminando = false;
    }
  };

  // ---------- Interfaz ----------
  document.getElementById("brand-name").textContent = showroom.nombre;
  document.getElementById("brand-sub").textContent = showroom.subtitulo;
  document.title = showroom.nombre;
  document.getElementById("demo-banner").hidden = !showroom.fotosDeEjemplo;

  const roomsNav = document.getElementById("rooms");
  for (const s of salas) {
    const b = document.createElement("button");
    b.textContent = s.nombre;
    b.dataset.id = s.id;
    // Al saltar de sala se mira al frente (sin heredar si estabas mirando al techo)
    b.addEventListener("click", () =>
      tour.setCurrentNode(s.id, { rotateTo: { yaw: viewer.getPosition().yaw, pitch: 0 } })
    );
    roomsNav.append(b);
  }

  tour.addEventListener("node-changed", ({ node }) => {
    for (const b of roomsNav.children) b.classList.toggle("active", b.dataset.id === node.id);
    cerrarProducto();
  });

  const hint = document.getElementById("hint");
  viewer.addEventListener("position-updated", () => hint.classList.add("gone"), { once: true });
  setTimeout(() => hint.classList.add("gone"), 8000);

  // ---------- Ficha de producto ----------
  const panel = document.getElementById("product");
  const img = panel.querySelector(".product-img");
  const cta = panel.querySelector(".product-cta");
  const credito = panel.querySelector(".product-credit");

  function abrirProducto(p) {
    panel.querySelector(".product-name").textContent = p.nombre;
    panel.querySelector(".product-price").textContent = p.precio || "";
    panel.querySelector(".product-desc").textContent = p.descripcion || "";
    img.hidden = !p.imagen;
    if (p.imagen) img.src = p.imagen;
    credito.hidden = !p.credito;
    if (p.credito) {
      credito.textContent = `Foto: ${p.credito}`;
      credito.href = p.fuente || "#";
    }
    cta.hidden = !showroom.whatsapp;
    if (showroom.whatsapp) {
      const texto = `Hola! Vi "${p.nombre}" en el showroom virtual y quería consultar.`;
      cta.href = `https://wa.me/${showroom.whatsapp}?text=${encodeURIComponent(texto)}`;
    }
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  }

  function cerrarProducto() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  markers.addEventListener("select-marker", ({ marker }) => {
    if (marker.config.data?.nombre) abrirProducto(marker.config.data);
  });
  panel.querySelector(".product-close").addEventListener("click", cerrarProducto);
  document.addEventListener("keydown", (e) => e.key === "Escape" && cerrarProducto());

  // Ayuda para cargar productos: click en la foto → muestra yaw/pitch para copiar en tour.js.
  viewer.addEventListener("click", ({ data }) => {
    if (data.rightclick || data.marker) return;
    const node = tour.getCurrentNode();
    const corr = porId.get(node.id).orientacion || 0;
    console.log(`[${node.id}] yaw: ${rad2deg(data.yaw) - corr}, pitch: ${rad2deg(data.pitch)}`);
  });

  return { viewer, tour };
}
