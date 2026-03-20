/**
 * Tests for AccuracyScorer
 */

// Get class from global (set up by setup.js)
const AccuracyScorer = global.AccuracyScorer || window.AccuracyScorer;

describe('AccuracyScorer', () => {
    let scorer;

    beforeEach(() => {
        scorer = new AccuracyScorer();
    });

    describe('Pitch Accuracy Calculation', () => {
        test('should return 100% for perfect pitch (0 cents)', () => {
            const accuracy = scorer.calculatePitchAccuracy({
                centsDeviation: 0
            });
            expect(accuracy).toBe(100);
        });

        test('should return 50% for 25 cents deviation', () => {
            const accuracy = scorer.calculatePitchAccuracy({
                centsDeviation: 25
            });
            expect(accuracy).toBe(50);
        });

        test('should return 0% for 50+ cents deviation', () => {
            const accuracy = scorer.calculatePitchAccuracy({
                centsDeviation: 50
            });
            expect(accuracy).toBe(0);
        });

        test('should work with negative cents', () => {
            const accuracy = scorer.calculatePitchAccuracy({
                centsDeviation: -25
            });
            expect(accuracy).toBe(50);
        });

        test('should handle missing centsDeviation', () => {
            const accuracy = scorer.calculatePitchAccuracy({});
            expect(accuracy).toBe(0);
        });

        test('should handle null input', () => {
            const accuracy = scorer.calculatePitchAccuracy(null);
            expect(accuracy).toBe(0);
        });
    });

    describe('Overall Score Calculation', () => {
        test('should return zeros for empty session data', () => {
            const result = scorer.calculateOverall({});
            expect(result.overall).toBe(0);
            expect(result.pitch).toBe(0);
            expect(result.timing).toBe(0);
        });

        test('should calculate pitch average correctly', () => {
            const sessionData = {
                pitchAccuracy: [100, 80, 90, 70],
                timingAccuracy: [90, 80]
            };
            const result = scorer.calculateOverall(sessionData);
            expect(result.pitch).toBe(85); // (100+80+90+70)/4
        });

        test('should calculate timing from pitch if no timing data', () => {
            const sessionData = {
                pitchAccuracy: [100, 80],
                timingAccuracy: []
            };
            const result = scorer.calculateOverall(sessionData);
            expect(result.timing).toBe(90); // Same as pitch average
        });

        test('should calculate overall as average of pitch and timing', () => {
            const sessionData = {
                pitchAccuracy: [100, 100],
                timingAccuracy: [80, 80]
            };
            const result = scorer.calculateOverall(sessionData);
            expect(result.overall).toBe(90); // (100 + 80) / 2
        });

        test('should clamp scores between 0 and 100', () => {
            const sessionData = {
                pitchAccuracy: [150, -50], // Out of range, clamped to [100, 0], average = 50
                timingAccuracy: [200] // Clamped to [100], average = 100
            };
            const result = scorer.calculateOverall(sessionData);
            expect(result.pitch).toBe(50); // Average of clamped values
            expect(result.timing).toBe(100); // Single clamped value
        });
    });

    describe('Measure Accuracy', () => {
        test('should calculate average accuracy for notes in a measure', () => {
            const notes = [
                { centsDeviation: 0 },
                { centsDeviation: 20 },
                { centsDeviation: 40 }
            ];
            const accuracy = scorer.calculateMeasureAccuracy(1, notes);
            // 100 + 60 + 20 = 180 / 3 = 60
            expect(accuracy).toBe(60);
        });

        test('should return 0 for empty notes array', () => {
            const accuracy = scorer.calculateMeasureAccuracy(1, []);
            expect(accuracy).toBe(0);
        });
    });

    describe('Reset', () => {
        test('should clear measure scores on reset', () => {
            scorer.measureScores = { 1: 80, 2: 60 };
            scorer.reset();
            expect(scorer.measureScores).toEqual({});
        });
    });
});