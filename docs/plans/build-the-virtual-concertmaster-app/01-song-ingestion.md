# Milestone 1: Song Ingestion

## Goal
Enable users to discover and import sheet music through two primary channels: IMSLP search integration for accessing the International Music Score Library Project catalog, and OMR (Optical Music Recognition) for scanning physical sheet music or images.

## Scope
- IMSLP API integration for score search and download
- OMR preprocessing pipeline for image uploads
- Sheet music storage and parsing (MusicXML, MEI formats)
- Basic library management UI

---

## Task 1.1: IMSLP Search Integration

### Description
Integrate with IMSLP's public API to allow users to search for and download public domain sheet music. Build search UI with filters for composer, instrument, and difficulty.

### Subtasks
1. Create `js/services/imslp-client.js` - API client for IMSLP search endpoints
2. Build search form UI with filters (composer, instrument, opus number)
3. Implement search results display with pagination
4. Add score preview functionality
5. Implement download handler for MusicXML/MEI files
6. Create library storage service using IndexedDB

### Acceptance Criteria
- [ ] User can search IMSLP by composer name
- [ ] Search results display with title, composer, and download options
- [ ] MusicXML/MEI files can be downloaded and stored locally
- [ ] Library view shows all imported scores
- [ ] Search returns results within 3 seconds

### Depends On
- None

### Agent Type
- Coder

---

## Task 1.2: OMR Sheet Music Scanner

### Description
Build an image upload pipeline for scanning sheet music, including preprocessing and communication with Audiveris OMR service (or local processing fallback).

### Subtasks
1. Create `js/services/omr-uploader.js` - Image upload and preprocessing
2. Build camera capture UI for mobile devices
3. Implement image preprocessing (deskew, contrast enhancement)
4. Create Audiveris integration layer for OMR processing
5. Handle MusicXML output from Audiveris
6. Add fallback manual entry for simple scores

### Acceptance Criteria
- [ ] User can upload images via file picker or camera
- [ ] Images are preprocessed before OMR (deskew, enhance)
- [ ] Audiveris processes images and returns MusicXML
- [ ] Scored sheet music appears in user library
- [ ] Mobile camera capture works on iOS and Android

### Depends On
- None

### Agent Type
- Coder

---

## Task 1.3: Sheet Music Data Model

### Description
Define comprehensive data structures for representing parsed sheet music including notes, measures, clefs, time signatures, and performance metadata.

### Subtasks
1. Create `js/models/sheet-music.js` - Core data model classes
2. Define Note, Measure, Part, Score structures
3. Implement voice leading and multi-instrument support
4. Add temporal data (note durations, expected timings)
5. Create serialization/deserialization for IndexedDB storage
6. Build validation utilities for imported music data

### Acceptance Criteria
- [ ] Data model represents all standard music notation elements
- [ ] Model can serialize to/from JSON for storage
- [ ] Multi-voice and multi-instrument scores supported
- [ ] Temporal data includes expected duration per note
- [ ] Model validates imported data integrity

### Depends On
- Task 1.1 (IMSLP integration provides test data)
- Task 1.2 (OMR provides test data)

### Agent Type
- Coder

---

## Task 1.4: MusicXML/MEI Parser

### Description
Build a robust parser for MusicXML and MEI formats to convert imported sheet music into the internal data model.

### Subtasks
1. Create `js/parsers/musicxml-parser.js` - MusicXML to model converter
2. Create `js/parsers/mei-parser.js` - MEI to model converter
3. Implement note element extraction (pitch, duration, articulation)
4. Handle measure structure and voice splitting
5. Add support for clefs, key signatures, and time signatures
6. Implement error handling for malformed files

### Acceptance Criteria
- [ ] Parser correctly extracts notes with pitch and duration
- [ ] Parser handles all common time signatures (4/4, 3/4, 6/8, etc.)
- [ ] Key signature and clef changes are tracked per measure
- [ ] Multi-staff scores are parsed correctly
- [ ] Parser provides meaningful error messages for invalid files

### Depends On
- Task 1.3 (Sheet Music Data Model)

### Agent Type
- Coder

---

## Task 1.5: Library Management UI

### Description
Create the user interface for managing the user's sheet music collection including browsing, organizing, and deleting imported scores.

### Subtasks
1. Create `js/components/library-view.js` - Library grid/list display
2. Build score card component with metadata display
3. Implement search and filter within library
4. Add folder/collection organization
5. Create delete and archive functionality
6. Implement import from local device option

### Acceptance Criteria
- [ ] Library displays all imported scores with thumbnails
- [ ] User can search/filter the library
- [ ] Scores can be organized into collections
- [ ] Delete removes score from library and storage
- [ ] Import from local file system works

### Depends On
- Task 1.1 (IMSLP integration adds scores)
- Task 1.2 (OMR adds scores)
- Task 1.3 (Data model for display)

### Agent Type
- Coder

---

## Changes Required

All changes must be on a feature branch with a GitHub PR created via `gh pr create`.
