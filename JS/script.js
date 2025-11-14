/* ============================================================
   script.js — Portafolio Revista 3D (FINAL ESTABLE)
   ============================================================ */

/* CONFIG */
let currentPage = 0;
let isEditing = false;
let layout = {};

const totalPages = (typeof paginas !== "undefined") ? paginas.length : 0;

/* ============================================================
   1. DETECTAR ?edit=true
   ============================================================ */
function isEditAllowedByUrl() {
  try {
    return new URLSearchParams(window.location.search).get("edit") === "true";
  } catch {
    return false;
  }
}

/* ============================================================
   2. CREAR CADA PÁGINA
   ============================================================ */
function buildPages() {
  const book = document.getElementById("magazine");
  book.innerHTML = "";

  paginas.forEach((p, index) => {
    const page = document.createElement("div");
    page.className = "page";
    page.id = `page${index}`;
    page.style.zIndex = 1000 - index;

    const content = document.createElement("div");
    content.className = "page-content";

    /* Imagen */
    const imgBox = document.createElement("div");
    imgBox.className = "image-box";
    imgBox.dataset.key = "image";

    const img = document.createElement("img");
    img.src = p.imagen;
    img.alt = p.titulo || "";
    imgBox.appendChild(img);

    const imgHandle = document.createElement("div");
    imgHandle.className = "resize-handle";
    imgHandle.innerText = "↘";
    imgBox.appendChild(imgHandle);

    /* Cajas de texto */
    const title = createTextBox("title", "title-box", p.titulo, "20px", "65%");
    const subtitle = createTextBox("subtitle", "subtitle-box", p.subtitulo, "20px", "77%");
    const text = createTextBox("text", "text-box", p.texto, "20px", "88%");

    content.appendChild(imgBox);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(text);

    page.appendChild(content);
    book.appendChild(page);
  });
}

/* Crear caja de texto */
function createTextBox(key, cls, text, left, top) {
  const box = document.createElement("div");
  box.className = `box ${cls}`;
  box.dataset.key = key;
  box.innerText = text || "";
  box.style.left = left;
  box.style.top = top;

  const handle = document.createElement("div");
  handle.className = "resize-handle";
  handle.innerText = "↘";
  box.appendChild(handle);

  return box;
}

/* ============================================================
   3. APLICAR LAYOUT
   ============================================================ */
function applyLayout(obj) {
  if (!obj) return;
  layout = obj;

  for (const pid in obj) {
    for (const key in obj[pid]) {
      const el = document.querySelector(`#${pid} [data-key="${key}"]`);
      if (!el) continue;
      const conf = obj[pid][key];

      if (conf.left) el.style.left = conf.left;
      if (conf.top) el.style.top = conf.top;
      if (conf.width) el.style.width = conf.width;
      if (conf.height) el.style.height = conf.height;
    }
  }
}

/* ============================================================
   4. GUARDAR LAYOUT
   ============================================================ */
function collectLayout() {
  const out = {};

  paginas.forEach((_, i) => {
    const pid = `page${i}`;
    const page = document.getElementById(pid);

    out[pid] = {};

    page.querySelectorAll("[data-key]").forEach(el => {
      out[pid][el.dataset.key] = {
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height
      };
    });
  });

  return out;
}

function saveLayout() {
  const layout = collectLayout();
  localStorage.setItem("layoutJSON", JSON.stringify(layout));
  alert("✔ Cambios guardados exitosamente");
}

/* ============================================================
   5. EXPORTAR / IMPORTAR JSON
   ============================================================ */
function exportLayout() {
  const data = collectLayout();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "layout.json";
  a.click();

  URL.revokeObjectURL(url);
  alert("✔ Layout exportado");
}

/* Import */
(function () {
  const input = document.getElementById("importFile");
  if (!input) return;

  input.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const conf = JSON.parse(reader.result);
        applyLayout(conf);
        localStorage.setItem("layoutJSON", JSON.stringify(conf));
        alert("✔ Layout importado");
      } catch {
        alert("JSON inválido");
      }
    };
    reader.readAsText(file);
  });
})();

/* ============================================================
   6. DRAG & DROP con INERCIA SUAVE
   ============================================================ */
