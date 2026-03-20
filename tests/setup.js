// Jest test setup - make browser classes available globally
// This runs after the test environment is set up
const fs = require('fs');
const path = require('path');

// FIRST: Set up the window object BEFORE loading source files
global.window = global;

// Helper to load source files - execute code in global scope
function loadSourceFile(filename) {
    const filePath = path.join(__dirname, '..', 'src', 'js', filename);
    if (fs.existsSync(filePath)) {
        const code = fs.readFileSync(filePath, 'utf8');
        // Execute in the global context
        // We use indirect eval to execute in global scope
        (0, eval)(code);
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