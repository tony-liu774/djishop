/**
 * Rhythm Analyzer - Analyzes rhythmic precision
 */

class RhythmAnalyzer {
    constructor() {
        this.tempo = 120;
        this.beatTimestamps = [];
    }

    setTempo(bpm) {
        this.tempo = bpm;
    }

    recordBeat(timestamp) {
        this.beatTimestamps.push(timestamp);
    }

    calculateBeatDeviation() {
        if (this.beatTimestamps.length < 2) return 0;

        const expectedInterval = 60000 / this.tempo;
        const intervals = [];

        for (let i = 1; i < this.beatTimestamps.length; i++) {
            const actualInterval = this.beatTimestamps[i] - this.beatTimestamps[i - 1];
            intervals.push(actualInterval - expectedInterval);
        }

        // Calculate average deviation
        const avgDeviation = this.average(intervals.map(Math.abs));

        // Convert to percentage (within 10% is considered good)
        const deviationPercent = (avgDeviation / expectedInterval) * 100;
        return Math.max(0, 100 - deviationPercent);
    }

    calculateNoteDuration(note, expectedDuration) {
        // Placeholder - would calculate duration accuracy
        return 85; // Default to 85%
    }

    getTempoMap() {
        return {
            current: this.tempo,
            deviations: []
        };
    }

    average(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    reset() {
        this.beatTimestamps = [];
    }
}

window.RhythmAnalyzer = RhythmAnalyzer;