function makeElementDraggable(el) {
  if (el._draggable) return;
  el._draggable = true;

  let active = false, startX, startY, startL, startT, boxRect;

  el.addEventListener("pointerdown", e => {
    if (!isEditing) return;

    active = true;
    el.classList.add("grabbing");

    const page = el.closest(".page-content");
    boxRect = page.getBoundingClientRect();

    const rect = el.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startL = rect.left - boxRect.left;
    startT = rect.top - boxRect.top;

    e.preventDefault();
  });

  window.addEventListener("pointermove", e => {
    if (!active || !isEditing) return;

    let L = startL + (e.clientX - startX);
    let T = startT + (e.clientY - startY);

    L = Math.max(0, Math.min(L, boxRect.width - el.offsetWidth));
    T = Math.max(0, Math.min(T, boxRect.height - el.offsetHeight));

    el.style.left = L + "px";
    el.style.top = T + "px";
  });

  window.addEventListener("pointerup", () => {
    active = false;
    el.classList.remove("grabbing");
  });
}

/* ============================================================
   7. RESIZE
   ============================================================ */
function makeResizable(box) {
  const handle = box.querySelector(".resize-handle");
  if (!handle || handle._resizable) return;
  handle._resizable = true;

  let active = false, startX, startY, startW, startH;

  handle.addEventListener("pointerdown", e => {
    if (!isEditing) return;

    active = true;

    const rect = box.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startW = rect.width;
    startH = rect.height;

    e.preventDefault();
  });

  window.addEventListener("pointermove", e => {
    if (!active || !isEditing) return;

    let w = startW + (e.clientX - startX);
    let h = startH + (e.clientY - startY);

    w = Math.max(60, w);
    h = Math.max(40, h);

    box.style.width = w + "px";
    box.style.height = h + "px";
  });

  window.addEventListener("pointerup", () => {
    active = false;
  });
}

/* Activa drag/resize en todos los elementos */
function enableDragAndResizeForAll() {
  document.querySelectorAll(".box, .image-box").forEach(el => {
    makeElementDraggable(el);
    makeResizable(el);
  });
}

/* ============================================================
   8. REVISTA 3D - Mostrar página
   ============================================================ */
function showPage(n) {
  currentPage = n;

  paginas.forEach((_, i) => {
    const page = document.getElementById(`page${i}`);
    if (!page) return;

    if (i < n) page.classList.add("flipped");
    else page.classList.remove("flipped");
  });

  const s = document.getElementById("flipSound");
  if (s) { s.currentTime = 0; s.play().catch(() => {}); }
}

function nextPage() {
  if (currentPage < totalPages - 1) showPage(currentPage + 1);
}

function prevPage() {
  if (currentPage > 0) showPage(currentPage - 1);
}

/* ============================================================
   9. PDF
   ============================================================ */
function descargarPDF() {
  if (isEditing) toggleEditMode(false);

  const el = document.getElementById("portafolioPDF");
  if (!el) return alert("No hay contenido para PDF");

  html2pdf().set({
    margin: 0,
    filename: "Portafolio.pdf",
    html2canvas: { scale: 2 }
  }).from(el).save();
}

/* ============================================================
   10. MODO EDICIÓN
   ============================================================ */
function toggleEditMode(on) {
  isEditing = on;

  document.querySelectorAll(".box, .image-box")
    .forEach(el => el.classList.toggle("editable-outline", isEditing));

  document.getElementById("btnSave").style.display = isEditing ? "inline-flex" : "none";
  document.getElementById("btnExport").style.display = isEditing ? "inline-flex" : "none";
  document.getElementById("btnImport").style.display = isEditing ? "inline-flex" : "none";

  if (isEditing) enableDragAndResizeForAll();
}

/* ============================================================
   11. INIT
   ============================================================ */
function initializeApp() {
  buildPages();

  setTimeout(() => {
    const saved = localStorage.getItem("layoutJSON");
    if (saved) applyLayout(JSON.parse(saved));

    if (isEditAllowedByUrl()) {
      toggleEditMode(true);
    } else {
      document.getElementById("editorToggle").style.display = "none";
    }

    showPage(0);
  }, 200);
}

window.addEventListener("DOMContentLoaded", initializeApp);