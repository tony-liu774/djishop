# The Virtual Concertmaster - Remaining Features Plan

## Goal Summary

Complete three incomplete features for "The Virtual Concertmaster" music app:
1. Community Library Module - full implementation with high-resolution zoom and upload capability
2. Follow-the-ball cursor - complete the cursor component that connects to the settings toggle
3. AI Performance Coach - integrate the three-axis analysis (pitch, rhythm, intonation) with the digital score feedback display

## Approach

The existing codebase has partial implementations:
- UI structure exists for the library (import modal, search, grid display)
- Settings toggle exists for the cursor but the component is missing
- Analysis modules (accuracy-scorer.js, rhythm-analyzer.js) exist but aren't fully connected

This plan focuses on completing the integration and building the missing components while maintaining the Midnight Conservatory aesthetic.

---

## Task 1: Community Library Module - Full Implementation

### Description
Complete the library module with high-resolution zoom for browsing and uploading shared sheet music. The UI skeleton exists but scan/upload functionality is missing.

### Subtasks

1. **Create Library Service** - Implement `src/js/services/library-service.js` to manage library CRUD operations
   - Add methods for adding, removing, and updating scores in IndexedDB
   - Implement search functionality across title, composer, and instrument
   - Add metadata management (difficulty, last practiced, practice count)

2. **Implement High-Resolution Zoom** - Add zoom controls to the sheet music viewer
   - Add zoom buttons (+/-) to the practice view
   - Implement pan functionality for zoomed content
   - Add smooth zoom transitions with CSS transforms
   - Support mouse wheel zoom and pinch-to-zoom on mobile

3. **Complete Image Scanning Flow** - Implement OMR scanning integration
   - Connect the "Scan Music" button to camera/file input
   - Add image preprocessing (crop, enhance contrast)
   - Integrate with existing `src/js/services/omr-client.js` for backend OMR service
   - Display scan progress with visual feedback
   - Handle errors gracefully with retry option

4. **Add Shared Music Upload UI** - Create upload flow for community scores
   - Add "Share" button to library cards
   - Create upload modal with metadata fields (title, composer, difficulty, tags)
   - Implement file validation (MusicXML, PDF, image formats)
   - Add upload progress indicator

5. **Add Library Card Enhancements** - Improve the library grid cards
   - Add thumbnail preview of first measure
   - Add difficulty rating display (1-5 stars)
   - Add "last practiced" date
   - Add hover preview functionality

### Acceptance Criteria
- [ ] Library displays with zoom controls (+/- buttons visible)
- [ ] Zoom works smoothly from 50% to 200%
- [ ] "Scan Music" button opens camera/file picker and processes image via omr-client.js
- [ ] Scores can be imported via file upload
- [ ] Library cards show thumbnail, difficulty, and last practiced
- [ ] Search filters library in real-time

### Depends On
- None (this builds on existing UI structure and omr-client.js)

### Agent Type
- Coder

---

## Task 2: Follow-the-Ball Cursor Component

### Description
Complete the follow-the-ball cursor that visually tracks progress across the sheet music. The settings toggle exists but the actual cursor component is missing.

**Note:** This task is independent from Task 1. The cursor can work with any loaded score without requiring the library module to be complete.

### Subtasks

1. **Create FollowTheBall Component** - Build `src/js/components/follow-the-ball.js`
   - Create cursor element with ball graphic (CSS/Canvas)
   - Add smooth animation for cursor movement
   - Implement position tracking based on performance comparator
   - Add configurable speed (slow/medium/fast)

2. **Integrate with Settings Toggle** - Connect the existing toggle to the cursor component
   - Read toggle state in app.js
   - Enable/disable cursor based on setting
   - Persist setting to localStorage

3. **Add Visual Enhancements** - Improve cursor visibility and aesthetics
   - Add amber glow effect matching the theme
   - Animate cursor bounce on note detection
   - Add "practice mode" without audio (auto-advance)
   - Highlight upcoming notes in the score

4. **Add Cursor Controls UI** - Add speed control to settings
   - Add speed slider (0.5x to 2x tempo)
   - Add "jump to measure" input
   - Add pause/play cursor button

5. **Connect to Sheet Music Renderer** - Integrate cursor with existing renderer
   - Pass cursor element to sheet music renderer
   - Update cursor position on setCursorPosition calls
   - Handle zoom/pan interactions with cursor

