/**
 * Heat Map Renderer - Visual overlay showing problem areas
 */

class HeatMapRenderer {
    constructor(container) {
        this.container = container;
        this.heatmapData = {};
    }

    setData(measureData) {
        this.heatmapData = measureData;
    }

    render() {
        // Render heat map overlay
        const container = this.container;
        if (!container) return;

        // Placeholder - would create colored overlay on measures
        container.innerHTML = `
            <div class="heatmap-overlay">
                <p>Heat map visualization</p>
            </div>
        `;
    }

    getColorForScore(score) {
        // Color gradient: green (good) -> yellow (needs work) -> red (struggling)
        if (score >= 90) return '#2d5a4a'; // Good - emerald
        if (score >= 70) return '#c9a227'; // Okay - amber
        return '#8b2942'; // Needs work - crimson
    }
}

window.HeatMapRenderer = HeatMapRenderer;