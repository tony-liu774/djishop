/**
 * Onboarding Service - First-run experience and instrument calibration
 * Handles permissions, instrument selection, and preference storage
 */

class OnboardingService {
    constructor() {
        this.STORAGE_KEY = 'concertmaster_onboarding';
        this.PREFERENCES_KEY = 'concertmaster_preferences';
        this.PERMISSIONS_KEY = 'concertmaster_permissions';

        // Default preferences
        this.defaultPreferences = {
            instrument: 'violin',
            confidenceThreshold: 0.85,
            showHeatMap: true,
            showCursor: false,
            tempo: 120
        };

        // Instrument frequency ranges (Hz)
        this.instrumentRanges = {
            violin: { min: 196, max: 2637, name: 'Violin' },    // G3 to E7
            viola: { min: 130, max: 1760, name: 'Viola' },      // C3 to A6
            cello: { min: 65, max: 987, name: 'Cello' },        // C2 to B5
            bass: { min: 41, max: 523, name: 'Double Bass' }    // E1 to C4
        };

        // Sympathetic vibration frequencies to filter (Hz)
        // These are common string open string resonances
        this.sympatheticFilters = {
            violin: [196, 293, 392, 493],  // G, D, A, E open strings
            viola: [130, 174, 261, 349],   // C, G, D, A open strings
            cello: [65, 82, 98, 131],       // C, G, D, A open strings
            bass: [41, 55, 73, 98]          // E, A, D, G open strings (orchestral)
        };
    }

    /**
     * Check if this is the first time the user is launching the app
     */
    isFirstRun() {
        const onboardingData = localStorage.getItem(this.STORAGE_KEY);
        return !onboardingData;
    }

    /**
     * Check if onboarding has been completed
     */
    isOnboardingComplete() {
        const onboardingData = localStorage.getItem(this.STORAGE_KEY);
        if (!onboardingData) return false;

        try {
            const data = JSON.parse(onboardingData);
            return data.completed === true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Save onboarding completion status
     */
    completeOnboarding() {
        const data = {
            completed: true,
            completedAt: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Get user preferences from localStorage
     */
    getPreferences() {
        const prefs = localStorage.getItem(this.PREFERENCES_KEY);
        if (!prefs) {
            return { ...this.defaultPreferences };
        }

        try {
            return { ...this.defaultPreferences, ...JSON.parse(prefs) };
        } catch (e) {
            return { ...this.defaultPreferences };
        }
    }

    /**
     * Save user preferences to localStorage
     */
    savePreferences(preferences) {
        const current = this.getPreferences();
        const updated = { ...current, ...preferences };
        localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated));
        return updated;
    }

    /**
     * Get saved permissions status
     */
    getPermissions() {
        const perms = localStorage.getItem(this.PERMISSIONS_KEY);
        if (!perms) {
            return { microphone: false, camera: false };
        }

        try {
            return JSON.parse(perms);
        } catch (e) {
            return { microphone: false, camera: false };
        }
    }

    /**
     * Save permissions status
     */
    savePermissions(permissions) {
        const current = this.getPermissions();
        const updated = { ...current, ...permissions };
        localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(updated));
    }

    /**
     * Get instrument frequency range for DSP filtering
     */
    getInstrumentRange(instrument) {
        return this.instrumentRanges[instrument] || this.instrumentRanges.violin;
    }

    /**
     * Get sympathetic vibration frequencies for the selected instrument
     */
    getSympatheticFrequencies(instrument) {
        return this.sympatheticFilters[instrument] || [];
    }

    /**
     * Apply instrument calibration to pitch detector
     * Configures the pitch detector with instrument-specific frequency ranges
     */
    calibrateForInstrument(pitchDetector, instrument) {
        const range = this.getInstrumentRange(instrument);

        // Configure pitch detector with instrument-specific frequency range
        pitchDetector.configure({
            minFrequency: range.min,
            maxFrequency: range.max
        });

        console.log(`Pitch detector calibrated for ${instrument}: ${range.min}Hz - ${range.max}Hz`);

        return {
            minFrequency: range.min,
            maxFrequency: range.max,
            sympatheticFrequencies: this.getSympatheticFrequencies(instrument)
        };
    }

    /**
     * Check if a frequency is within the selected instrument's range
     */
    isInInstrumentRange(frequency, instrument) {
        const range = this.getInstrumentRange(instrument);
        return frequency >= range.min && frequency <= range.max;
    }

    /**
     * Check if a frequency is a sympathetic vibration (should be filtered)
     */
    isSympatheticVibration(frequency, instrument, threshold = 10) {
        const sympatheticFreqs = this.getSympatheticFrequencies(instrument);

        for (const symFreq of sympatheticFreqs) {
            // Check if within threshold Hz of a sympathetic frequency
            if (Math.abs(frequency - symFreq) < threshold) {
                return true;
            }
        }
        return false;
    }

    /**
     * Filter out sympathetic vibrations from detected frequencies
     */
    filterSympatheticVibrations(frequencies, instrument) {
        return frequencies.filter(freq => !this.isSympatheticVibration(freq, instrument));
    }

    /**
     * Request microphone permission
     */
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Stop the stream immediately after getting permission
            stream.getTracks().forEach(track => track.stop());

            this.savePermissions({ microphone: true });
            return { granted: true };
        } catch (error) {
            console.error('Microphone permission denied:', error);
            this.savePermissions({ microphone: false });
            return { granted: false, error: error.message };
        }
    }

    /**
     * Request camera permission
     */
    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment'
                }
            });

            // Stop the stream immediately after getting permission
            stream.getTracks().forEach(track => track.stop());

            this.savePermissions({ camera: true });
            return { granted: true };
        } catch (error) {
            console.error('Camera permission denied:', error);
            this.savePermissions({ camera: false });
            return { granted: false, error: error.message };
        }
    }

    /**
     * Request both microphone and camera permissions
     */
    async requestAllPermissions() {
        const [microphoneResult, cameraResult] = await Promise.all([
            this.requestMicrophonePermission(),
            this.requestCameraPermission()
        ]);

        return {
            microphone: microphoneResult,
            camera: cameraResult
        };
    }

    /**
     * Get all available instruments
     */
    getAvailableInstruments() {
        return Object.entries(this.instrumentRanges).map(([id, data]) => ({
            id,
            name: data.name,
            minFrequency: data.min,
            maxFrequency: data.max
        }));
    }

    /**
     * Skip onboarding (for returning users)
     */
    skipOnboarding() {
        this.completeOnboarding();
    }

    /**
     * Reset onboarding (for testing/debugging)
     */
    resetOnboarding() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.PREFERENCES_KEY);
        localStorage.removeItem(this.PERMISSIONS_KEY);
    }
}

// Export for use in other modules
window.OnboardingService = OnboardingService;