### Acceptance Criteria
- [ ] Toggle in settings enables/disables cursor
- [ ] Ball cursor moves smoothly across sheet music during practice
- [ ] Cursor position syncs with detected notes
- [ ] Speed control adjusts cursor timing
- [ ] Cursor has amber glow effect matching Midnight Conservatory theme

### Depends On
- None (works with any loaded score from existing sheet-music-renderer.js)

### Agent Type
- Coder

---

## Task 3: AI Performance Coach - Three-Axis Integration

### Description
Integrate the three-axis analysis (pitch, rhythm, intonation) with the digital score feedback display. The analysis modules exist but aren't fully connected to the UI.

### Subtasks

1. **Connect Rhythm Analyzer to Feedback Display** - Link rhythm-analyzer.js to the timing display
   - Update `processAudio()` in app.js to record note onsets
   - Connect rhythm analyzer output to timing-display element
   - Show milliseconds early/late instead of "0ms" placeholder

2. **Implement Intonation Analysis** - Create the third axis combining pitch and timing
   - Create `src/js/analysis/intonation-analyzer.js` or add to existing module
   - Calculate overall musicality score combining:
     - Pitch accuracy (from accuracy-scorer)
     - Rhythm precision (from rhythm-analyzer)
     - Note transition smoothness
   - Display intonation score in feedback panel

3. **Enhance Feedback Panel UI** - Update the visual feedback display
   - Add intonation score display (three-axis visualization)
   - Add visual indicator for each axis (pitch/rhythm/intonation)
   - Add historical trend mini-graph
   - Add color-coded status for each axis (emerald/crimson)

4. **Add Real-Time Score Breakdown** - Show detailed feedback during practice
   - Update accuracy-score element with combined three-axis score
   - Show individual axis scores (pitch %, rhythm %, intonation %)
   - Add smooth number transitions on score updates

5. **Add Session Summary Enhancement** - Improve post-practice analysis
   - Show three-axis breakdown in session summary modal
   - Add radar chart visualization for the three axes
   - Add recommendations based on weakest axis
   - Store three-axis data for historical comparison

### Acceptance Criteria
- [ ] Timing display shows actual milliseconds (not "0ms")
- [ ] Intonation score combines pitch and rhythm
- [ ] Feedback panel shows three-axis visualization
- [ ] Accuracy score reflects three-axis calculation
- [ ] Session summary shows three-axis breakdown with radar chart
- [ ] Emerald color for good intonation, crimson for poor

### Depends On
- Task 2 (Follow-the-ball cursor - for visual context during practice)

### Agent Type
- Coder

---

## Task 4: Integration & Polish

### Description
Ensure all three features work together seamlessly and apply final Midnight Conservatory aesthetic polish.

### Subtasks

1. **Cross-Feature Integration** - Ensure features work together
   - Library zoom works during cursor movement
   - Cursor speed affects rhythm analysis
   - Three-axis scores persist with session data

2. **Performance Optimization** - Ensure smooth 60fps
   - Optimize canvas rendering for cursor movement
   - Debounce rhythm analysis calculations
   - Lazy load library thumbnails

3. **Accessibility Enhancement** - Improve usability
   - Add keyboard navigation for library
   - Add ARIA labels for feedback panel
   - Add screen reader announcements for score changes

4. **Theme Consistency** - Apply Midnight Conservatory polish
   - Ensure all new elements use theme colors
   - Add soft glow effects to interactive elements
   - Verify typography matches spec (Playfair Display, Source Sans 3)

### Acceptance Criteria
- [ ] All three features integrate seamlessly
- [ ] Animations run at 60fps
- [ ] Theme colors applied consistently
- [ ] Keyboard navigation works

### Depends On
- Task 1, Task 2, Task 3

### Agent Type
- Coder (general)

---

## Changes Required

All changes must be on a feature branch with a GitHub PR created via `gh pr create`.

### File Changes Summary

**New Files to Create:**
- `src/js/services/library-service.js` - Library CRUD service
- `src/js/components/follow-the-ball.js` - Cursor component
- `src/js/analysis/intonation-analyzer.js` - Intonation analysis

**Files to Modify:**
- `src/js/app.js` - Connect new components, integrate rhythm analyzer
- `src/index.html` - Add zoom controls, enhance feedback panel
- `src/css/styles.css` - Add cursor styles, zoom controls, feedback panel enhancements
- `src/js/components/sheet-music-renderer.js` - Add zoom support, integrate cursor

**Existing Files to Leverage:**
- `src/js/services/omr-client.js` - Already exists for OMR backend integration
