/**
 * Tests for PerformanceComparator
 */

// Get class from global (set up by setup.js)
const PerformanceComparator = global.PerformanceComparator || window.PerformanceComparator;

describe('PerformanceComparator', () => {
    let comparator;
    let mockScore;

    beforeEach(() => {
        comparator = new PerformanceComparator();

        // Create mock notes with getMIDI and getFrequency methods
        const createNote = (step, octave, alter = 0) => {
            const steps = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
            const midi = 12 + (octave * 12) + steps[step] + alter;
            const freq = 440 * Math.pow(2, (midi - 69) / 12);
            return {
                pitch: { step, octave, alter },
                duration: 1,
                getMIDI: () => midi,
                getFrequency: () => freq
            };
        };

        // Create a mock score
        mockScore = {
            parts: [
                {
                    measures: [
                        {
                            notes: [
                                createNote('C', 4),
                                createNote('D', 4),
                                createNote('E', 4)
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
            comparator.setScore(mockScore);
            expect(comparator.currentScore).toBe(mockScore);
        });

        test('should reset position when setting score', () => {
            comparator.currentPosition = 5;
            comparator.setScore(mockScore);
            expect(comparator.currentPosition).toBe(0);
        });
    });

    describe('Note Comparison', () => {
        test('should return error when no score loaded', () => {
            const result = comparator.compare({ midi: 60 });
            expect(result.matched).toBe(false);
            expect(result.reason).toBe('No score loaded');
        });

        test('should match correct MIDI note', () => {
            comparator.setScore(mockScore);

            // C4 = MIDI 60
            const result = comparator.compare({
                name: 'C',
                octave: 4,
                frequency: 261.63,
                midi: 60
            });

            expect(result.matched).toBe(true);
            expect(result.currentPosition).toBe(1);
        });

        test('should return error when no more notes', () => {
            comparator.setScore(mockScore);
            // Play all 3 notes
            comparator.compare({ name: 'C', octave: 4, midi: 60, frequency: 261.63 });
            comparator.compare({ name: 'D', octave: 4, midi: 62, frequency: 293.66 });
            comparator.compare({ name: 'E', octave: 4, midi: 64, frequency: 329.63 });

            // Try to play a 4th note
            const result = comparator.compare({ name: 'F', octave: 4, midi: 65, frequency: 349.23 });
            expect(result.matched).toBe(false);
            expect(result.reason).toBe('No more notes in score');
        });
    });

    describe('Cents Deviation', () => {
        test('should calculate cents deviation', () => {
            comparator.setScore(mockScore);

            // Play C4 (261.63 Hz) against expected C4
            const result = comparator.compare({
                name: 'C',
                octave: 4,
                frequency: 261.63,
                midi: 60
            });

            expect(result.centsDeviation).toBeCloseTo(0, 0);
        });

        test('should detect sharp pitch', () => {
            comparator.setScore(mockScore);

            // Play slightly sharp (~10 cents sharp)
            const sharpFreq = 261.63 * Math.pow(2, 10/1200);
            const result = comparator.compare({
                name: 'C',
                octave: 4,
                frequency: sharpFreq,
                midi: 60
            });

            expect(result.centsDeviation).toBeCloseTo(10, 0);
        });
    });

    describe('Progress Tracking', () => {
        test('should return total notes count', () => {
            comparator.setScore(mockScore);
            expect(comparator.getTotalNotes()).toBe(3);
        });

        test('should return progress percentage', () => {
            comparator.setScore(mockScore);
            expect(comparator.getProgress()).toBe(0);

            // Play first note
            comparator.compare({ name: 'C', octave: 4, midi: 60, frequency: 261.63 });
            expect(comparator.getProgress()).toBeCloseTo(33.33, 1);
        });

        test('should handle empty score', () => {
            const emptyScore = { parts: [], getAllNotes: () => [] };
            comparator.setScore(emptyScore);
            expect(comparator.getTotalNotes()).toBe(0);
            expect(comparator.getProgress()).toBe(0);
        });
    });

    describe('Position Control', () => {
        test('should reset position', () => {
            comparator.setScore(mockScore);
            comparator.compare({ name: 'C', octave: 4, midi: 60, frequency: 261.63 });
            comparator.compare({ name: 'D', octave: 4, midi: 62, frequency: 293.66 });

            comparator.reset();
            expect(comparator.currentPosition).toBe(0);
        });

        test('should set position within bounds', () => {
            comparator.setScore(mockScore);
            comparator.setPosition(2);
            expect(comparator.currentPosition).toBe(2);

            // Test bounds
            comparator.setPosition(100);
            expect(comparator.currentPosition).toBe(2); // max is 2 (totalNotes - 1)

            comparator.setPosition(-1);
            expect(comparator.currentPosition).toBe(0);
        });
    });

    describe('Measure Tracking', () => {
        test('should return correct measure number', () => {
            // Create score with 2 measures
            const createNote = (step, octave, alter = 0) => {
                const steps = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
                const midi = 12 + (octave * 12) + steps[step] + alter;
                return {
                    pitch: { step, octave, alter },
                    duration: 1,
                    getMIDI: () => midi,
                    getFrequency: () => 440 * Math.pow(2, (midi - 69) / 12)
                };
            };

            const multiMeasureScore = {
                parts: [
                    {
                        measures: [
                            { notes: [createNote('C', 4)] },
                            { notes: [createNote('D', 4)] }
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

            comparator.setScore(multiMeasureScore);
            expect(comparator.getMeasureAtPosition(0)).toBe(1);
            expect(comparator.getMeasureAtPosition(1)).toBe(2);
        });
    });
});
