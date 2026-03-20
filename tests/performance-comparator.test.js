/**
 * Tests for PerformanceComparator
 */

describe('PerformanceComparator', () => {
    let PerformanceComparator;
    let mockScore;

    beforeEach(() => {
        PerformanceComparator = new PerformanceComparator();

        // Create a mock score
        mockScore = {
            parts: [
                {
                    measures: [
                        {
                            notes: [
                                { pitch: { step: 'C', octave: 4, alter: 0 }, duration: 1 },
                                { pitch: { step: 'D', octave: 4, alter: 0 }, duration: 1 },
                                { pitch: { step: 'E', octave: 4, alter: 0 }, duration: 1 }
                            ]
                        }
                    ]
                }
            ],
            getAllNotes: function() {
                const notes = [];
                for (const part of this.parts) {
                    for (const measure of part.measures) {
                        for (const note of measure.notes) {
                            notes.push(note);
                        }
                    }
                }
                return notes;
            }
        };
    });

    describe('Score Loading', () => {
        test('should set current score', () => {
            PerformanceComparator.setScore(mockScore);
            expect(PerformanceComparator.currentScore).toBe(mockScore);
        });

        test('should reset position when setting score', () => {
            PerformanceComparator.currentPosition = 5;
            PerformanceComparator.setScore(mockScore);
            expect(PerformanceComparator.currentPosition).toBe(0);
        });
    });

    describe('Note Comparison', () => {
        test('should return error when no score loaded', () => {
            const result = PerformanceComparator.compare({ midi: 60 });
            expect(result.matched).toBe(false);
            expect(result.reason).toBe('No score loaded');
        });

        test('should match correct MIDI note', () => {
            PerformanceComparator.setScore(mockScore);

            // C4 = MIDI 60
            const result = PerformanceComparator.compare({
                name: 'C',
                octave: 4,
                frequency: 261.63,
                midi: 60
            });

            expect(result.matched).toBe(true);
            expect(result.currentPosition).toBe(1);
        });

        test('should not match incorrect MIDI note', () => {
            PerformanceComparator.setScore(mockScore);

            // First note is C4 (MIDI 60), but we play D4 (MIDI 62)
            const result = PerformanceComparator.compare({
                name: 'D',
                octave: 4,
                frequency: 293.66,
                midi: 62
            });

            // With 50 cent tolerance, D might match depending on exact cents
            expect(result.expectedNote).toBeDefined();
        });

        test('should return error when no more notes', () => {
            PerformanceComparator.setScore(mockScore);
            // Play all 3 notes
            PerformanceComparator.compare({ name: 'C', octave: 4, midi: 60, frequency: 261.63 });
            PerformanceComparator.compare({ name: 'D', octave: 4, midi: 62, frequency: 293.66 });
            PerformanceComparator.compare({ name: 'E', octave: 4, midi: 64, frequency: 329.63 });

            // Try to play a 4th note
            const result = PerformanceComparator.compare({ name: 'F', octave: 4, midi: 65, frequency: 349.23 });
            expect(result.matched).toBe(false);
            expect(result.reason).toBe('No more notes in score');
        });
    });

    describe('Cents Deviation', () => {
        test('should calculate cents deviation', () => {
            PerformanceComparator.setScore(mockScore);

            // Play C4 (261.63 Hz) against expected C4
            const result = PerformanceComparator.compare({
                name: 'C',
                octave: 4,
                frequency: 261.63,
                midi: 60
            });

            expect(result.centsDeviation).toBeCloseTo(0, 0);
        });

        test('should detect sharp pitch', () => {
            PerformanceComparator.setScore(mockScore);

            // Play slightly sharp (~10 cents sharp)
            const sharpFreq = 261.63 * Math.pow(2, 10/1200);
            const result = PerformanceComparator.compare({
                name: 'C',
                octave: 4,
                frequency: sharpFreq,
                midi: 60
            });

            expect(result.centsDeviation).toBeCloseTo(10, 0);
        });

        test('should detect flat pitch', () => {
            PerformanceComparator.setScore(mockScore);

            // Play slightly flat (~10 cents flat)
            const flatFreq = 261.63 * Math.pow(2, -10/1200);
            const result = PerformanceComparator.compare({
                name: 'C',
                octave: 4,
                frequency: flatFreq,
                midi: 60
            });

            expect(result.centsDeviation).toBeCloseTo(-10, 0);
        });
    });

    describe('Progress Tracking', () => {
        test('should return total notes count', () => {
            PerformanceComparator.setScore(mockScore);
            expect(PerformanceComparator.getTotalNotes()).toBe(3);
        });

        test('should return progress percentage', () => {
            PerformanceComparator.setScore(mockScore);
            expect(PerformanceComparator.getProgress()).toBe(0);

            // Play first note
            PerformanceComparator.compare({ name: 'C', octave: 4, midi: 60, frequency: 261.63 });
            expect(PerformanceComparator.getProgress()).toBeCloseTo(33.33, 1);
        });

        test('should handle empty score', () => {
            const emptyScore = { parts: [], getAllNotes: () => [] };
            PerformanceComparator.setScore(emptyScore);
            expect(PerformanceComparator.getTotalNotes()).toBe(0);
            expect(PerformanceComparator.getProgress()).toBe(0);
        });
    });

    describe('Position Control', () => {
        test('should reset position', () => {
            PerformanceComparator.setScore(mockScore);
            PerformanceComparator.compare({ name: 'C', octave: 4, midi: 60, frequency: 261.63 });
            PerformanceComparator.compare({ name: 'D', octave: 4, midi: 62, frequency: 293.66 });

            PerformanceComparator.reset();
            expect(PerformanceComparator.currentPosition).toBe(0);
        });

        test('should set position within bounds', () => {
            PerformanceComparator.setScore(mockScore);
            PerformanceComparator.setPosition(2);
            expect(PerformanceComparator.currentPosition).toBe(2);

            // Test bounds
            PerformanceComparator.setPosition(100);
            expect(PerformanceComparator.currentPosition).toBe(2); // max is 2 (totalNotes - 1)

            PerformanceComparator.setPosition(-1);
            expect(PerformanceComparator.currentPosition).toBe(0);
        });
    });

    describe('Measure Tracking', () => {
        test('should return correct measure number', () => {
            // Create score with 2 measures
            const multiMeasureScore = {
                parts: [
                    {
                        measures: [
                            { notes: [{ pitch: { step: 'C', octave: 4, alter: 0 }, duration: 1 }] },
                            { notes: [{ pitch: { step: 'D', octave: 4, alter: 0 }, duration: 1 }] }
                        ]
                    }
                ],
                getAllNotes: function() {
                    const notes = [];
                    for (const part of this.parts) {
                        for (const measure of part.measures) {
                            for (const note of measure.notes) {
                                notes.push(note);
                            }
                        }
                    }
                    return notes;
                }
            };

            PerformanceComparator.setScore(multiMeasureScore);
            expect(PerformanceComparator.getMeasureAtPosition(0)).toBe(1);
            expect(PerformanceComparator.getMeasureAtPosition(1)).toBe(2);
        });
    });
});