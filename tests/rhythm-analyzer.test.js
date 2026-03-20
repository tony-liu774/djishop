/**
 * Tests for RhythmAnalyzer
 */

describe('RhythmAnalyzer', () => {
    let RhythmAnalyzer;

    beforeEach(() => {
        RhythmAnalyzer = new RhythmAnalyzer();
    });

    describe('Tempo Setting', () => {
        test('should set tempo correctly', () => {
            RhythmAnalyzer.setTempo(100);
            expect(RhythmAnalyzer.tempo).toBe(100);
        });

        test('should store tempo in constructor', () => {
            const analyzer = new RhythmAnalyzer();
            expect(analyzer.tempo).toBe(120); // Default
        });
    });

    describe('Beat Recording', () => {
        test('should record beat timestamps', () => {
            RhythmAnalyzer.recordBeat(1000);
            RhythmAnalyzer.recordBeat(1500);
            expect(RhythmAnalyzer.beatTimestamps).toEqual([1000, 1500]);
        });
    });

    describe('Note Onset Recording', () => {
        test('should record note onsets', () => {
            RhythmAnalyzer.recordNoteOnset(1000);
            RhythmAnalyzer.recordNoteOnset(1300);
            expect(RhythmAnalyzer.noteOnsets).toEqual([1000, 1300]);
        });
    });

    describe('Expected Intervals', () => {
        test('should set expected intervals', () => {
            const intervals = [500, 500, 1000]; // ms
            RhythmAnalyzer.setExpectedIntervals(intervals);
            expect(RhythmAnalyzer.expectedIntervals).toEqual(intervals);
        });
    });

    describe('Beat Deviation Calculation', () => {
        test('should return 100 for less than 2 beats', () => {
            const score = RhythmAnalyzer.calculateBeatDeviation();
            expect(score).toBe(100);
        });

        test('should return 100 for perfect timing at 120 BPM', () => {
            // 120 BPM = 500ms per beat
            RhythmAnalyzer.setTempo(120);
            RhythmAnalyzer.recordBeat(1000);
            RhythmAnalyzer.recordBeat(1500); // 500ms later - perfect
            RhythmAnalyzer.recordBeat(2000); // 500ms later - perfect

            const score = RhythmAnalyzer.calculateBeatDeviation();
            expect(score).toBe(100);
        });

        test('should return lower score for imperfect timing', () => {
            // 120 BPM = 500ms per beat
            RhythmAnalyzer.setTempo(120);
            RhythmAnalyzer.recordBeat(1000);
            RhythmAnalyzer.recordBeat(1550); // 550ms (50ms early)
            RhythmAnalyzer.recordBeat(2100); // 550ms (50ms early)

            const score = RhythmAnalyzer.calculateBeatDeviation();
            expect(score).toBeLessThan(100);
            expect(score).toBeGreaterThan(0);
        });
    });

    describe('Note Duration Calculation', () => {
        test('should return default 75 for missing expected interval', () => {
            const score = RhythmAnalyzer.calculateNoteDuration(5, 500);
            expect(score).toBe(75);
        });

        test('should return 100 for perfect duration match', () => {
            RhythmAnalyzer.setExpectedIntervals([500, 500, 500]);
            const score = RhythmAnalyzer.calculateNoteDuration(1, 500); // index 1 = second note
            expect(score).toBe(100);
        });

        test('should return lower score for deviation', () => {
            RhythmAnalyzer.setExpectedIntervals([500, 500, 500]);
            // 25% deviation = 75% score
            const score = RhythmAnalyzer.calculateNoteDuration(1, 625);
            expect(score).toBe(50); // 100 - 25*2 = 50
        });
    });

    describe('Overall Timing Calculation', () => {
        test('should return beat score when no note onsets', () => {
            RhythmAnalyzer.setTempo(120);
            RhythmAnalyzer.recordBeat(1000);
            RhythmAnalyzer.recordBeat(1500);

            const score = RhythmAnalyzer.calculateOverallTiming();
            expect(score).toBe(100);
        });

        test('should combine beat and note scores', () => {
            RhythmAnalyzer.setTempo(120);
            RhythmAnalyzer.recordBeat(1000);
            RhythmAnalyzer.recordBeat(1500);
            RhythmAnalyzer.recordNoteOnset(1000);
            RhythmAnalyzer.recordNoteOnset(1500);
            RhythmAnalyzer.setExpectedIntervals([500]);

            const score = RhythmAnalyzer.calculateOverallTiming();
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('Tempo Map', () => {
        test('should return current tempo', () => {
            RhythmAnalyzer.setTempo(100);
            const map = RhythmAnalyzer.getTempoMap();
            expect(map.current).toBe(100);
        });

        test('should return beat deviations', () => {
            RhythmAnalyzer.setTempo(120);
            RhythmAnalyzer.recordBeat(1000); // First beat - no deviation
            RhythmAnalyzer.recordBeat(1550); // 50ms early (expected 1500)
            RhythmAnalyzer.recordBeat(2100); // 50ms early

            const map = RhythmAnalyzer.getTempoMap();
            expect(map.deviations).toEqual([0, 50, 50]);
        });
    });

    describe('Reset', () => {
        test('should clear all timestamps on reset', () => {
            RhythmAnalyzer.recordBeat(1000);
            RhythmAnalyzer.recordBeat(1500);
            RhythmAnalyzer.recordNoteOnset(1000);

            RhythmAnalyzer.reset();

            expect(RhythmAnalyzer.beatTimestamps).toEqual([]);
            expect(RhythmAnalyzer.noteOnsets).toEqual([]);
        });
    });

    describe('Timing Estimation', () => {
        test('should return 100 for zero notes or duration', () => {
            const score = RhythmAnalyzer.estimateTiming(0, 1000);
            expect(score).toBe(100);

            const score2 = RhythmAnalyzer.estimateTiming(5, 0);
            expect(score2).toBe(100);
        });

        test('should estimate timing based on note count', () => {
            // 120 BPM = 2 notes per second
            // 4 notes should take 2000ms
            RhythmAnalyzer.setTempo(120);
            const score = RhythmAnalyzer.estimateTiming(4, 2000);
            expect(score).toBe(100); // Perfect

            // 2500ms instead of 2000ms = 25% deviation = 75%
            const score2 = RhythmAnalyzer.estimateTiming(4, 2500);
            expect(score2).toBe(75);
        });
    });
});