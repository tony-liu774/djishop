/**
 * Sheet Music Renderer - Visual rendering of music notation
 */

class SheetMusicRenderer {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        this.score = null;
        this.cursorPosition = null;
    }

    init() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'sheet-music-canvas';
        this.container?.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    setScore(score) {
        this.score = score;
        this.render();
    }

    resize() {
        if (!this.canvas) return;

        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    render() {
        if (!this.ctx || !this.score) return;

        // Clear canvas
        this.ctx.fillStyle = '#141420';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw staff lines
        this.drawStaffLines();

        // Draw clef
        this.drawClef();

        // Draw notes
        this.drawNotes();
    }

    drawStaffLines() {
        const ctx = this.ctx;
        const startX = 50;
        const lineSpacing = 10;
        const staffHeight = lineSpacing * 4;

        ctx.strokeStyle = '#3a3a4a';
        ctx.lineWidth = 1;

        for (let i = 0; i < 5; i++) {
            const y = 50 + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(this.canvas.width - 50, y);
            ctx.stroke();
        }
    }

    drawClef() {
        const ctx = this.ctx;
        ctx.fillStyle = '#f5f5dc';
        ctx.font = '48px serif';
        ctx.fillText('𝄞', 20, 95);
    }

    drawNotes() {
        // Placeholder - would use VexFlow or OpenSheetMusicDisplay
        const ctx = this.ctx;
        ctx.fillStyle = '#c9a227';
        ctx.font = '20px serif';
        ctx.fillText('Music notation rendering', 100, 90);
    }

    setCursorPosition(position) {
        this.cursorPosition = position;
        this.render();
    }

    clear() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

window.SheetMusicRenderer = SheetMusicRenderer;