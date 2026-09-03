/**
 * DesignPen In-App Standalone Script (v2.3.0)
 * Autonomous Visual Manipulation, Center Mezzeria Guides, Magnetic Snap,
 * Floating Typography, Component Deletion (Trash / Delete / Backspace) & Zero-Token Direct Disk Writer.
 * 
 * Features:
 *  1. Component Deletion & Hide:
 *     - Tasto 🗑️ sul box di selezione + scorciatoie tastiera Canc / Backspace
 *     - Rimozione fisica dall'HTML al salvataggio definitivo su disco
 *     - Pieno supporto ↶ Undo (Ctrl+Z) per ripristinare elementi cancellati per errore
 *     - Persistenza in LocalStorage per non vederli riapparire al reload
 *  2. Center Mezzeria Guides & Magnetic Smart Snap:
 *     - Linea verticale di mezzeria (50% X) con illuminazione Figma fucsia neon
 *     - Linea orizzontale di mezzeria (50% Y)
 *     - Snap magnetico automatico (scatto al centro entro 12px)
 *     - Toggle rapido sulla toolbar "✛ Mezzeria: ON/OFF"
 *  3. Floating Typography Bar:
 *     - Font Size Ingrandisci / Riduci (A- / A+ con badge pixel)
 *     - Grassetto (B) & Corsivo (I)
 *     - Cambio Famiglia Font (Sans, Mono, Serif, Display)
 *     - Palette Rapida Colori Testo
 *  4. LocalStorage Auto-Restore (Survives window close & restarts)
 *  5. Direct Disk Auto-Save (Via Micro-Bridge or Native File System API)
 *  6. Visual Resize Handles (Width & Height manipulation)
 *  7. Fluid Drag & Move (transform: translate)
 *  8. Inline Text Editing (Double-click)
 *  9. One-Click Finalize (Saves clean code & removes pen)
 */
