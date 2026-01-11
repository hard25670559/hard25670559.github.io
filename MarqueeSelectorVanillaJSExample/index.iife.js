var MarqueeSelector = function(exports) {
  "use strict";
  class MarqueeSelector {
    constructor(options) {
      this.targets = [];
      this.targetSelectionCache = new WeakMap;
      this.isSelecting = false;
      this.hasStarted = false;
      this.isClearClickListenerActive = false;
      this.selectionStart = {
        x: 0,
        y: 0
      };
      this.selectionCurrent = {
        x: 0,
        y: 0
      };
      this._onMouseMove = this.onMouseMove.bind(this);
      this._onMouseUp = this.onMouseUp.bind(this);
      this._onMouseDown = this.onMouseDown.bind(this);
      this._onClearClick = this.onClearClick.bind(this);
      if (typeof options.container === "string") {
        const el = document.querySelector(options.container);
        if (!el) throw new Error(`Container not found: ${options.container}`);
        this.container = el;
      } else this.container = options.container;
      this.enabled = false;
      const defaultTextSelectors = [ "input", "textarea", "[contenteditable]", "pre", "code" ];
      this.allowTextSelectionSelectors = [ ...defaultTextSelectors, ...options.allowTextSelectionOn || [] ];
      this.selectionBox = document.createElement("div");
      this.initSelectionBox();
      this.container.addEventListener("mousedown", this._onMouseDown);
      const style = window.getComputedStyle(this.container);
      if (style.position === "static") this.container.style.position = "relative";
    }
    initSelectionBox() {
      this.selectionBox.className = "marquee-selection-box";
      this.container.appendChild(this.selectionBox);
    }
    onMouseDown(event) {
      if (!this.enabled) return;
      if (event.button !== 0) return;
      const target = event.target;
      if (this.isTextSelectionAllowed(target) || target.draggable || target.closest('[draggable="true"]')) return;
      const rect = this.container.getBoundingClientRect();
      const startX = event.clientX - rect.left + this.container.scrollLeft;
      const startY = event.clientY - rect.top + this.container.scrollTop;
      this.selectionStart = {
        x: startX,
        y: startY
      };
      this.selectionCurrent = {
        x: startX,
        y: startY
      };
      this.isSelecting = true;
      this.hasStarted = false;
      this.updateBoxStyle();
      this.selectionBox.classList.add("active");
      document.body.classList.add("disable-user-select");
      window.addEventListener("mousemove", this._onMouseMove);
      window.addEventListener("mouseup", this._onMouseUp);
    }
    onMouseMove(event) {
      if (!this.isSelecting) return;
      if (!this.hasStarted) {
        this.hasStarted = true;
        const target = event.target;
        for (const cfg of this.targets) if (cfg.onSelectionStart) cfg.onSelectionStart(target);
      }
      const rect = this.container.getBoundingClientRect();
      const currentX = event.clientX - rect.left + this.container.scrollLeft;
      const currentY = event.clientY - rect.top + this.container.scrollTop;
      this.selectionCurrent = {
        x: currentX,
        y: currentY
      };
      this.updateBoxStyle();
      this.updateSelection();
    }
    onMouseUp() {
      if (this.isSelecting) {
        this.isSelecting = false;
        this.selectionBox.classList.remove("active");
        if (this.hasStarted) {
          for (const cfg of this.targets) if (cfg.onSelectionEnd) {
            const selectedElements = this.targetSelectionCache.get(cfg) ?? [];
            cfg.onSelectionEnd(selectedElements);
          }
          const hasAnyClearClickHandler = this.targets.some(cfg => {
            if (!cfg.onClearClick) return false;
            const selection = this.targetSelectionCache.get(cfg) ?? [];
            return selection.length > 0;
          });
          if (hasAnyClearClickHandler && !this.isClearClickListenerActive) setTimeout(() => {
            this.container.addEventListener("click", this._onClearClick);
            this.isClearClickListenerActive = true;
          }, 0);
        }
      }
      window.removeEventListener("mousemove", this._onMouseMove);
      window.removeEventListener("mouseup", this._onMouseUp);
      document.body.classList.remove("disable-user-select");
    }
    onClearClick(event) {
      const target = event.target;
      for (const cfg of this.targets) {
        if (!cfg.onClearClick) continue;
        const currentSelection = this.targetSelectionCache.get(cfg) ?? [];
        if (currentSelection.length === 0) continue;
        const isClickOnTarget = currentSelection.some(el => el === target || el.contains(target));
        if (!isClickOnTarget) {
          cfg.onClearClick(currentSelection);
          this.targetSelectionCache.set(cfg, []);
        }
      }
      this.container.removeEventListener("click", this._onClearClick);
      this.isClearClickListenerActive = false;
    }
    updateBoxStyle() {
      const left = Math.min(this.selectionStart.x, this.selectionCurrent.x);
      const top = Math.min(this.selectionStart.y, this.selectionCurrent.y);
      const width = Math.abs(this.selectionCurrent.x - this.selectionStart.x);
      const height = Math.abs(this.selectionCurrent.y - this.selectionStart.y);
      const styleObj = {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      };
      Object.assign(this.selectionBox.style, styleObj);
    }
    updateSelection() {
      const relLeft = Math.min(this.selectionStart.x, this.selectionCurrent.x);
      const relTop = Math.min(this.selectionStart.y, this.selectionCurrent.y);
      const relWidth = Math.abs(this.selectionCurrent.x - this.selectionStart.x);
      const relHeight = Math.abs(this.selectionCurrent.y - this.selectionStart.y);
      const containerRect = this.container.getBoundingClientRect();
      const boxClientLeft = relLeft - this.container.scrollLeft + containerRect.left;
      const boxClientTop = relTop - this.container.scrollTop + containerRect.top;
      const boxClientRight = boxClientLeft + relWidth;
      const boxClientBottom = boxClientTop + relHeight;
      for (const cfg of this.targets) {
        const candidates = this.resolveCandidates(cfg.selector);
        const selectedForTarget = [];
        for (const el of candidates) {
          const elRect = el.getBoundingClientRect();
          const isIntersecting = !(elRect.right < boxClientLeft || elRect.left > boxClientRight || elRect.bottom < boxClientTop || elRect.top > boxClientBottom);
          if (isIntersecting) selectedForTarget.push(el);
        }
        const lastForTarget = this.targetSelectionCache.get(cfg) ?? [];
        const targetChanged = selectedForTarget.length !== lastForTarget.length || selectedForTarget.some((el, i) => el !== lastForTarget[i]);
        if (targetChanged) {
          this.targetSelectionCache.set(cfg, [ ...selectedForTarget ]);
          if (cfg.onSelectionChange) cfg.onSelectionChange(selectedForTarget);
        }
      }
    }
    enable() {
      this.enabled = true;
    }
    disable() {
      this.enabled = false;
    }
    isEnabled() {
      return this.enabled;
    }
    addTarget(config) {
      this.targets.push({
        selector: config.selector,
        onSelectionChange: config.onSelectionChange,
        onSelectionStart: config.onSelectionStart,
        onSelectionEnd: config.onSelectionEnd,
        onClearClick: config.onClearClick
      });
    }
    destroy() {
      this.container.removeEventListener("mousedown", this._onMouseDown);
      this.container.removeEventListener("click", this._onClearClick);
      window.removeEventListener("mousemove", this._onMouseMove);
      window.removeEventListener("mouseup", this._onMouseUp);
      if (this.selectionBox.parentNode) this.selectionBox.parentNode.removeChild(this.selectionBox);
    }
    resolveCandidates(selector) {
      if (typeof selector === "string") return Array.from(this.container.querySelectorAll(selector));
      if (selector instanceof HTMLElement) return [ selector ];
      if (Array.isArray(selector) && selector.length > 0) {
        if (typeof selector[0] === "string") {
          const combined = selector.join(",");
          return Array.from(this.container.querySelectorAll(combined));
        }
        return selector;
      }
      return [];
    }
    isTextSelectionAllowed(target) {
      for (const selector of this.allowTextSelectionSelectors) if (target.matches(selector) || target.closest(selector)) return true;
      const computedStyle = window.getComputedStyle(target);
      if (computedStyle.userSelect !== "none" && target.childNodes.length > 0) for (const node of Array.from(target.childNodes)) if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
      return false;
    }
  }
  exports.MarqueeSelector = MarqueeSelector;
  exports.default = MarqueeSelector;
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  return exports;
}({});
//# sourceMappingURL=index.iife.js.map
