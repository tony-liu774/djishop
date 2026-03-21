/**
 * Heat Map Renderer - Visual overlay showing problem areas on sheet music
 * Midnight Conservatory theme: Deep Navy (#0a0a12) background, Crimson (#dc2626) for errors
 */

class HeatMapRenderer {
    constructor(container) {
        this.container = container;
        this.measureData = [];
        this.canvas = null;
        this.ctx = null;
        this.isPostSessionMode = false;
        this.problemMeasures = [];
    }

    init() {
        // Create canvas for rendering
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'heatmap-canvas';
        this.container?.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    resize() {
        if (!this.canvas || !this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    /**
     * Enable post-session mode with Deep Navy background
     */
    enablePostSessionMode(enabled = true) {
        this.isPostSessionMode = enabled;
        this.render();
    }

    /**
     * Set problem measures from AI analysis
     * @param {Array} measures - Array of measure numbers needing practice
     */
    setProblemMeasures(measures) {
        this.problemMeasures = measures || [];
    }

    setData(sessionData) {
        // Convert session data to measure-level scores
        this.measureData = this.calculateMeasureScores(sessionData);
    }

    calculateMeasureScores(sessionData) {
        const measures = {};

        if (!sessionData || !sessionData.notes) return [];

        // Group notes by measure
        for (const noteData of sessionData.notes) {
            if (!noteData.measure) continue;

            if (!measures[noteData.measure]) {
                measures[noteData.measure] = { total: 0, count: 0, deviations: [] };
            }

            const accuracy = noteData.accuracy || 100;
            measures[noteData.measure].total += accuracy;
            measures[noteData.measure].count++;
            // Track deviations for heat calculation
            if (accuracy < 90) {
                measures[noteData.measure].deviations.push(100 - accuracy);
            }
        }

        // Calculate average per measure with deviation density
        const result = [];
        for (const [measure, data] of Object.entries(measures)) {
            const avgScore = data.count > 0 ? data.total / data.count : 100;
            // Factor in deviation density (more deviations = "hotter" area)
            const deviationDensity = data.deviations.length > 0
                ? data.deviations.reduce((a, b) => a + b, 0) / data.deviations.length
                : 0;

            // Adjust score based on deviation density (makes problem areas stand out)
            const adjustedScore = avgScore - (deviationDensity * 0.3);

            result.push({
                measure: parseInt(measure),
                score: Math.max(0, adjustedScore),
                rawScore: avgScore,
                deviationCount: data.deviations.length
            });
        }

        return result.sort((a, b) => a.measure - b.measure);
    }

    render() {
        if (!this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear with appropriate background
        if (this.isPostSessionMode) {
            // Deep Navy background for post-session
            ctx.fillStyle = '#0a0a12';
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        if (this.measureData.length === 0) {
            // Show placeholder
            ctx.fillStyle = this.isPostSessionMode ? '#6a6a7a' : '#6a6a7a';
            ctx.font = '16px Source Sans 3';
            ctx.textAlign = 'center';
            ctx.fillText('Practice to see your heat map', width / 2, height / 2);
            return;
        }

        // Draw heat map bars
        const barWidth = (width - 40) / Math.max(this.measureData.length, 1);
        const maxBarHeight = height - 40;
        const startX = 20;

        this.measureData.forEach((data, index) => {
            const x = startX + index * barWidth;
            const barHeight = (data.score / 100) * maxBarHeight;
            const y = height - 20 - barHeight;

            // Get color based on score - Crimson theme for post-session
            ctx.fillStyle = this.getColorForScore(data.score);

            // Draw bar with glow effect in post-session mode
            if (this.isPostSessionMode && data.score < 60) {
                // Add glow for problem areas
                ctx.shadowColor = '#dc2626';
                ctx.shadowBlur = 10;
            }

            ctx.fillRect(x, y, barWidth - 4, barHeight);
            ctx.shadowBlur = 0; // Reset shadow

            // Draw measure number
            ctx.fillStyle = this.isPostSessionMode ? '#8888a0' : '#a0a0b0';
            ctx.font = '10px Source Sans 3';
            ctx.textAlign = 'center';
            ctx.fillText(data.measure, x + barWidth / 2, height - 5);

            // Highlight problem measures
            if (this.problemMeasures.includes(data.measure)) {
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, barWidth - 4, barHeight);
            }

            // Draw score above bar
            ctx.fillStyle = this.isPostSessionMode ? '#c9a227' : '#f5f5dc';
            ctx.fillText(Math.round(data.score) + '%', x + barWidth / 2, y - 5);
        });

        // Draw legend in post-session mode
        if (this.isPostSessionMode) {
            this.drawLegend(ctx, width, height);
        }
    }

    /**
     * Draw color legend for the heat map
     */
    drawLegend(ctx, width, height) {
        const legendY = height - 15;
        const legendWidth = 120;
        const startX = width - legendWidth - 20;

        // Legend background
        ctx.fillStyle = 'rgba(10, 10, 18, 0.8)';
        ctx.fillRect(startX - 5, legendY - 12, legendWidth + 10, 20);

        // Gradient legend
        const gradient = ctx.createLinearGradient(startX, 0, startX + legendWidth, 0);
        gradient.addColorStop(0, '#dc2626');   // Crimson - errors
        gradient.addColorStop(0.5, '#c9a227'); // Amber - needs work
        gradient.addColorStop(1, '#2d5a4a');   // Emerald - good

        ctx.fillStyle = gradient;
        ctx.fillRect(startX, legendY, legendWidth, 6);

        // Legend labels
        ctx.fillStyle = '#8888a0';
        ctx.font = '8px Source Sans 3';
        ctx.textAlign = 'left';
        ctx.fillText('Poor', startX, legendY - 3);
        ctx.textAlign = 'right';
        ctx.fillText('Good', startX + legendWidth, legendY - 3);
    }

    getColorForScore(score) {
        if (this.isPostSessionMode) {
            // Crimson-based color scheme for post-session (Deep Navy theme)
            if (score >= 90) return '#2d5a4a'; // Good - emerald
            if (score >= 75) return '#4a5a3d'; // Okay - olive
            if (score >= 60) return '#c9a227'; // Needs work - amber
            if (score >= 40) return '#8b3d2b'; // Struggling - dark orange
            return '#dc2626'; // Critical - crimson (primary error color)
        } else {
            // Original color scheme
            if (score >= 90) return '#2d5a4a'; // Good - emerald
            if (score >= 75) return '#4a5a3d'; // Okay - olive
            if (score >= 60) return '#c9a227'; // Needs work - amber
            if (score >= 40) return '#8b3d2b'; // Struggling - dark orange
            return '#8b2942'; // Critical - crimson
        }
    }

    clear() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.measureData = [];
        this.problemMeasures = [];
    }

    // Get summary for modal display
    getSummary() {
        if (this.measureData.length === 0) return null;

        const scores = this.measureData.map(m => m.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Find measures needing most practice (lowest scores)
        const problemMeasures = [...this.measureData]
            .sort((a, b) => a.score - b.score)
            .slice(0, 3);

        return {
            averageScore: Math.round(avg),
            totalMeasures: this.measureData.length,
            problemMeasures: problemMeasures.map(m => m.measure),
            problemMeasuresWithScores: problemMeasures
        };
    }

    /**
     * Render overlay on sheet music canvas
     * @param {CanvasRenderingContext2D} sheetCtx - Sheet music canvas context
     * @param {number} sheetWidth - Sheet music width
     * @param {number} sheetHeight - Sheet music height
     * @param {Array} measurePositions - Array of {measure, x, width} positions
     */
    renderOverlay(sheetCtx, sheetWidth, sheetHeight, measurePositions) {
        if (!this.measureData.length || !measurePositions.length) return;

        // Draw semi-transparent overlay
        measurePositions.forEach(pos => {
            const measureData = this.measureData.find(m => m.measure === pos.measure);
            if (!measureData) return;

            const color = this.getColorForScore(measureData.score);
            const alpha = this.isPostSessionMode ? 0.4 : 0.25;

            // Parse color and add alpha
            sheetCtx.fillStyle = this.hexToRgba(color, alpha);
            sheetCtx.fillRect(pos.x, 0, pos.width, sheetHeight);

            // Add border for problem measures
            if (measureData.score < 60 || this.problemMeasures.includes(pos.measure)) {
                sheetCtx.strokeStyle = '#dc2626';
                sheetCtx.lineWidth = 2;
                sheetCtx.strokeRect(pos.x, 0, pos.width, sheetHeight);
            }
        });
    }

    /**
     * Convert hex color to rgba
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

window.HeatMapRenderer = HeatMapRenderer;