(function () {
  if (window.__DESIGNPEN_LOADED__) return;
  window.__DESIGNPEN_LOADED__ = true;

  const BRIDGE_URL = "http://127.0.0.1:9876";
  const STORAGE_KEY = "designpen_active_layout";
  const SNAP_THRESHOLD = 12; // Pixel range for magnetic center snap

  // --- STATE ---
  let isActive = false;
  let showGuides = true;
  let isDragging = false;
  let isResizing = false;
  let resizeDir = "";
  let selectedElement = null;
  let dragTarget = null;
  let activeTypoTarget = null;
  let startMouseX = 0, startMouseY = 0;
  let startTranslateX = 0, startTranslateY = 0;
  let startWidth = 0, startHeight = 0;
  let historyStack = [];
  const modifiedElements = new Map();

  // --- UNIQUE SELECTOR GENERATOR ---
  function getUniqueSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el === document.body) return "body";
    let path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE && el !== document.body) {
      let selector = el.nodeName.toLowerCase();
      let sib = el, nth = 1;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() === selector) nth++;
      }
      selector += `:nth-of-type(${nth})`;
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  }

  // --- SHADOW DOM HOST CONTAINER ---
  const host = document.createElement("div");
  host.id = "designpen-root";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  // --- STYLES ---
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    
    .toolbar-wrapper {
      position: fixed;
      top: 18px;
      right: 24px;
      pointer-events: auto;
      user-select: none;
      z-index: 2147483647;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 7px;
      background: linear-gradient(180deg, rgba(28, 30, 38, 0.97), rgba(15, 17, 23, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 26px;
      padding: 7px 15px;
      box-shadow: 0 14px 35px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(14px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .grip {
      color: rgba(255, 255, 255, 0.35);
      font-size: 16px;
      cursor: grab;
      padding: 0 3px;
    }
    .grip:active { cursor: grabbing; }

    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 800;
      font-size: 13px;
      color: #ffffff;
      letter-spacing: 0.3px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #64748b;
      transition: background 0.3s ease, box-shadow 0.3s ease;
    }
    .status-dot.active {
      background: #00dfd8;
      box-shadow: 0 0 12px #00dfd8;
    }

    .chip {
      background: rgba(255, 255, 255, 0.06);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .chip.inspecting {
      background: rgba(13, 153, 255, 0.2);
      color: #60a5fa;
      border-color: #3b82f6;
      font-weight: bold;
    }

    .btn {
      border: none;
      outline: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 14px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .btn-pen {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.14);
    }
    .btn-pen:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }
    .btn-pen.active {
      background: linear-gradient(90deg, #0070f3, #00dfd8);
      color: #ffffff;
      font-weight: 800;
      border: 1px solid #38bdf8;
      box-shadow: 0 0 14px rgba(0, 223, 216, 0.4);
    }

    .btn-guides {
      background: rgba(225, 29, 72, 0.15);
      color: #f43f5e;
      border: 1px solid rgba(225, 29, 72, 0.3);
      font-size: 11px;
      padding: 6px 10px;
    }
    .btn-guides:hover {
      background: rgba(225, 29, 72, 0.3);
      color: #ffffff;
    }
    .btn-guides.active {
      background: #e11d48;
      color: #ffffff;
      border-color: #ff007f;
      box-shadow: 0 0 12px rgba(255, 0, 127, 0.4);
    }

    .btn-del {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      font-size: 11px;
      padding: 6px 9px;
    }
    .btn-del:hover {
      background: #ef4444;
      color: #ffffff;
      border-color: #f87171;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
    }

    .btn-undo {
      background: rgba(255, 255, 255, 0.07);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .btn-undo:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }
    .btn-undo.has-history {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.4);
    }

    .btn-save-disk {
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.45));
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.4);
      font-weight: bold;
    }
    .btn-save-disk:hover {
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.5), rgba(5, 150, 105, 0.6));
      color: #ffffff;
      box-shadow: 0 0 12px rgba(52, 211, 153, 0.3);
    }

    .btn-finalize {
      background: rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 11px;
    }
    .btn-finalize:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      border-color: rgba(239, 68, 68, 0.4);
    }

    /* OVERLAY HIGHLIGHT & RESIZE HANDLES */
    .highlight-box {
      position: fixed;
      pointer-events: none;
      border: 2px solid #0d99ff;
      background: rgba(13, 153, 255, 0.1);
      border-radius: 4px;
      z-index: 2147483640;
      display: none;
    }

    .resize-handle {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #ffffff;
      border: 2px solid #0d99ff;
      border-radius: 2px;
      pointer-events: auto;
      z-index: 2147483645;
    }
    .handle-se { right: -5px; bottom: -5px; cursor: se-resize; }
    .handle-e { right: -5px; top: calc(50% - 5px); cursor: e-resize; }
    .handle-s { bottom: -5px; left: calc(50% - 5px); cursor: s-resize; }

    .delete-btn-bubble {
      position: absolute;
      top: -12px;
      right: -12px;
      width: 24px;
      height: 24px;
      background: #ef4444;
      color: #ffffff;
      border: 2px solid #ffffff;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.55);
      pointer-events: auto;
      z-index: 2147483646;
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .delete-btn-bubble:hover {
      background: #dc2626;
      transform: scale(1.22);
    }

    /* CENTER GUIDES & MEZZERIA */
    .guide-line-v {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 1px;
      background: rgba(225, 29, 72, 0.45);
      pointer-events: none;
      z-index: 2147483638;
      display: none;
      transition: background 0.15s ease, box-shadow 0.15s ease, width 0.15s ease;
    }
    .guide-line-v.snapped {
      background: #ff007f;
      width: 2px;
      box-shadow: 0 0 12px #ff007f, 0 0 4px #ff007f;
    }

    .guide-line-h {
      position: fixed;
      left: 0;
      right: 0;
      top: 50%;
      height: 1px;
      background: rgba(225, 29, 72, 0.45);
      pointer-events: none;
      z-index: 2147483638;
      display: none;
      transition: background 0.15s ease, box-shadow 0.15s ease, height 0.15s ease;
    }
    .guide-line-h.snapped {
      background: #ff007f;
      height: 2px;
      box-shadow: 0 0 12px #ff007f, 0 0 4px #ff007f;
    }

    .center-badge {
      position: fixed;
      top: calc(50% + 8px);
      left: calc(50% + 8px);
      background: rgba(225, 29, 72, 0.95);
      color: #ffffff;
      border: 1px solid #ff007f;
      border-radius: 8px;
      padding: 2px 7px;
      font-size: 10px;
      font-weight: 800;
      pointer-events: none;
      z-index: 2147483639;
      display: none;
      box-shadow: 0 0 12px rgba(255, 0, 127, 0.6);
      white-space: nowrap;
    }

    /* FLOATING TYPOGRAPHY TOOLBAR */
    .typo-bar {
      position: fixed;
      display: none;
      align-items: center;
      gap: 6px;
      background: linear-gradient(180deg, rgba(24, 26, 34, 0.98), rgba(14, 16, 22, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 20px;
      padding: 6px 12px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(14px);
      z-index: 2147483646;
      pointer-events: auto;
      user-select: none;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .typo-btn {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 4px 9px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .typo-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
    }
    .typo-btn.active {
      background: #0d99ff;
      color: #ffffff;
      border-color: #38bdf8;
      box-shadow: 0 0 10px rgba(13, 153, 255, 0.5);
    }

    .typo-size-label {
      color: #38bdf8;
      font-size: 11px;
      font-weight: 700;
      min-width: 32px;
      text-align: center;
    }

    .typo-select {
      background: rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 3px 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
    }
    .typo-select option {
      background: #1e2028;
      color: #ffffff;
    }

    .typo-colors {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-left: 2px;
    }
    .color-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.35);
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .color-dot:hover {
      transform: scale(1.3);
      border-color: #ffffff;
    }
  `;
  shadow.appendChild(style);

  // --- CENTER GUIDES ELEMENTS ---
  const guideV = document.createElement("div");
  guideV.className = "guide-line-v";
  shadow.appendChild(guideV);

  const guideH = document.createElement("div");
  guideH.className = "guide-line-h";
  shadow.appendChild(guideH);

  const centerBadge = document.createElement("div");
  centerBadge.className = "center-badge";
  centerBadge.textContent = "🎯 50% CENTRO";
  shadow.appendChild(centerBadge);

  // --- HIGHLIGHT OVERLAY ---
  const highlightBox = document.createElement("div");
  highlightBox.className = "highlight-box";
  highlightBox.innerHTML = `
    <div class="resize-handle handle-se" data-dir="se"></div>
    <div class="resize-handle handle-e" data-dir="e"></div>
    <div class="resize-handle handle-s" data-dir="s"></div>
    <button class="delete-btn-bubble" id="dp-bubble-del" title="Elimina questo componente (Canc / Backspace)">🗑️</button>
  `;
  shadow.appendChild(highlightBox);

  // --- FLOATING TYPOGRAPHY TOOLBAR HTML ---
  const typoBar = document.createElement("div");
  typoBar.className = "typo-bar";
  typoBar.id = "dp-typo-bar";
  typoBar.innerHTML = `
    <button class="typo-btn" id="dp-tb-bold" title="Grassetto (Bold)">B</button>
    <button class="typo-btn" id="dp-tb-italic" title="Corsivo (Italic)" style="font-style: italic;">I</button>
    <span style="color: rgba(255,255,255,0.18);">|</span>
    <button class="typo-btn" id="dp-tb-size-down" title="Riduci dimensione">A-</button>
    <span class="typo-size-label" id="dp-tb-size-val">16px</span>
    <button class="typo-btn" id="dp-tb-size-up" title="Aumenta dimensione">A+</button>
    <span style="color: rgba(255,255,255,0.18);">|</span>
    <select class="typo-select" id="dp-tb-font" title="Cambia Famiglia Font">
      <option value="">Font Originale</option>
      <option value="'Inter', -apple-system, BlinkMacSystemFont, sans-serif">Modern Sans (Inter)</option>
      <option value="'JetBrains Mono', Consolas, monospace">Tech Mono (Code)</option>
      <option value="'Georgia', 'Times New Roman', serif">Classic Serif</option>
      <option value="Impact, fantasy">Bold Display</option>
      <option value="'Comic Sans MS', cursive">Casual Script</option>
    </select>
    <span style="color: rgba(255,255,255,0.18);">|</span>
    <div class="typo-colors">
      <span class="color-dot" data-color="#ffffff" style="background:#ffffff;" title="Bianco"></span>
      <span class="color-dot" data-color="#94a3b8" style="background:#94a3b8;" title="Grigio Slate"></span>
      <span class="color-dot" data-color="#38bdf8" style="background:#38bdf8;" title="Ciano"></span>
      <span class="color-dot" data-color="#34d399" style="background:#34d399;" title="Verde"></span>
      <span class="color-dot" data-color="#f87171" style="background:#f87171;" title="Rosso"></span>
      <span class="color-dot" data-color="#fbbf24" style="background:#fbbf24;" title="Giallo"></span>
    </div>
    <button class="typo-btn" id="dp-tb-close" style="margin-left: 2px; padding: 2px 7px; font-size: 10px;" title="Chiudi barra">✕</button>
  `;
  shadow.appendChild(typoBar);

  // --- MAIN TOOLBAR HTML ---
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar-wrapper";
  toolbar.innerHTML = `
    <div class="pill" id="dp-pill">
      <span class="grip" id="dp-grip" title="Trascina la barra">⠿</span>
      <div class="brand">
        <span class="status-dot" id="dp-dot"></span>
        <span>DesignPen</span>
      </div>
      <span class="chip" id="dp-chip">✦ Standby</span>
      <button class="btn btn-pen" id="dp-pen-btn">✎ Penna: OFF</button>
      <button class="btn btn-guides active" id="dp-guides-btn" title="Mostra/Nascondi linee di mezzeria e snap magnetico">✛ Mezzeria: ON</button>
      <button class="btn btn-del" id="dp-main-del-btn" title="Elimina l'elemento selezionato (Canc / Backspace)">🗑️</button>
      <button class="btn btn-undo" id="dp-undo-btn">↶ Undo</button>
      <button class="btn btn-save-disk" id="dp-save-btn" title="Scrive direttamente su index.html senza consumare token">💾 Salva su Disco</button>
      <button class="btn btn-finalize" id="dp-finalize-btn" title="Salva definitivo e rimuove la pennina">🚀 Salva e Togli</button>
    </div>
  `;
  shadow.appendChild(toolbar);

  // --- REFERENCES ---
  const grip = shadow.getElementById("dp-grip");
  const dot = shadow.getElementById("dp-dot");
  const chip = shadow.getElementById("dp-chip");
  const penBtn = shadow.getElementById("dp-pen-btn");
  const guidesBtn = shadow.getElementById("dp-guides-btn");
  const mainDelBtn = shadow.getElementById("dp-main-del-btn");
  const bubbleDelBtn = shadow.getElementById("dp-bubble-del");
  const undoBtn = shadow.getElementById("dp-undo-btn");
  const saveBtn = shadow.getElementById("dp-save-btn");
  const finalizeBtn = shadow.getElementById("dp-finalize-btn");

  // Typo bar elements
  const typoBold = shadow.getElementById("dp-tb-bold");
  const typoItalic = shadow.getElementById("dp-tb-italic");
  const typoSizeDown = shadow.getElementById("dp-tb-size-down");
  const typoSizeUp = shadow.getElementById("dp-tb-size-up");
  const typoSizeVal = shadow.getElementById("dp-tb-size-val");
  const typoFont = shadow.getElementById("dp-tb-font");
  const typoClose = shadow.getElementById("dp-tb-close");

  // --- 1. LOCALSTORAGE AUTO-RESTORE (Instant on page load) ---
  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      for (const [selector, mod] of Object.entries(data)) {
        const el = document.querySelector(selector);
        if (el) {
          if (mod.deleted) {
            el.style.display = "none";
          } else {
            if (mod.translate) el.style.transform = mod.translate;
            if (mod.width) el.style.width = mod.width;
            if (mod.height) el.style.height = mod.height;
            if (mod.fontSize) el.style.fontSize = mod.fontSize;
            if (mod.fontWeight) el.style.fontWeight = mod.fontWeight;
            if (mod.fontStyle) el.style.fontStyle = mod.fontStyle;
            if (mod.fontFamily) el.style.fontFamily = mod.fontFamily;
            if (mod.color) el.style.color = mod.color;
            if (mod.text !== undefined) el.innerText = mod.text;
          }
          modifiedElements.set(el, { selector, ...mod });
        }
      }
      console.log(`[DesignPen] ${modifiedElements.size} modifiche (inclusi elementi eliminati) ripristinate automaticamente dal LocalStorage!`);
    } catch (e) {
      console.warn("[DesignPen] Errore lettura LocalStorage:", e);
    }
  }

  function saveToLocalStorage() {
    try {
      const data = {};
      modifiedElements.forEach((val, el) => {
        data[val.selector] = {
          deleted: val.deleted || false,
          translate: el.style.transform || "",
          width: el.style.width || "",
          height: el.style.height || "",
          fontSize: el.style.fontSize || "",
          fontWeight: el.style.fontWeight || "",
          fontStyle: el.style.fontStyle || "",
          fontFamily: el.style.fontFamily || "",
          color: el.style.color || "",
          text: el.innerText
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("[DesignPen] Errore salvataggio LocalStorage:", e);
    }
  }

  // Load saved state immediately
  loadFromLocalStorage();

  // --- COMPONENT DELETION CONTROLLER ---
  function deleteElement(el) {
    if (!el || el === document.body || el === document.documentElement || host.contains(el)) return;

    const oldDisplay = el.style.display || "";
    el.style.display = "none";

    historyStack.push({
      element: el,
      oldDisplay: oldDisplay,
      type: "delete"
    });
    undoBtn.classList.add("has-history");
    undoBtn.textContent = `↶ Undo (${historyStack.length})`;

    const selector = getUniqueSelector(el);
    modifiedElements.set(el, {
      selector,
      deleted: true
    });

    saveToLocalStorage();

    highlightBox.style.display = "none";
    typoBar.style.display = "none";
    chip.textContent = `🗑️ Elemento eliminato (Ctrl+Z per annullare)`;
    chip.classList.add("inspecting");

    selectedElement = null;
    dragTarget = null;
    activeTypoTarget = null;
  }

  // Delete button on the selection bubble
  bubbleDelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (selectedElement) deleteElement(selectedElement);
  });

  // Delete button on the toolbar
  mainDelBtn.addEventListener("click", () => {
    if (selectedElement) {
      deleteElement(selectedElement);
    } else {
      chip.textContent = "⚠️ Seleziona prima un elemento da eliminare";
      setTimeout(() => { chip.textContent = "🎯 Seleziona testo, trascina o ridimensiona"; }, 1500);
    }
  });

  // Keyboard shortcut: Delete or Backspace to delete selected element
  window.addEventListener("keydown", (e) => {
    if (!isActive || !selectedElement) return;

    // Do not delete element if user is typing in an input field or contentEditable text
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.isContentEditable || activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteElement(selectedElement);
    }
  });

  // --- MEZZERIA GUIDES CONTROLLER ---
  function updateMezzeriaGuides(active) {
    if (active && showGuides) {
      guideV.style.display = "block";
      guideH.style.display = "block";
      centerBadge.style.display = "block";
    } else {
      guideV.style.display = "none";
      guideH.style.display = "none";
      centerBadge.style.display = "none";
      guideV.classList.remove("snapped");
      guideH.classList.remove("snapped");
    }
  }

  guidesBtn.addEventListener("click", () => {
    showGuides = !showGuides;
    if (showGuides) {
      guidesBtn.classList.add("active");
      guidesBtn.textContent = "✛ Mezzeria: ON";
      if (isActive) updateMezzeriaGuides(true);
    } else {
      guidesBtn.classList.remove("active");
      guidesBtn.textContent = "✛ Mezzeria: OFF";
      updateMezzeriaGuides(false);
    }
  });

  // --- SHOW / HIDE TYPOGRAPHY BAR ---
  function showTypographyBar(el) {
    if (!el || !isActive || el.style.display === "none") {
      typoBar.style.display = "none";
      activeTypoTarget = null;
      return;
    }

    const hasText = el.innerText && el.innerText.trim().length > 0;
    if (!hasText) {
      typoBar.style.display = "none";
      activeTypoTarget = null;
      return;
    }

    activeTypoTarget = el;
    const rect = el.getBoundingClientRect();
    const compStyle = window.getComputedStyle(el);

    const curSize = parseInt(compStyle.fontSize) || 16;
    typoSizeVal.textContent = `${curSize}px`;

    const isBold = compStyle.fontWeight === "bold" || parseInt(compStyle.fontWeight) >= 700;
    typoBold.classList.toggle("active", isBold);

    const isItalic = compStyle.fontStyle === "italic";
    typoItalic.classList.toggle("active", isItalic);

    typoBar.style.display = "flex";
    const barHeight = 42;
    let top = rect.top - barHeight - 10;
    if (top < 10) top = rect.bottom + 10;

    let left = rect.left + (rect.width / 2) - 210;
    if (left < 10) left = 10;
    if (left + 430 > window.innerWidth) left = window.innerWidth - 440;

    typoBar.style.top = `${Math.max(10, Math.round(top))}px`;
    typoBar.style.left = `${Math.max(10, Math.round(left))}px`;
  }

  function applyTypographyProperty(property, value) {
    if (!activeTypoTarget) return;

    const oldVal = activeTypoTarget.style[property] || "";
    activeTypoTarget.style[property] = value;

    historyStack.push({
      element: activeTypoTarget,
      property: property,
      oldVal: oldVal,
      newVal: value,
      type: "style"
    });
    undoBtn.classList.add("has-history");
    undoBtn.textContent = `↶ Undo (${historyStack.length})`;

    const selector = getUniqueSelector(activeTypoTarget);
    modifiedElements.set(activeTypoTarget, {
      selector,
      translate: activeTypoTarget.style.transform,
      width: activeTypoTarget.style.width,
      height: activeTypoTarget.style.height,
      fontSize: activeTypoTarget.style.fontSize,
      fontWeight: activeTypoTarget.style.fontWeight,
      fontStyle: activeTypoTarget.style.fontStyle,
      fontFamily: activeTypoTarget.style.fontFamily,
      color: activeTypoTarget.style.color,
      text: activeTypoTarget.innerText
    });

    saveToLocalStorage();
    updateHighlight(activeTypoTarget);
    showTypographyBar(activeTypoTarget);
  }

  // --- TYPOGRAPHY BAR LISTENERS ---
  typoBold.addEventListener("click", () => {
    if (!activeTypoTarget) return;
    const compStyle = window.getComputedStyle(activeTypoTarget);
    const isBold = compStyle.fontWeight === "bold" || parseInt(compStyle.fontWeight) >= 700;
    applyTypographyProperty("fontWeight", isBold ? "normal" : "bold");
  });

  typoItalic.addEventListener("click", () => {
    if (!activeTypoTarget) return;
    const compStyle = window.getComputedStyle(activeTypoTarget);
    const isItalic = compStyle.fontStyle === "italic";
    applyTypographyProperty("fontStyle", isItalic ? "normal" : "italic");
  });

  typoSizeDown.addEventListener("click", () => {
    if (!activeTypoTarget) return;
    const compStyle = window.getComputedStyle(activeTypoTarget);
    const curSize = parseInt(compStyle.fontSize) || 16;
    const newSize = Math.max(9, curSize - 2);
    applyTypographyProperty("fontSize", `${newSize}px`);
    typoSizeVal.textContent = `${newSize}px`;
  });

  typoSizeUp.addEventListener("click", () => {
    if (!activeTypoTarget) return;
    const compStyle = window.getComputedStyle(activeTypoTarget);
    const curSize = parseInt(compStyle.fontSize) || 16;
    const newSize = Math.min(96, curSize + 2);
    applyTypographyProperty("fontSize", `${newSize}px`);
    typoSizeVal.textContent = `${newSize}px`;
  });

  typoFont.addEventListener("change", (e) => {
    if (!activeTypoTarget) return;
    applyTypographyProperty("fontFamily", e.target.value);
  });

  shadow.querySelectorAll(".color-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      if (!activeTypoTarget) return;
      applyTypographyProperty("color", dot.dataset.color);
    });
  });

  typoClose.addEventListener("click", () => {
    typoBar.style.display = "none";
    activeTypoTarget = null;
  });

  // --- TOOLBAR DRAG ---
  let isToolbarDragging = false;
  let tbStartX = 0, tbStartY = 0;
  let tbStartLeft = 0, tbStartTop = 0;

  grip.addEventListener("mousedown", (e) => {
    isToolbarDragging = true;
    const rect = toolbar.getBoundingClientRect();
    tbStartX = e.clientX;
    tbStartY = e.clientY;
    tbStartLeft = rect.left;
    tbStartTop = rect.top;
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (isToolbarDragging) {
      toolbar.style.left = `${tbStartLeft + (e.clientX - tbStartX)}px`;
      toolbar.style.top = `${tbStartTop + (e.clientY - tbStartY)}px`;
      toolbar.style.right = "auto";
    }
  });

  window.addEventListener("mouseup", () => {
    isToolbarDragging = false;
  });

  // --- TOGGLE PEN MODE ---
  penBtn.addEventListener("click", () => {
    isActive = !isActive;
    if (isActive) {
      penBtn.classList.add("active");
      penBtn.textContent = "⚡ PENNA: ATTIVA";
      dot.classList.add("active");
      chip.textContent = "🎯 Seleziona testo, trascina o ridimensiona";
      document.body.style.cursor = "crosshair";
      updateMezzeriaGuides(true);
    } else {
      penBtn.classList.remove("active");
      penBtn.textContent = "✎ Penna: OFF";
      dot.classList.remove("active");
      chip.textContent = "✦ Standby";
      chip.classList.remove("inspecting");
      highlightBox.style.display = "none";
      typoBar.style.display = "none";
      updateMezzeriaGuides(false);
      document.body.style.cursor = "default";
      dragTarget = null;
      selectedElement = null;
      activeTypoTarget = null;
    }
  });

  function getTranslate(el) {
    const style = window.getComputedStyle(el);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return { x: matrix.m41, y: matrix.m42 };
  }

  function updateHighlight(el) {
    if (!el || !isActive || el.style.display === "none") {
      highlightBox.style.display = "none";
      return;
    }
    const rect = el.getBoundingClientRect();
    highlightBox.style.display = "block";
    highlightBox.style.top = `${rect.top}px`;
    highlightBox.style.left = `${rect.left}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
  }

  // --- RESIZE HANDLERS ---
  highlightBox.querySelectorAll(".resize-handle").forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      if (!selectedElement) return;
      isResizing = true;
      resizeDir = handle.dataset.dir;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startWidth = selectedElement.offsetWidth;
      startHeight = selectedElement.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // --- INTERACTION EVENT INTERCEPTOR ---
  window.addEventListener("mousemove", (e) => {
    if (!isActive) return;

    // Resizing
    if (isResizing && selectedElement) {
      e.preventDefault();
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;

      if (resizeDir.includes("e")) {
        const newW = Math.max(40, startWidth + dx);
        selectedElement.style.width = `${newW}px`;
      }
      if (resizeDir.includes("s")) {
        const newH = Math.max(30, startHeight + dy);
        selectedElement.style.height = `${newH}px`;
      }

      updateHighlight(selectedElement);
      showTypographyBar(selectedElement);
      const name = selectedElement.id || selectedElement.tagName.toLowerCase();
      chip.textContent = `📐 ${name} [${selectedElement.offsetWidth}×${selectedElement.offsetHeight}px]`;
      chip.classList.add("inspecting");
      return;
    }

    // Dragging with Magnetic Center Snap
    if (isDragging && dragTarget) {
      e.preventDefault();
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      let newX = startTranslateX + dx;
      let newY = startTranslateY + dy;

      dragTarget.style.transform = `translate(${newX}px, ${newY}px)`;
      dragTarget.style.transition = "none";

      const rect = dragTarget.getBoundingClientRect();
      const vpCenterX = window.innerWidth / 2;
      const vpCenterY = window.innerHeight / 2;
      const elCenterX = rect.left + rect.width / 2;
      const elCenterY = rect.top + rect.height / 2;

      let snappedX = false;
      let snappedY = false;

      if (Math.abs(elCenterX - vpCenterX) <= SNAP_THRESHOLD) {
        newX += (vpCenterX - elCenterX);
        dragTarget.style.transform = `translate(${newX}px, ${newY}px)`;
        snappedX = true;
        guideV.classList.add("snapped");
      } else {
        guideV.classList.remove("snapped");
      }

      if (Math.abs(elCenterY - vpCenterY) <= SNAP_THRESHOLD) {
        newY += (vpCenterY - elCenterY);
        dragTarget.style.transform = `translate(${newX}px, ${newY}px)`;
        snappedY = true;
        guideH.classList.add("snapped");
      } else {
        guideH.classList.remove("snapped");
      }

      updateHighlight(dragTarget);
      showTypographyBar(dragTarget);

      const name = dragTarget.id || dragTarget.tagName.toLowerCase();
      if (snappedX && snappedY) {
        chip.textContent = `🎯 ${name} [CENTRO ASSOLUTO 50%]`;
      } else if (snappedX) {
        chip.textContent = `🎯 ${name} [ALLINEATO AL CENTRO X]`;
      } else if (snappedY) {
        chip.textContent = `🎯 ${name} [ALLINEATO AL CENTRO Y]`;
      } else {
        chip.textContent = `📦 ${name} [X: ${Math.round(newX)}, Y: ${Math.round(newY)}]`;
      }
      chip.classList.add("inspecting");
      return;
    }

    // Hover highlight
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || host.contains(target) || target === document.body || target === document.documentElement) {
      if (!selectedElement) highlightBox.style.display = "none";
      return;
    }
    if (!selectedElement) updateHighlight(target);
  });

  // --- BLOCK NATIVE BUTTON CLICKS, LINKS & FORM SUBMITS IN PEN MODE ---
  function blockNativeClicks(e) {
    if (!isActive) return;
    // Allow clicks on DesignPen's own toolbar and widgets
    if (host.contains(e.target) || (e.composedPath && e.composedPath().includes(host))) {
      return;
    }
    // Neutralize website buttons, link navigations, modal triggers, and form submits
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }

  window.addEventListener("click", blockNativeClicks, { capture: true });
  window.addEventListener("auxclick", blockNativeClicks, { capture: true });
  window.addEventListener("submit", blockNativeClicks, { capture: true });

  window.addEventListener("mousedown", (e) => {
    if (!isActive || isResizing) return;
    if (host.contains(e.target) || (e.composedPath && e.composedPath().includes(host))) {
      return;
    }
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || host.contains(target) || target === document.body || target === document.documentElement) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    dragTarget = target;
    selectedElement = target;
    isDragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;

    const currentTrans = getTranslate(dragTarget);
    startTranslateX = currentTrans.x;
    startTranslateY = currentTrans.y;

    updateHighlight(dragTarget);
    showTypographyBar(dragTarget);
  }, { capture: true });

  window.addEventListener("mouseup", (e) => {
    guideV.classList.remove("snapped");
    guideH.classList.remove("snapped");

    if (isResizing) {
      isResizing = false;
      if (selectedElement) {
        const selector = getUniqueSelector(selectedElement);
        modifiedElements.set(selectedElement, {
          selector,
          translate: selectedElement.style.transform,
          width: selectedElement.style.width,
          height: selectedElement.style.height,
          fontSize: selectedElement.style.fontSize,
          fontWeight: selectedElement.style.fontWeight,
          fontStyle: selectedElement.style.fontStyle,
          fontFamily: selectedElement.style.fontFamily,
          color: selectedElement.style.color,
          text: selectedElement.innerText
        });
        saveToLocalStorage();
      }
      return;
    }

    if (!isActive || !isDragging || !dragTarget) return;

    const currentTrans = getTranslate(dragTarget);
    if (currentTrans.x !== startTranslateX || currentTrans.y !== startTranslateY) {
      historyStack.push({
        element: dragTarget,
        oldX: startTranslateX,
        oldY: startTranslateY,
        newX: currentTrans.x,
        newY: currentTrans.y,
        type: "move"
      });
      undoBtn.classList.add("has-history");
      undoBtn.textContent = `↶ Undo (${historyStack.length})`;

      const selector = getUniqueSelector(dragTarget);
      modifiedElements.set(dragTarget, {
        selector,
        translate: `translate(${Math.round(currentTrans.x)}px, ${Math.round(currentTrans.y)}px)`,
        width: dragTarget.style.width,
        height: dragTarget.style.height,
        fontSize: dragTarget.style.fontSize,
        fontWeight: dragTarget.style.fontWeight,
        fontStyle: dragTarget.style.fontStyle,
        fontFamily: dragTarget.style.fontFamily,
        color: dragTarget.style.color,
        text: dragTarget.innerText
      });
      saveToLocalStorage();
    }

    isDragging = false;
  }, { capture: true });

  // --- DOUBLE CLICK TEXT EDITING ---
  window.addEventListener("dblclick", (e) => {
    if (!isActive) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || host.contains(target)) return;

    e.preventDefault();
    e.stopPropagation();

    const oldText = target.innerText;
    target.contentEditable = "true";
    target.focus();
    chip.textContent = "✏️ Modifica testo in corso...";

    showTypographyBar(target);

    function onBlur() {
      target.contentEditable = "false";
      target.removeEventListener("blur", onBlur);
      target.removeEventListener("keydown", onKey);
      chip.textContent = "🎯 Seleziona o trascina un elemento";

      if (target.innerText !== oldText) {
        historyStack.push({
          element: target,
          oldText: oldText,
          newText: target.innerText,
          type: "text"
        });
        undoBtn.classList.add("has-history");
        undoBtn.textContent = `↶ Undo (${historyStack.length})`;

        const selector = getUniqueSelector(target);
        modifiedElements.set(target, {
          selector,
          translate: target.style.transform,
          width: target.style.width,
          height: target.style.height,
          fontSize: target.style.fontSize,
          fontWeight: target.style.fontWeight,
          fontStyle: target.style.fontStyle,
          fontFamily: target.style.fontFamily,
          color: target.style.color,
          text: target.innerText
        });
        saveToLocalStorage();
      }
    }

    function onKey(evt) {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        target.blur();
      } else if (evt.key === "Escape") {
        target.innerText = oldText;
        target.blur();
      }
    }

    target.addEventListener("blur", onBlur);
    target.addEventListener("keydown", onKey);
  }, { capture: true });

  // --- UNDO ---
  undoBtn.addEventListener("click", () => {
    if (historyStack.length === 0) return;
    const action = historyStack.pop();

    if (action.type === "move") {
      action.element.style.transform = `translate(${action.oldX}px, ${action.oldY}px)`;
      updateHighlight(action.element);
      showTypographyBar(action.element);
    } else if (action.type === "text") {
      action.element.innerText = action.oldText;
    } else if (action.type === "style") {
      action.element.style[action.property] = action.oldVal;
      showTypographyBar(action.element);
    } else if (action.type === "delete") {
      action.element.style.display = action.oldDisplay;
      const selector = getUniqueSelector(action.element);
      const mod = modifiedElements.get(action.element);
      if (mod) mod.deleted = false;
      saveToLocalStorage();
      updateHighlight(action.element);
      chip.textContent = "✓ Elemento ripristinato";
    }

    saveToLocalStorage();
    if (historyStack.length > 0) {
      undoBtn.textContent = `↶ Undo (${historyStack.length})`;
    } else {
      undoBtn.classList.remove("has-history");
      undoBtn.textContent = "↶ Undo";
    }
  });

  // --- 2. ZERO-TOKEN DIRECT DISK WRITE ---
  async function saveDirectToDisk(removeScriptAfter = false) {
    saveBtn.textContent = "⏳ Salvataggio...";

    const docClone = document.documentElement.cloneNode(true);
    const rootInClone = docClone.querySelector("#designpen-root");
    if (rootInClone) rootInClone.remove();

    // Physically remove deleted elements from final output!
    modifiedElements.forEach((val) => {
      if (val.deleted && val.selector) {
        const toDelete = docClone.querySelector(val.selector);
        if (toDelete) toDelete.remove();
      }
    });

    if (removeScriptAfter) {
      const scripts = docClone.querySelectorAll("script");
      scripts.forEach((s) => {
        if (s.src && s.src.includes("designpen.js")) s.remove();
      });
    }

    const cleanHtml = "<!DOCTYPE html>\n" + docClone.outerHTML;

    try {
      const res = await fetch(`${BRIDGE_URL}/apply_layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_file: "index.html",
          full_html: cleanHtml,
          remove_script: removeScriptAfter
        })
      });

      if (res.ok) {
        const data = await res.json();
        saveBtn.textContent = "✓ Scritto su Disco!";
        chip.textContent = "💾 File index.html aggiornato sul disco!";
        chip.classList.add("inspecting");
        setTimeout(() => { saveBtn.textContent = "💾 Salva su Disco"; }, 2000);

        if (removeScriptAfter) {
          host.remove();
          alert("🎉 DesignPen: Layout salvato su disco e pennina rimossa con successo!");
        }
        return;
      }
    } catch (err) {
      console.log("[DesignPen] Micro-bridge non rilevato, uso fallback File System API.");
    }

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: "index.html",
          types: [{ description: "HTML File", accept: { "text/html": [".html"] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(cleanHtml);
        await writable.close();

        saveBtn.textContent = "✓ Sovrascritto!";
        setTimeout(() => { saveBtn.textContent = "💾 Salva su Disco"; }, 2000);
        return;
      } catch (e) {
        console.log("[DesignPen] File picker annullato.");
      }
    }

    const blob = new Blob([cleanHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);

    saveBtn.textContent = "✓ Scaricato!";
    setTimeout(() => { saveBtn.textContent = "💾 Salva su Disco"; }, 2000);
  }

  saveBtn.addEventListener("click", () => saveDirectToDisk(false));
  finalizeBtn.addEventListener("click", () => {
    if (confirm("Vuoi salvare definitivamente il nuovo layout su disco e rimuovere la pennina?")) {
      saveDirectToDisk(true);
    }
  });

  console.log("🖊️ DesignPen v2.3 (Component Deletion, Center Mezzeria & Typography) caricato con successo!");
})();
