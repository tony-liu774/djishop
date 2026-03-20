/**
 * Zoom Controller for Sheet Music
 * Provides high-resolution zoom and pan capabilities
 */

class ZoomController {
  constructor(element) {
    this.element = element;
    this.scale = 1;
    this.minScale = 0.5;
    this.maxScale = 4;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.zoomLevel = 100; // percentage

    // Touch tracking
    this.touches = [];
    this.lastTouchDistance = 0;

    this.init();
  }

  init() {
    // Add zoom controls to the element
    this.createZoomControls();

    // Mouse wheel zoom
    this.element?.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // Mouse drag for panning
    this.element?.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());

    // Touch events for mobile
    this.element?.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.element?.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.element?.addEventListener('touchend', (e) => this.handleTouchEnd(e));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  createZoomControls() {
    // Create zoom controls container
    const controls = document.createElement('div');
    controls.className = 'zoom-controls';

    controls.innerHTML = `
      <button class="zoom-btn zoom-out" title="Zoom Out (Ctrl+-)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <span class="zoom-level">100%</span>
      <button class="zoom-btn zoom-in" title="Zoom In (Ctrl++)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button class="zoom-btn zoom-reset" title="Reset Zoom (Ctrl+0)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
      <button class="zoom-btn zoom-fit" title="Fit to View (Ctrl+1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
    `;

    // Add controls to the element's parent
    if (this.element?.parentElement) {
      this.element.parentElement.style.position = 'relative';
      this.element.parentElement.appendChild(controls);
    }

    // Add event listeners
    controls.querySelector('.zoom-in')?.addEventListener('click', () => this.zoomIn());
    controls.querySelector('.zoom-out')?.addEventListener('click', () => this.zoomOut());
    controls.querySelector('.zoom-reset')?.addEventListener('click', () => this.reset());
    controls.querySelector('.zoom-fit')?.addEventListener('click', () => this.fitToView());

    this.zoomLevelDisplay = controls.querySelector('.zoom-level');
    this.controls = controls;
  }

  handleWheel(e) {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + wheel
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.zoom(delta, e.clientX, e.clientY);
    } else {
      // Pan with wheel
      this.translateX -= e.deltaX;
      this.translateY -= e.deltaY;
      this.updateTransform();
    }
  }

  handleMouseDown(e) {
    if (e.target.closest('.zoom-controls')) return;

    this.isDragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.element.style.cursor = 'grabbing';
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastX;
    const deltaY = e.clientY - this.lastY;

    this.translateX += deltaX;
    this.translateY += deltaY;

    this.lastX = e.clientX;
    this.lastY = e.clientY;

    this.updateTransform();
  }

  handleMouseUp() {
    this.isDragging = false;
    this.element.style.cursor = 'grab';
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Pinch zoom
      this.lastTouchDistance = this.getTouchDistance(e.touches);
    }
    e.preventDefault();
  }

  handleTouchMove(e) {
    if (e.touches.length === 1 && this.isDragging) {
      const deltaX = e.touches[0].clientX - this.lastX;
      const deltaY = e.touches[0].clientY - this.lastY;

      this.translateX += deltaX;
      this.translateY += deltaY;

      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;

      this.updateTransform();
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const distance = this.getTouchDistance(e.touches);
      const delta = (distance - this.lastTouchDistance) / 200;

      this.zoom(delta);
      this.lastTouchDistance = distance;
    }
    e.preventDefault();
  }

  handleTouchEnd(e) {
    if (e.touches.length === 0) {
      this.isDragging = false;
    }
  }

  getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  handleKeyDown(e) {
    // Zoom shortcuts
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      this.zoomIn();
    } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault();
      this.zoomOut();
    } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      this.reset();
    } else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
      e.preventDefault();
      this.fitToView();
    }

    // Pan with arrow keys
    const panSpeed = 20;
    if (e.key === 'ArrowUp') {
      this.translateY += panSpeed;
      this.updateTransform();
    } else if (e.key === 'ArrowDown') {
      this.translateY -= panSpeed;
      this.updateTransform();
    } else if (e.key === 'ArrowLeft') {
      this.translateX += panSpeed;
      this.updateTransform();
    } else if (e.key === 'ArrowRight') {
      this.translateX -= panSpeed;
      this.updateTransform();
    }
  }

  zoom(delta, originX, originY) {
    const oldScale = this.scale;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));

    // Zoom towards cursor position
    if (originX !== undefined && originY !== undefined) {
      const rect = this.element.getBoundingClientRect();
      const x = originX - rect.left;
      const y = originY - rect.top;

      this.translateX = x - (x - this.translateX) * (this.scale / oldScale);
      this.translateY = y - (y - this.translateY) * (this.scale / oldScale);
    }

    this.updateTransform();
  }

  zoomIn() {
    this.zoom(0.25);
  }

  zoomOut() {
    this.zoom(-0.25);
  }

  reset() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
  }

  fitToView() {
    const rect = this.element.getBoundingClientRect();
    const contentRect = this.element.getBoundingClientRect();

    // Calculate scale to fit
    const scaleX = rect.width / contentRect.width;
    const scaleY = rect.height / contentRect.height;
    this.scale = Math.min(scaleX, scaleY, 1) * 0.9;

    // Center the content
    this.translateX = (rect.width - contentRect.width * this.scale) / 2;
    this.translateY = (rect.height - contentRect.height * this.scale) / 2;

    this.updateTransform();
  }

  setZoom(level) {
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, level / 100));
    this.updateTransform();
  }

  updateTransform() {
    this.zoomLevel = Math.round(this.scale * 100);

    if (this.zoomLevelDisplay) {
      this.zoomLevelDisplay.textContent = `${this.zoomLevel}%`;
    }

    // Apply transform
    this.element.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    this.element.style.transformOrigin = 'center center';

    // Dispatch event for other components
    this.element.dispatchEvent(new CustomEvent('zoomchange', {
      detail: {
        scale: this.scale,
        zoomLevel: this.zoomLevel,
        translateX: this.translateX,
        translateY: this.translateY
      }
    }));
  }

  getZoomLevel() {
    return this.zoomLevel;
  }

  getScale() {
    return this.scale;
  }

  destroy() {
    // Clean up event listeners
    this.element?.removeEventListener('wheel', this.handleWheel);
    this.element?.removeEventListener('mousedown', this.handleMouseDown);
    this.element?.removeEventListener('touchstart', this.handleTouchStart);
    this.element?.removeEventListener('touchmove', this.handleTouchMove);
    this.element?.removeEventListener('touchend', this.handleTouchEnd);

    // Remove controls
    this.controls?.remove();
  }
}

// Export for global use
window.ZoomController = ZoomController;
