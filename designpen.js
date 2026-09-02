/**
 * DesignPen In-App Standalone Script (v2.0.0)
 * Autonomous Visual Manipulation & Zero-Token Direct Disk Writer.
 * Features:
 *  1. LocalStorage Auto-Restore (Survives window close & restarts)
 *  2. Direct Disk Auto-Save (Via Micro-Bridge or Native File System API)
 *  3. Visual Resize Handles (Width & Height manipulation)
 *  4. Fluid Drag & Move (transform: translate)
 *  5. Inline Text Editing (Double-click)
 *  6. One-Click Finalize (Saves clean code & removes pen)
 */
(function () {
  if (window.__DESIGNPEN_LOADED__) return;
  window.__DESIGNPEN_LOADED__ = true;

  const BRIDGE_URL = "http://127.0.0.1:9876";
  const STORAGE_KEY = "designpen_active_layout";

  // --- STATE ---
  let isActive = false;
  let isDragging = false;
  let isResizing = false;
  let resizeDir = "";
  let selectedElement = null;
  let dragTarget = null;
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
      gap: 10px;
      background: linear-gradient(180deg, rgba(28, 30, 38, 0.97), rgba(15, 17, 23, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 26px;
      padding: 7px 16px;
      box-shadow: 0 14px 35px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(14px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .grip {
      color: rgba(255, 255, 255, 0.35);
      font-size: 16px;
      cursor: grab;
      padding: 0 4px;
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
      padding: 4px 11px;
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
      padding: 6px 14px;
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
  `;
  shadow.appendChild(style);

  // --- HIGHLIGHT OVERLAY ---
  const highlightBox = document.createElement("div");
  highlightBox.className = "highlight-box";
  highlightBox.innerHTML = `
    <div class="resize-handle handle-se" data-dir="se"></div>
    <div class="resize-handle handle-e" data-dir="e"></div>
    <div class="resize-handle handle-s" data-dir="s"></div>
  `;
  shadow.appendChild(highlightBox);

  // --- TOOLBAR HTML ---
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
  const undoBtn = shadow.getElementById("dp-undo-btn");
  const saveBtn = shadow.getElementById("dp-save-btn");
  const finalizeBtn = shadow.getElementById("dp-finalize-btn");

  // --- 1. LOCALSTORAGE AUTO-RESTORE (Instant on page load) ---
  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      for (const [selector, mod] of Object.entries(data)) {
        const el = document.querySelector(selector);
        if (el) {
          if (mod.translate) el.style.transform = mod.translate;
          if (mod.width) el.style.width = mod.width;
          if (mod.height) el.style.height = mod.height;
          if (mod.text !== undefined) el.innerText = mod.text;
          modifiedElements.set(el, { selector, ...mod });
        }
      }
      console.log(`[DesignPen] ${modifiedElements.size} modifiche ripristinate automaticamente dal LocalStorage!`);
    } catch (e) {
      console.warn("[DesignPen] Errore lettura LocalStorage:", e);
    }
  }

  function saveToLocalStorage() {
    try {
      const data = {};
      modifiedElements.forEach((val, el) => {
        data[val.selector] = {
          translate: el.style.transform || "",
          width: el.style.width || "",
          height: el.style.height || "",
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
      chip.textContent = "🎯 Seleziona, trascina o ridimensiona";
      document.body.style.cursor = "crosshair";
    } else {
      penBtn.classList.remove("active");
      penBtn.textContent = "✎ Penna: OFF";
      dot.classList.remove("active");
      chip.textContent = "✦ Standby";
      chip.classList.remove("inspecting");
      highlightBox.style.display = "none";
      document.body.style.cursor = "default";
      dragTarget = null;
      selectedElement = null;
    }
  });

  function getTranslate(el) {
    const style = window.getComputedStyle(el);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return { x: matrix.m41, y: matrix.m42 };
  }

  function updateHighlight(el) {
    if (!el || !isActive) {
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
      const name = selectedElement.id || selectedElement.tagName.toLowerCase();
      chip.textContent = `📐 ${name} [${selectedElement.offsetWidth}×${selectedElement.offsetHeight}px]`;
      chip.classList.add("inspecting");
      return;
    }

    // Dragging
    if (isDragging && dragTarget) {
      e.preventDefault();
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      const newX = startTranslateX + dx;
      const newY = startTranslateY + dy;

      dragTarget.style.transform = `translate(${newX}px, ${newY}px)`;
      dragTarget.style.transition = "none";
      updateHighlight(dragTarget);

      const name = dragTarget.id || dragTarget.tagName.toLowerCase();
      chip.textContent = `📦 ${name} [X: ${Math.round(newX)}, Y: ${Math.round(newY)}]`;
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

  window.addEventListener("mousedown", (e) => {
    if (!isActive || isResizing) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || host.contains(target) || target === document.body || target === document.documentElement) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    dragTarget = target;
    selectedElement = target;
    isDragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;

    const currentTrans = getTranslate(dragTarget);
    startTranslateX = currentTrans.x;
    startTranslateY = currentTrans.y;

    updateHighlight(dragTarget);
  }, { capture: true });

  window.addEventListener("mouseup", (e) => {
    if (isResizing) {
      isResizing = false;
      if (selectedElement) {
        const selector = getUniqueSelector(selectedElement);
        modifiedElements.set(selectedElement, {
          selector,
          translate: selectedElement.style.transform,
          width: selectedElement.style.width,
          height: selectedElement.style.height,
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
    } else if (action.type === "text") {
      action.element.innerText = action.oldText;
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

    // 1. Prepare clean clone of current DOM (without DesignPen elements)
    const docClone = document.documentElement.cloneNode(true);
    const rootInClone = docClone.querySelector("#designpen-root");
    if (rootInClone) rootInClone.remove();

    if (removeScriptAfter) {
      const scripts = docClone.querySelectorAll("script");
      scripts.forEach((s) => {
        if (s.src && s.src.includes("designpen.js")) s.remove();
      });
    }

    const cleanHtml = "<!DOCTYPE html>\n" + docClone.outerHTML;

    // 2. Try sending directly to DesignPen Local Micro-Bridge
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

    // 3. Fallback: Native Browser File System Access API (Edge / Chrome)
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

    // 4. Ultimate Fallback: Instant Direct Download
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

  console.log("🖊️ DesignPen v2.0 (Zero-Token Auto-Save) caricato con successo!");
})();
