// Jest test setup - make browser classes available globally
// This runs after the test environment is set up
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// FIRST: Set up the window object BEFORE loading source files
global.window = global;
global.Float32Array = Float32Array;
global.Uint8Array = Uint8Array;

// Helper to load source files using vm with proper context
function loadSourceFile(filename) {
    const filePath = path.join(__dirname, '..', 'src', 'js', filename);
    if (fs.existsSync(filePath)) {
        const code = fs.readFileSync(filePath, 'utf8');
        // Create a context with window/global
        const context = {
            window: global,
            console: console,
            setTimeout: setTimeout,
            setInterval: setInterval,
            clearTimeout: clearTimeout,
            clearInterval: clearInterval,
            Math: Math,
            Array: Array,
            Object: Object,
            String: String,
            Number: Number,
            Float32Array: Float32Array
        };
        vm.createContext(context);
        // Run the code in the context
        vm.runInContext(code, context);
        // Copy all exported classes to global
        Object.keys(context).forEach(key => {
            if (context[key] && typeof context[key] === 'function' && key !== 'setTimeout') {
                global[key] = context[key];
                global.window[key] = context[key];
            }
        });
    }
}

// Load all source files that define window classes
loadSourceFile('models/sheet-music.js');
loadSourceFile('audio/pitch-detector.js');
loadSourceFile('audio/audio-engine.js');
loadSourceFile('audio/metronome.js');
loadSourceFile('audio/instrument-detector.js');
loadSourceFile('analysis/performance-comparator.js');
loadSourceFile('metrics/accuracy-scorer.js');
loadSourceFile('metrics/rhythm-analyzer.js');

// Mock global browser objects
global.document = {
  createElement: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    remove: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => {},
    getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0 })
  }),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: {
    appendChild: () => {},
    removeChild: () => {}
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.navigator = {
  userAgent: 'node.js',
  mediaDevices: {
    getUserMedia: jest.fn(),
    enumerateDevices: jest.fn()
  }
};

global.AudioContext = function() {
  this.state = 'running';
  this.sampleRate = 44100;
  this.resume = jest.fn().mockResolvedValue();
  this.createAnalyser = () => ({
    fftSize: 4096,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 2048,
    getFloatTimeDomainData: () => {},
    getByteFrequencyData: () => {},
    connect: () => {}
  });
  this.createGain = () => ({
    gain: { value: 1 },
    connect: () => {}
  });
  this.createMediaStreamSource = () => ({
    connect: () => {},
    disconnect: () => {}
  });
  this.close = jest.fn().mockResolvedValue();
};
global.AudioContext.prototype = {};

global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random()
};

global.indexedDB = {
  open: () => ({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: {
      objectStoreNames: { contains: () => false },
      transaction: () => ({
        objectStore: () => ({
          getAll: () => ({ onsuccess: null, result: [] }),
          add: () => ({ onsuccess: null }),
          delete: () => ({ onsuccess: null })
        })
      })
    }
  })
};

console.log('Test setup loaded');