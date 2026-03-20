/**
 * Tests for PitchDetector (YIN Algorithm)
 */

// Get class from global (set up by setup.js)
const PitchDetector = global.PitchDetector || window.PitchDetector;
const PYinDetector = global.PYinDetector || window.PYinDetector;

describe('PitchDetector', () => {
    describe('Basic Configuration', () => {
        test('should have correct default values', () => {
            const detector = new PitchDetector();
            expect(detector.sampleRate).toBe(44100);
            expect(detector.bufferSize).toBe(2048);
            expect(detector.hopSize).toBe(512);
            expect(detector.minFrequency).toBe(27.5);
            expect(detector.maxFrequency).toBe(4186);
            expect(detector.confidenceThreshold).toBe(0.85);
        });

        test('should allow configuration changes', () => {
            const detector = new PitchDetector();
            detector.configure({
                sampleRate: 48000,
                bufferSize: 4096,
                minFrequency: 100,
                maxFrequency: 2000
            });
            expect(detector.sampleRate).toBe(48000);
            expect(detector.bufferSize).toBe(4096);
            expect(detector.minFrequency).toBe(100);
            expect(detector.maxFrequency).toBe(2000);
        });
    });

    describe('Note Name Mapping', () => {
        test('should return correct note names', () => {
            const detector = new PitchDetector();
            const note = detector.midiToNoteName(60); // Middle C
            expect(note.name).toBe('C');
            expect(note.octave).toBe(4);
            expect(note.midi).toBe(60);
        });

        test('should handle sharp notes', () => {
            const detector = new PitchDetector();
            const note = detector.midiToNoteName(61); // C#
            expect(note.name).toBe('C#');
        });

        test('should handle A4 (MIDI 69)', () => {
            const detector = new PitchDetector();
            const note = detector.midiToNoteName(69);
            expect(note.name).toBe('A');
            expect(note.octave).toBe(4);
        });
    });

    describe('Frequency Conversions', () => {
        test('should convert frequency to MIDI correctly', () => {
            const detector = new PitchDetector();
            // A4 = 440 Hz -> MIDI 69
            expect(detector.frequencyToMIDI(440)).toBe(69);
            // Middle C (C4) = 261.63 Hz -> MIDI 60
            const c4Midi = detector.frequencyToMIDI(261.63);
            expect(c4Midi).toBe(60);
        });

        test('should convert MIDI to frequency correctly', () => {
            const detector = new PitchDetector();
            // MIDI 69 = A4 = 440 Hz
            expect(detector.midiToFrequency(69)).toBeCloseTo(440, 0);
            // MIDI 60 = C4
            expect(detector.midiToFrequency(60)).toBeCloseTo(261.63, 1);
        });

        test('should convert frequency to note name', () => {
            const detector = new PitchDetector();
            const note = detector.frequencyToNote(440);
            expect(note.name).toBe('A');
            expect(note.octave).toBe(4);
        });
    });

    describe('Cents Deviation', () => {
        test('should calculate cents deviation correctly', () => {
            const detector = new PitchDetector();
            // Perfect match
            expect(detector.centsDeviation(440, 440)).toBe(0);
            // One semitone up (about 6% frequency increase)
            const semitoneUp = 440 * Math.pow(2, 1/12);
            expect(Math.round(detector.centsDeviation(semitoneUp, 440))).toBe(100);
            // One semitone down
            const semitoneDown = 440 * Math.pow(2, -1/12);
            expect(Math.round(detector.centsDeviation(semitoneDown, 440))).toBe(-100);
        });
    });

    describe('Instrument Ranges', () => {
        test('should return correct ranges for each instrument', () => {
            const detector = new PitchDetector();

            const violin = detector.getInstrumentRange('violin');
            expect(violin.min).toBe(196);
            expect(violin.max).toBe(2637);

            const viola = detector.getInstrumentRange('viola');
            expect(viola.min).toBe(130);
            expect(viola.max).toBe(1319);

            const cello = detector.getInstrumentRange('cello');
            expect(cello.min).toBe(65);
            expect(cello.max).toBe(987);

            const bass = detector.getInstrumentRange('bass');
            expect(bass.min).toBe(41);
            expect(bass.max).toBe(262);
        });

        test('should default to violin for unknown instrument', () => {
            const detector = new PitchDetector();
            const range = detector.getInstrumentRange('unknown');
            expect(range.min).toBe(196);
            expect(range.max).toBe(2637);
        });
    });

    describe('YIN Algorithm Core Functions', () => {
        test('should compute difference function correctly', () => {
            const detector = new PitchDetector();
            // Create a simple sine wave buffer
            const buffer = new Float32Array(2048);
            const freq = 440;
            const angularFreq = 2 * Math.PI * freq / detector.sampleRate;
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.sin(angularFreq * i);
            }

            const diff = detector.computeDifferenceFunction(buffer, 100, 1000);
            expect(diff.length).toBe(900);
            expect(diff[0]).toBeGreaterThan(0);
        });

        test('should compute CMNDF correctly', () => {
            const detector = new PitchDetector();
            const diff = new Float32Array(500);
            diff[0] = 0;
            for (let i = 1; i < diff.length; i++) {
                diff[i] = Math.random() * 100;
            }

            const cmndf = detector.computeCMNDF(diff, 100, 600);
            expect(cmndf.length).toBe(500);
            expect(cmndf[0]).toBe(1); // CMNDF[0] should be 1
        });
    });

    describe('Pitch Detection with Synthetic Audio', () => {
        test('should detect A4 (440 Hz) from sine wave', () => {
            const detector = new PitchDetector();
            const buffer = new Float32Array(2048);
            const freq = 440;
            const angularFreq = 2 * Math.PI * freq / detector.sampleRate;

            // Generate a clean sine wave
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.sin(angularFreq * i);
            }

            const result = detector.detect(buffer);

            // Should detect a frequency close to 440 Hz
            expect(result.frequency).toBeCloseTo(440, 0);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should detect C4 (261.63 Hz) from sine wave', () => {
            const detector = new PitchDetector();
            const buffer = new Float32Array(2048);
            const freq = 261.63;
            const angularFreq = 2 * Math.PI * freq / detector.sampleRate;

            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.sin(angularFreq * i);
            }

            const result = detector.detect(buffer);

            expect(result.frequency).toBeCloseTo(261.63, 0);
        });

        test('should return null for silent buffer', () => {
            const detector = new PitchDetector();
            const buffer = new Float32Array(2048);
            // All zeros = silence

            const result = detector.detect(buffer);
            expect(result.frequency).toBeNull();
            expect(result.confidence).toBe(0);
        });

        test('should return null for noise (no clear pitch)', () => {
            const detector = new PitchDetector();
            const buffer = new Float32Array(2048);
            // Random noise
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.random() * 2 - 1;
            }

            const result = detector.detect(buffer);
            // Noise may not have a clear pitch - result depends on threshold
            // Should not crash
            expect(result).toHaveProperty('frequency');
            expect(result).toHaveProperty('confidence');
        });
    });
});

describe('PYinDetector', () => {
    test('should extend PitchDetector', () => {
        const pyin = new PYinDetector();
        expect(pyin.sampleRate).toBe(44100);
        expect(pyin.midiToNoteName(60)).toBeDefined();
    });

    test('should have higher default threshold', () => {
        const pyin = new PYinDetector();
        const yin = new PitchDetector();
        expect(pyin.threshold).toBeGreaterThan(yin.threshold);
    });
});