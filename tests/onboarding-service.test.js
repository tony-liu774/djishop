/**
 * Tests for OnboardingService
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock navigator.mediaDevices
global.navigator.mediaDevices = {
    getUserMedia: jest.fn()
};

// Import the service after mocks are set up - it attaches to window
require('../src/js/services/onboarding-service.js');
const { OnboardingService } = window;

describe('OnboardingService', () => {
    let service;

    beforeEach(() => {
        localStorageMock.clear();
        jest.clearAllMocks();
        service = new OnboardingService();
    });

    describe('isFirstRun', () => {
        test('returns true when no onboarding data exists', () => {
            expect(service.isFirstRun()).toBe(true);
        });

        test('returns false when onboarding data exists', () => {
            localStorageMock.setItem('concertmaster_onboarding', JSON.stringify({ completed: true }));
            expect(service.isFirstRun()).toBe(false);
        });
    });

    describe('isOnboardingComplete', () => {
        test('returns false when no onboarding data exists', () => {
            expect(service.isOnboardingComplete()).toBe(false);
        });

        test('returns true when onboarding is completed', () => {
            localStorageMock.setItem('concertmaster_onboarding', JSON.stringify({ completed: true }));
            expect(service.isOnboardingComplete()).toBe(true);
        });

        test('returns false when onboarding is not completed', () => {
            localStorageMock.setItem('concertmaster_onboarding', JSON.stringify({ completed: false }));
            expect(service.isOnboardingComplete()).toBe(false);
        });
    });

    describe('completeOnboarding', () => {
        test('saves completed status to localStorage', () => {
            service.completeOnboarding();
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'concertmaster_onboarding',
                expect.stringContaining('"completed":true')
            );
        });
    });

    describe('getPreferences', () => {
        test('returns default preferences when none saved', () => {
            const prefs = service.getPreferences();
            expect(prefs.instrument).toBe('violin');
            expect(prefs.confidenceThreshold).toBe(0.85);
            expect(prefs.showHeatMap).toBe(true);
        });

        test('returns saved preferences', () => {
            localStorageMock.setItem('concertmaster_preferences', JSON.stringify({
                instrument: 'cello',
                confidenceThreshold: 0.9
            }));
            const prefs = service.getPreferences();
            expect(prefs.instrument).toBe('cello');
            expect(prefs.confidenceThreshold).toBe(0.9);
        });
    });

    describe('savePreferences', () => {
        test('saves preferences to localStorage', () => {
            service.savePreferences({ instrument: 'viola' });
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'concertmaster_preferences',
                expect.stringContaining('"instrument":"viola"')
            );
        });

        test('merges with existing preferences', () => {
            localStorageMock.setItem('concertmaster_preferences', JSON.stringify({
                instrument: 'cello',
                confidenceThreshold: 0.9
            }));
            service.savePreferences({ instrument: 'bass' });
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'concertmaster_preferences',
                expect.stringContaining('"instrument":"bass"')
            );
        });
    });

    describe('getInstrumentRange', () => {
        test('returns correct range for violin', () => {
            const range = service.getInstrumentRange('violin');
            expect(range.min).toBe(196);
            expect(range.max).toBe(2637);
            expect(range.name).toBe('Violin');
        });

        test('returns correct range for viola', () => {
            const range = service.getInstrumentRange('viola');
            expect(range.min).toBe(130);
            expect(range.max).toBe(1760);
        });

        test('returns correct range for cello', () => {
            const range = service.getInstrumentRange('cello');
            expect(range.min).toBe(65);
            expect(range.max).toBe(987);
        });

        test('returns correct range for bass', () => {
            const range = service.getInstrumentRange('bass');
            expect(range.min).toBe(41);
            expect(range.max).toBe(523);
        });

        test('returns violin range for unknown instrument', () => {
            const range = service.getInstrumentRange('unknown');
            expect(range.min).toBe(196);
            expect(range.max).toBe(2637);
        });
    });

    describe('getSympatheticFrequencies', () => {
        test('returns sympathetic frequencies for violin', () => {
            const freqs = service.getSympatheticFrequencies('violin');
            expect(freqs).toEqual([196, 293, 392, 493]);
        });

        test('returns sympathetic frequencies for viola', () => {
            const freqs = service.getSympatheticFrequencies('viola');
            expect(freqs).toEqual([130, 174, 261, 349]);
        });
    });

    describe('isInInstrumentRange', () => {
        test('returns true for frequency within range', () => {
            expect(service.isInInstrumentRange(440, 'violin')).toBe(true);
        });

        test('returns false for frequency below range', () => {
            expect(service.isInInstrumentRange(50, 'violin')).toBe(false);
        });

        test('returns false for frequency above range', () => {
            expect(service.isInInstrumentRange(3000, 'violin')).toBe(false);
        });
    });

    describe('isSympatheticVibration', () => {
        test('returns true for sympathetic frequency within threshold', () => {
            expect(service.isSympatheticVibration(197, 'violin', 10)).toBe(true);
        });

        test('returns false for non-sympathetic frequency', () => {
            expect(service.isSympatheticVibration(440, 'violin', 10)).toBe(false);
        });

        test('returns false for frequency outside threshold', () => {
            expect(service.isSympatheticVibration(210, 'violin', 10)).toBe(false);
        });
    });

    describe('getAvailableInstruments', () => {
        test('returns all available instruments', () => {
            const instruments = service.getAvailableInstruments();
            expect(instruments.length).toBe(4);
            expect(instruments.map(i => i.id)).toContain('violin');
            expect(instruments.map(i => i.id)).toContain('viola');
            expect(instruments.map(i => i.id)).toContain('cello');
            expect(instruments.map(i => i.id)).toContain('bass');
        });
    });

    describe('skipOnboarding', () => {
        test('marks onboarding as complete', () => {
            service.skipOnboarding();
            expect(service.isOnboardingComplete()).toBe(true);
        });
    });

    describe('resetOnboarding', () => {
        test('clears all onboarding data', () => {
            service.completeOnboarding();
            service.savePreferences({ instrument: 'cello' });
            service.savePermissions({ microphone: true });

            service.resetOnboarding();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('concertmaster_onboarding');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('concertmaster_preferences');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('concertmaster_permissions');
        });
    });

    describe('requestMicrophonePermission', () => {
        test('returns granted true when permission granted', async () => {
            const mockStream = {
                getTracks: jest.fn(() => [{ stop: jest.fn() }])
            };
            navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

            const result = await service.requestMicrophonePermission();

            expect(result.granted).toBe(true);
        });

        test('returns granted false when permission denied', async () => {
            navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Denied'));

            const result = await service.requestMicrophonePermission();

            expect(result.granted).toBe(false);
        });
    });

    describe('requestCameraPermission', () => {
        test('returns granted true when permission granted', async () => {
            const mockStream = {
                getTracks: jest.fn(() => [{ stop: jest.fn() }])
            };
            navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

            const result = await service.requestCameraPermission();

            expect(result.granted).toBe(true);
        });

        test('returns granted false when permission denied', async () => {
            navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Denied'));

            const result = await service.requestCameraPermission();

            expect(result.granted).toBe(false);
        });
    });
});
