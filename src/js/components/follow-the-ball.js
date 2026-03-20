/**
 * FollowTheBall Cursor Component
 * Provides a visually tracking cursor that moves across sheet music during practice
 * Features amber glow effect, smooth animation, and configurable speed
 */

class FollowTheBall {
    constructor(container, sheetMusicRenderer) {
        this.container = container;
        this.sheetMusicRenderer = sheetMusicRenderer;

        // Cursor state
        this.enabled = false;
        this.position = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };
        this.isOnPitch = false;
        this.isPlaying = false;
        this.isPaused = false;

        // Animation settings
        this.speed = 1.0; // 0.5x to 2x
        this.smoothing = 0.15;
        this.glowIntensity = 0;
        this.bounceOffset = 0;
        this.isBouncing = false;

        // Practice mode
        this.practiceMode = false;
        this.autoAdvance = false;
        this.currentNoteIndex = 0;
        this.upcomingHighlight = null;

        // Notes tracking
        this.notes = [];
        this.measureWidth = 0;
        this.noteWidth = 30;

        // UI Elements
        this.cursorElement = null;
        this.controlsElement = null;
        this.glowElement = null;

        // Animation frame
        this.animationFrameId = null;

        // LocalStorage key
        this.storageKey = 'concertmaster_cursor_enabled';
    }

    init() {
        // Check localStorage for saved preference
        const savedEnabled = localStorage.getItem(this.storageKey);
        this.enabled = savedEnabled === 'true';

        // Create cursor DOM elements
        this.createCursorElements();

        // Create controls UI
        this.createControls();

        // Setup settings toggle handler
        this.setupSettingsToggle();

        // Start animation loop
        this.startAnimationLoop();

        // Initial render state
        if (!this.enabled) {
            this.hideCursor();
        }
    }

    createCursorElements() {
        // Create cursor container
        this.cursorElement = document.createElement('div');
        this.cursorElement.className = 'follow-the-ball';
        this.cursorElement.style.display = 'none';

        // Create glow effect element
        this.glowElement = document.createElement('div');
        this.glowElement.className = 'cursor-glow';

        // Create the ball
        const ball = document.createElement('div');
        ball.className = 'cursor-ball';

        // Create inner highlight
        const highlight = document.createElement('div');
        highlight.className = 'cursor-highlight';

        ball.appendChild(highlight);
        this.glowElement.appendChild(ball);
        this.cursorElement.appendChild(this.glowElement);
        this.container.appendChild(this.cursorElement);
    }

    createControls() {
        // Create cursor controls container
        this.controlsElement = document.createElement('div');
        this.controlsElement.className = 'cursor-controls';
        this.controlsElement.style.display = 'none';

        // Speed control
        const speedControl = document.createElement('div');
        speedControl.className = 'cursor-control-group';
        speedControl.innerHTML = `
            <label for="cursor-speed-slider">Speed</label>
            <input type="range" id="cursor-speed-slider" min="0.5" max="2" step="0.1" value="1">
            <span class="speed-value">1.0x</span>
        `;

        // Jump to measure
        const jumpControl = document.createElement('div');
        jumpControl.className = 'cursor-control-group';
        jumpControl.innerHTML = `
            <label for="jump-to-measure">Measure</label>
            <input type="number" id="jump-to-measure" min="1" value="1">
            <button class="btn btn-small" id="jump-btn">Go</button>
        `;

        // Play/Pause button
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'cursor-control-btn';
        playPauseBtn.id = 'cursor-play-pause';
        playPauseBtn.innerHTML = `
            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
        `;

        // Practice mode toggle
        const practiceToggle = document.createElement('div');
        practiceToggle.className = 'cursor-control-group';
        practiceToggle.innerHTML = `
            <label for="practice-mode-toggle">Practice Mode</label>
            <button class="toggle-btn" id="practice-mode-toggle" role="switch" aria-checked="false">
                <span class="toggle-slider"></span>
            </button>
        `;

        // Append controls
        this.controlsElement.appendChild(speedControl);
        this.controlsElement.appendChild(jumpControl);
        this.controlsElement.appendChild(playPauseBtn);
        this.controlsElement.appendChild(practiceToggle);

        // Add to practice view or settings area
        const practiceView = document.getElementById('practice-view');
        if (practiceView) {
            practiceView.appendChild(this.controlsElement);
        }

        // Setup event handlers
        this.setupControlHandlers();
    }

    setupControlHandlers() {
        // Speed slider
        const speedSlider = document.getElementById('cursor-speed-slider');
        const speedValue = speedSlider?.parentElement?.querySelector('.speed-value');
        speedSlider?.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            if (speedValue) {
                speedValue.textContent = this.speed.toFixed(1) + 'x';
            }
        });

        // Jump to measure
        const jumpBtn = document.getElementById('jump-btn');
        const jumpInput = document.getElementById('jump-to-measure');
        jumpBtn?.addEventListener('click', () => {
            const measureNum = parseInt(jumpInput?.value) || 1;
            this.jumpToMeasure(measureNum);
        });

        // Play/Pause
        const playPauseBtn = document.getElementById('cursor-play-pause');
        playPauseBtn?.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Practice mode toggle
        const practiceToggle = document.getElementById('practice-mode-toggle');
        practiceToggle?.addEventListener('click', () => {
            this.practiceMode = !this.practiceMode;
            practiceToggle.classList.toggle('active', this.practiceMode);
            practiceToggle.setAttribute('aria-checked', this.practiceMode.toString());
        });
    }

    setupSettingsToggle() {
        const cursorToggle = document.getElementById('show-cursor-toggle');
        if (cursorToggle) {
            // Set initial state based on localStorage
            cursorToggle.classList.toggle('active', this.enabled);
            cursorToggle.setAttribute('aria-checked', this.enabled.toString());

            cursorToggle.addEventListener('click', () => {
                this.enabled = !this.enabled;
                localStorage.setItem(this.storageKey, this.enabled.toString());

                cursorToggle.classList.toggle('active', this.enabled);
                cursorToggle.setAttribute('aria-checked', this.enabled.toString());

                if (this.enabled) {
                    this.showCursor();
                } else {
                    this.hideCursor();
                }
            });
        }
    }

    showCursor() {
        if (this.cursorElement) {
            this.cursorElement.style.display = 'block';
        }
        if (this.controlsElement) {
            this.controlsElement.style.display = 'flex';
        }
    }

    hideCursor() {
        if (this.cursorElement) {
            this.cursorElement.style.display = 'none';
        }
        if (this.controlsElement) {
            this.controlsElement.style.display = 'none';
        }
    }

    startAnimationLoop() {
        const animate = () => {
            if (this.enabled && !this.isPaused) {
                // Smooth interpolation towards target position
                this.position.x += (this.targetPosition.x - this.position.x) * (this.smoothing * this.speed);
                this.position.y += (this.targetPosition.y - this.position.y) * (this.smoothing * this.speed);

                // Pulse glow effect
                const time = Date.now() / 1000;
                this.glowIntensity = 0.5 + 0.5 * Math.sin(time * 3);

                // Bounce animation
                if (this.isBouncing) {
                    this.bounceOffset = Math.sin(time * 15) * 5;
                } else {
                    this.bounceOffset = 0;
                }

                // Update DOM
                this.updateCursorPosition();
            }
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    updateCursorPosition() {
        if (!this.cursorElement) return;

        const x = this.position.x;
        const y = this.position.y + this.bounceOffset;

        // Position the cursor
        this.cursorElement.style.left = x + 'px';
        this.cursorElement.style.top = y + 'px';

        // Update glow color based on pitch accuracy
        const glowColor = this.isOnPitch ? 'rgba(201, 162, 39, ' : 'rgba(139, 41, 66, ';
        if (this.glowElement) {
            this.glowElement.style.setProperty('--glow-color', glowColor);
        }

        // Update ball color class
        const ball = this.cursorElement.querySelector('.cursor-ball');
        if (ball) {
            ball.classList.toggle('on-pitch', this.isOnPitch);
            ball.classList.toggle('off-pitch', !this.isOnPitch);
        }
    }

    setPosition(measureIndex, noteIndex, isOnPitch = false) {
        this.isOnPitch = isOnPitch;

        // Calculate target position from sheet music renderer
        if (this.sheetMusicRenderer) {
            const coords = this.getNoteCoordinates(measureIndex, noteIndex);
            if (coords) {
                this.targetPosition = { x: coords.x, y: coords.y };
            }
        }

        // Trigger bounce animation on note detection
        this.triggerBounce();

        // Update current note index for practice mode
        this.currentNoteIndex = noteIndex;
    }

    getNoteCoordinates(measureIndex, noteIndex) {
        if (!this.sheetMusicRenderer || !this.sheetMusicRenderer.score) return null;

        const canvas = this.sheetMusicRenderer.getCanvas();
        if (!canvas) return null;

        const startX = 100;
        const measures = this.sheetMusicRenderer.score.parts[0]?.measures || [];
        if (measureIndex >= measures.length) return null;

        const measureWidth = (canvas.width - 140) / Math.min(measures.length, 8);
        const measureX = startX + measureIndex * measureWidth;

        const measure = measures[measureIndex];
        if (!measure || noteIndex >= measure.notes.length) return null;

        const noteX = measureX + 20 + noteIndex * this.noteWidth;
        const noteY = this.getNoteY(measure.notes[noteIndex]);

        return { x: noteX, y: noteY };
    }

    getNoteY(note) {
        const steps = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
        const stepValue = steps[note.pitch.step] || 0;
        const octaveOffset = (note.pitch.octave - 4) * 7;
        const position = stepValue + octaveOffset;
        const middleLinePosition = 6;
        const diff = position - middleLinePosition;

        const staffY = 80;
        const lineSpacing = 10;
        return staffY + 20 - (diff * (lineSpacing / 2));
    }

    triggerBounce() {
        this.isBouncing = true;
        setTimeout(() => {
            this.isBouncing = false;
        }, 200);
    }

    jumpToMeasure(measureNum) {
        const measureIndex = measureNum - 1;
        this.currentNoteIndex = 0;

        if (this.sheetMusicRenderer && this.sheetMusicRenderer.score) {
            const measures = this.sheetMusicRenderer.score.parts[0]?.measures || [];
            if (measureIndex < measures.length) {
                const note = measures[measureIndex].notes[0];
                if (note) {
                    this.setPosition(measureIndex, 0, false);
                }
            }
        }
    }

    togglePlayPause() {
        this.isPaused = !this.isPaused;

        const playPauseBtn = document.getElementById('cursor-play-pause');
        const playIcon = playPauseBtn?.querySelector('.play-icon');
        const pauseIcon = playPauseBtn?.querySelector('.pause-icon');

        if (playIcon && pauseIcon) {
            playIcon.style.display = this.isPaused ? 'block' : 'none';
            pauseIcon.style.display = this.isPaused ? 'none' : 'block';
        }
    }

    setScore(score) {
        this.notes = [];
        this.currentNoteIndex = 0;

        // Extract all notes from score
        if (score && score.parts && score.parts.length > 0) {
            const part = score.parts[0];
            if (part.measures) {
                part.measures.forEach((measure, measureIndex) => {
                    measure.notes.forEach((note, noteIndex) => {
                        this.notes.push({
                            measureIndex,
                            noteIndex,
                            note
                        });
                    });
                });
            }
        }
    }

    // Handle zoom/pan from sheet music renderer
    handleZoom(scale, offsetX) {
        if (!this.cursorElement) return;

        // Adjust cursor position based on zoom/pan
        const transform = `scale(${scale}) translateX(${offsetX}px)`;
        // The cursor is positioned absolutely, so we adjust manually
    }

    // Highlight upcoming notes in practice mode
    highlightUpcomingNotes(count = 3) {
        if (!this.practiceMode || !this.sheetMusicRenderer) return;

        // This would integrate with the sheet music renderer to highlight upcoming notes
        // The sheet music renderer would handle the actual rendering of highlights
    }

    // Auto-advance to next note (practice mode)
    advanceToNextNote() {
        if (!this.practiceMode || this.currentNoteIndex >= this.notes.length - 1) return;

        this.currentNoteIndex++;
        const nextNote = this.notes[this.currentNoteIndex];
        if (nextNote) {
            this.setPosition(nextNote.measureIndex, nextNote.noteIndex, false);
        }
    }

    // Reset cursor to beginning
    reset() {
        this.currentNoteIndex = 0;
        if (this.notes.length > 0) {
            const firstNote = this.notes[0];
            this.setPosition(firstNote.measureIndex, firstNote.noteIndex, false);
        }
    }

    // Get current position info
    getPosition() {
        return {
            measureIndex: this.currentNoteIndex >= 0 && this.notes[this.currentNoteIndex]
                ? this.notes[this.currentNoteIndex].measureIndex
                : 0,
            noteIndex: this.currentNoteIndex,
            isOnPitch: this.isOnPitch
        };
    }

    // Cleanup
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.cursorElement && this.cursorElement.parentNode) {
            this.cursorElement.parentNode.removeChild(this.cursorElement);
        }
        if (this.controlsElement && this.controlsElement.parentNode) {
            this.controlsElement.parentNode.removeChild(this.controlsElement);
        }
    }
}

// Export for global use
window.FollowTheBall = FollowTheBall;