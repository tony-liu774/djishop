/**
 * Tests for RhythmAnalyzer
 */

// Get class from global (set up by setup.js)
const RhythmAnalyzer = global.RhythmAnalyzer || window.RhythmAnalyzer;

describe('RhythmAnalyzer', () => {
    let analyzer;

    beforeEach(() => {
        analyzer = new RhythmAnalyzer();
    });

    describe('Tempo Setting', () => {
        test('should set tempo correctly', () => {
            analyzer.setTempo(100);
            expect(analyzer.tempo).toBe(100);
        });

        test('should store tempo in constructor', () => {
            const a = new RhythmAnalyzer();
            expect(a.tempo).toBe(120); // Default
        });
    });

    describe('Beat Recording', () => {
        test('should record beat timestamps', () => {
            analyzer.recordBeat(1000);
            analyzer.recordBeat(1500);
            expect(analyzer.beatTimestamps).toEqual([1000, 1500]);
        });
    });

    describe('Note Onset Recording', () => {
        test('should record note onsets', () => {
            analyzer.recordNoteOnset(1000);
            analyzer.recordNoteOnset(1300);
            expect(analyzer.noteOnsets).toEqual([1000, 1300]);
        });
    });

    describe('Expected Intervals', () => {
        test('should set expected intervals', () => {
            const intervals = [500, 500, 1000]; // ms
            analyzer.setExpectedIntervals(intervals);
            expect(analyzer.expectedIntervals).toEqual(intervals);
        });
    });

    describe('Beat Deviation Calculation', () => {
        test('should return 100 for less than 2 beats', () => {
            const score = analyzer.calculateBeatDeviation();
            expect(score).toBe(100);
        });

        test('should return 100 for perfect timing at 120 BPM', () => {
            // 120 BPM = 500ms per beat
            analyzer.setTempo(120);
            analyzer.recordBeat(1000);
            analyzer.recordBeat(1500); // 500ms later - perfect
            analyzer.recordBeat(2000); // 500ms later - perfect

            const score = analyzer.calculateBeatDeviation();
            expect(score).toBe(100);
        });

        test('should return lower score for imperfect timing', () => {
            // 120 BPM = 500ms per beat
            analyzer.setTempo(120);
            analyzer.recordBeat(1000);
            analyzer.recordBeat(1550); // 550ms (50ms early)
            analyzer.recordBeat(2100); // 550ms (50ms early)

            const score = analyzer.calculateBeatDeviation();
            expect(score).toBeLessThan(100);
            expect(score).toBeGreaterThan(0);
        });
    });

    describe('Note Duration Calculation', () => {
        test('should return default 75 for missing expected interval', () => {
            const score = analyzer.calculateNoteDuration(5, 500);
            expect(score).toBe(75);
        });

        test('should return 100 for perfect duration match', () => {
            analyzer.setExpectedIntervals([500, 500, 500]);
            const score = analyzer.calculateNoteDuration(1, 500); // index 1 = second note
            expect(score).toBe(100);
        });

        test('should return lower score for deviation', () => {
            analyzer.setExpectedIntervals([500, 500, 500]);
            // 25% deviation = 75% score
            const score = analyzer.calculateNoteDuration(1, 625);
            expect(score).toBe(50); // 100 - 25*2 = 50
        });
    });

    describe('Overall Timing Calculation', () => {
        test('should return beat score when no note onsets', () => {
            analyzer.setTempo(120);
            analyzer.recordBeat(1000);
            analyzer.recordBeat(1500);

            const score = analyzer.calculateOverallTiming();
            expect(score).toBe(100);
        });
    });

    describe('Tempo Map', () => {
        test('should return current tempo', () => {
            analyzer.setTempo(100);
            const map = analyzer.getTempoMap();
            expect(map.current).toBe(100);
        });

        test('should return beat deviations', () => {
            analyzer.setTempo(120);
            analyzer.recordBeat(1000); // First beat - no deviation
            analyzer.recordBeat(1550); // 50ms early (expected 1500)
            analyzer.recordBeat(2100); // 50ms early

            const map = analyzer.getTempoMap();
            expect(map.deviations).toEqual([0, 50, 50]);
        });
    });

    describe('Reset', () => {
        test('should clear all timestamps on reset', () => {
            analyzer.recordBeat(1000);
            analyzer.recordBeat(1500);
            analyzer.recordNoteOnset(1000);

            analyzer.reset();

            expect(analyzer.beatTimestamps).toEqual([]);
            expect(analyzer.noteOnsets).toEqual([]);
        });
    });

    describe('Timing Estimation', () => {
        test('should return 100 for zero notes or duration', () => {
            const score = analyzer.estimateTiming(0, 1000);
            expect(score).toBe(100);

            const score2 = analyzer.estimateTiming(5, 0);
            expect(score2).toBe(100);
        });

        test('should estimate timing based on note count', () => {
            // 120 BPM = 2 notes per second
            // 4 notes should take 2000ms
            analyzer.setTempo(120);
            const score = analyzer.estimateTiming(4, 2000);
            expect(score).toBe(100); // Perfect

            // 2500ms instead of 2000ms = 25% deviation = 75%
            const score2 = analyzer.estimateTiming(4, 2500);
            expect(score2).toBe(75);
        });
    });
});
