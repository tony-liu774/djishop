/**
 * Accuracy Scorer - Calculates note accuracy scores
 */

class AccuracyScorer {
    constructor() {
        this.measureScores = {};
        this.sessionData = null;
    }

    calculateOverall(sessionData) {
        if (!sessionData || !sessionData.pitchAccuracy) {
            return { overall: 0, pitch: 0, timing: 0 };
        }

        // Clamp individual values before averaging
        const clampedPitch = sessionData.pitchAccuracy.map(v => Math.max(0, Math.min(100, v)));
        const clampedTiming = sessionData.timingAccuracy.map(v => Math.max(0, Math.min(100, v)));

        const pitchAvg = this.average(clampedPitch);
        const timingAvg = clampedTiming.length > 0
            ? this.average(clampedTiming)
            : pitchAvg;

        const overall = (pitchAvg + timingAvg) / 2;

        return {
            overall: overall,
            pitch: pitchAvg,
            timing: timingAvg
        };
    }

    calculatePitchAccuracy(noteInfo) {
        if (!noteInfo) return 0;

        // If centsDeviation is missing or undefined, return 0 (unknown)
        if (noteInfo.centsDeviation === undefined || noteInfo.centsDeviation === null) {
            return 0;
        }

        const cents = noteInfo.centsDeviation;
        const absCents = Math.abs(cents);

        // Map cents to 0-100 scale
        // 0 cents = 100%, 50 cents = 0%
        const accuracy = Math.max(0, 100 - (absCents * 2));
        return accuracy;
    }

    calculateMeasureAccuracy(measureNumber, notes) {
        if (!notes || notes.length === 0) return 0;

        let totalAccuracy = 0;
        for (const note of notes) {
            totalAccuracy += this.calculatePitchAccuracy(note);
        }

        return totalAccuracy / notes.length;
    }

    average(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    reset() {
        this.measureScores = {};
    }
}

window.AccuracyScorer = AccuracyScorer;