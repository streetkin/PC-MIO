/**
 * DesignPen In-App Standalone Script (v1.0.0)
 * Drop-in visual manipulation toolbar for web/desktop-web interfaces (PC MIO, Tailwind apps, etc.)
 * Uses Shadow DOM for total style encapsulation.
 */
(function () {
  if (window.__DESIGNPEN_LOADED__) return;
  window.__DESIGNPEN_LOADED__ = true;

  // --- STATE ---
  let isActive = false;
  let isDragging = false;
  let dragTarget = null;
  let startMouseX = 0, startMouseY = 0;
  let startTranslateX = 0, startTranslateY = 0;
  let historyStack = [];
  const modifiedElements = new Map();

  // --- SHADOW DOM HOST CONTAINER ---
  const host = document.createElement("div");
  host.id = "designpen-root";
  host.style.position = "fixed";
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
      top: 20px;
      right: 24px;
      pointer-events: auto;
      user-select: none;
      z-index: 2147483647;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(180deg, rgba(28, 30, 38, 0.96), rgba(15, 17, 23, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 24px;
      padding: 8px 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .grip {
      color: rgba(255, 255, 255, 0.35);
      font-size: 16px;
      cursor: grab;
      padding: 0 2px;
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
      box-shadow: 0 0 10px #00dfd8;
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

    .btn-save {
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35));
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.4);
      font-weight: bold;
    }
    .btn-save:hover {
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.5));
      color: #ffffff;
    }

    /* OVERLAY HIGHLIGHT */
    .highlight-box {
      position: fixed;
      pointer-events: none;
      border: 2px solid #0d99ff;
      background: rgba(13, 153, 255, 0.12);
      border-radius: 4px;
      z-index: 2147483640;
      display: none;
      transition: top 0.05s linear, left 0.05s linear, width 0.05s linear, height 0.05s linear;
    }
  `;
  shadow.appendChild(style);

  // --- HIGHLIGHT OVERLAY ---
  const highlightBox = document.createElement("div");
  highlightBox.className = "highlight-box";
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
      <button class="btn btn-save" id="dp-save-btn">💾 Salva</button>
    </div>
  `;
  shadow.appendChild(toolbar);

  // --- ELEMENTS REFERENCES ---
  const pill = shadow.getElementById("dp-pill");
  const grip = shadow.getElementById("dp-grip");
  const dot = shadow.getElementById("dp-dot");
  const chip = shadow.getElementById("dp-chip");
  const penBtn = shadow.getElementById("dp-pen-btn");
  const undoBtn = shadow.getElementById("dp-undo-btn");
  const saveBtn = shadow.getElementById("dp-save-btn");

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
      chip.textContent = "🎯 Seleziona o trascina un elemento";
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
    }
  });

  // --- HELPER: GET TRANSLATE VALUES ---
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

  // --- INTERACTION EVENT INTERCEPTOR ---
  window.addEventListener("mousemove", (e) => {
    if (!isActive) return;

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

    // Hover detection
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || host.contains(target) || target === document.body || target === document.documentElement) {
      highlightBox.style.display = "none";
      return;
    }
    updateHighlight(target);
  });

  window.addEventListener("mousedown", (e) => {
    if (!isActive) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || host.contains(target) || target === document.body || target === document.documentElement) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    dragTarget = target;
    isDragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;

    const currentTrans = getTranslate(dragTarget);
    startTranslateX = currentTrans.x;
    startTranslateY = currentTrans.y;

    updateHighlight(dragTarget);
  }, { capture: true });

  window.addEventListener("mouseup", (e) => {
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

      const id = dragTarget.id || `${dragTarget.tagName.toLowerCase()}_${Date.now()}`;
      modifiedElements.set(dragTarget, {
        id: id,
        tag: dragTarget.tagName,
        className: dragTarget.className,
        x: Math.round(currentTrans.x),
        y: Math.round(currentTrans.y),
        text: dragTarget.innerText?.slice(0, 50)
      });
    }

    isDragging = false;
  }, { capture: true });

  // --- DOUBLE CLICK FOR INLINE TEXT EDITING ---
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

  // --- UNDO ACTION ---
  undoBtn.addEventListener("click", () => {
    if (historyStack.length === 0) return;
    const action = historyStack.pop();

    if (action.type === "move") {
      action.element.style.transform = `translate(${action.oldX}px, ${action.oldY}px)`;
      updateHighlight(action.element);
    } else if (action.type === "text") {
      action.element.innerText = action.oldText;
    }

    if (historyStack.length > 0) {
      undoBtn.textContent = `↶ Undo (${historyStack.length})`;
    } else {
      undoBtn.classList.remove("has-history");
      undoBtn.textContent = "↶ Undo";
    }
  });

  // --- EXPORT LAYOUT JSON ---
  saveBtn.addEventListener("click", () => {
    const layout = {
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      components: {}
    };

    modifiedElements.forEach((val, el) => {
      const trans = getTranslate(el);
      layout.components[val.id] = {
        tag: val.tag,
        className: val.className,
        translate_x: Math.round(trans.x),
        translate_y: Math.round(trans.y),
        text: el.innerText ? el.innerText.trim().slice(0, 80) : ""
      };
    });

    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "designpen_layout.json";
    a.click();
    URL.revokeObjectURL(url);

    const orig = saveBtn.textContent;
    saveBtn.textContent = "✓ Scaricato!";
    setTimeout(() => { saveBtn.textContent = orig; }, 1400);
  });

  console.log("🖊️ DesignPen caricato con successo!");
})();
