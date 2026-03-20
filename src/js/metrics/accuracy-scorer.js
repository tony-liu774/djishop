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

        const pitchAvg = this.average(sessionData.pitchAccuracy);

        // Calculate timing accuracy from timing deviations if available
        let timingAvg = 0;
        if (sessionData.timingDeviations && sessionData.timingDeviations.length > 0) {
            // Calculate timing accuracy based on deviations
            const timingScores = sessionData.timingDeviations.map(deviation => {
                // Within 50ms = 100%, within 200ms = 0%
                const absDev = Math.abs(deviation);
                return Math.max(0, 100 - (absDev / 2));
            });
            timingAvg = this.average(timingScores);
        } else if (sessionData.timingAccuracy && sessionData.timingAccuracy.length > 0) {
            timingAvg = this.average(sessionData.timingAccuracy);
        } else {
            // Fall back to pitch accuracy if no timing data
            timingAvg = pitchAvg;
        }

        const overall = (pitchAvg + timingAvg) / 2;

        // Analyze for rushed/dragged patterns
        const timingAnalysis = this.analyzeTimingPatterns(sessionData.timingDeviations || []);

        return {
            overall: Math.max(0, Math.min(100, overall)),
            pitch: Math.max(0, Math.min(100, pitchAvg)),
            timing: Math.max(0, Math.min(100, timingAvg)),
            timingAnalysis: timingAnalysis
        };
    }

    analyzeTimingPatterns(deviations) {
        if (deviations.length < 3) {
            return { status: 'neutral', message: 'Keep practicing' };
        }

        // Calculate average deviation
        const avgDeviation = this.average(deviations);

        // Check for consistent early (rushed) or late (dragged) timing
        const threshold = 50; // ms

        if (avgDeviation < -threshold) {
            return {
                status: 'rushed',
                message: 'Tendency to rush - try slowing down',
                avgDeviation: Math.round(avgDeviation)
            };
        } else if (avgDeviation > threshold) {
            return {
                status: 'dragged',
                message: 'Tendency to drag - try keeping tempo',
                avgDeviation: Math.round(avgDeviation)
            };
        }

        return {
            status: 'good',
            message: 'Good timing consistency',
            avgDeviation: Math.round(avgDeviation)
        };
    }

    calculatePitchAccuracy(noteInfo) {
        if (!noteInfo) return 0;

        const cents = noteInfo.centsDeviation || 0;
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