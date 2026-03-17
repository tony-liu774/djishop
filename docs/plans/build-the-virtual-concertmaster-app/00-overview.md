# The Virtual Concertmaster App - Implementation Plan

## 1. Project Overview

**Project Name:** The Virtual Concertmaster
**Type:** Progressive Web Application (PWA) for Music Practice and Performance
**Core Functionality:** A comprehensive platform for musicians to search, scan, and practice sheet music with real-time audio analysis, performance feedback, and visual metrics.
**Target Users:** Musicians of all levels seeking to improve their performance accuracy, sight-reading skills, and practice efficiency.

---

## 2. High-Level Approach

This application will be built as a modern Progressive Web Application using vanilla JavaScript with the Web Audio API for real-time audio processing. The architecture prioritizes:

- **Client-side processing** for low-latency feedback during live performance
- **Modular component design** for maintainability and feature expansion
- **Offline-first PWA capabilities** for practice anywhere
- **Extensible APIs** for future integration with external services

### Technology Stack
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Audio Processing:** Web Audio API, YIN/pYIN algorithms for pitch detection
- **OMR Processing:** Audiveris (server-side) with client preprocessing
- **Data Storage:** IndexedDB for local sheet music, localStorage for settings
- **PWA:** Service Worker, Web App Manifest

---

## 3. Milestones Summary

| Milestone | Title | Description |
|-----------|-------|-------------|
| 1 | Song Ingestion | IMSLP search integration and OMR sheet music scanning |
| 2 | Live Performance Analysis | Real-time audio tracking, instrument detection, sheet music comparison |
| 3 | Feedback & Metrics | Note accuracy scoring, rhythmic precision analysis, visual heat maps |
| 4 | Midnight Conservatory Aesthetic | Dark elegant theme with classical music visual elements |

---

## 4. Cross-Milestone Dependencies

### Critical Sequencing
1. **Milestone 1 (Song Ingestion)** must complete before Milestone 2 can begin, as the analysis engine requires parsed sheet music data.
2. **Milestone 2 (Live Analysis)** provides the core scoring engine used by Milestone 3 for feedback generation.
3. **Milestone 4 (Aesthetic)** applies the visual theme across all completed features but can have initial styling applied incrementally.
4. The "Follow-the-ball" cursor feature (sight-reading practice) depends on both the sheet music parsing (Milestone 1) and real-time tracking (Milestone 2).

### Integration Points
- Sheet music data model from Milestone 1 feeds into Milestone 2's comparison engine
- Audio analysis from Milestone 2 produces data consumed by Milestone 3's metrics engine
- All milestones use shared CSS variables for the Midnight Conservatory theme

---

## 5. Total Task Count

**Estimated Total: 18 tasks across 4 milestones**

- Milestone 1 (Song Ingestion): 5 tasks
- Milestone 2 (Live Analysis): 5 tasks
- Milestone 3 (Feedback & Metrics): 4 tasks
- Milestone 4 (Midnight Aesthetic): 4 tasks

---

## 6. Initial Architecture Notes

### Key Modules to Create
1. **AudioEngine** - Manages microphone input, pitch detection (YIN/pYIN), and audio analysis
2. **SheetMusicParser** - Handles MusicXML/MEI parsing and note extraction
3. **PerformanceComparator** - Matches live audio to expected notes with timing analysis
4. **MetricsCalculator** - Computes accuracy scores and identifies problem areas
5. **IMSLPClient** - Handles API communication with IMSLP for score search
6. **OMRUploader** - Manages image upload and communicates with Audiveris service

### Data Flow
```
IMSLP/OMR Upload → Sheet Music Parser → Music Data Model
                                                    ↓
Microphone Input → Audio Engine → Pitch Detection
                                            ↓
                               Performance Comparator ← Music Data Model
                                            ↓
                               Metrics Calculator → Visual Feedback
```
