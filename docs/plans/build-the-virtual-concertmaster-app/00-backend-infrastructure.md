# Milestone 0: Backend Infrastructure

## Goal
Set up the Node.js backend server required for external integrations that cannot be performed client-side: Audiveris OMR processing and legal sheet music API integration.

## Scope
- Express.js REST API server setup
- Audiveris OMR service integration (Java process management)
- Legal sheet music API integration (MuseScore/SheetMusicPlus/curated collection)
- File storage system for sheet music
- CORS and security configuration

---

## Task 0.1: Express Server Setup

### Description
Create the foundational Express.js server with REST API endpoints, CORS configuration, and basic middleware.

### Subtasks
1. Initialize Node.js project with package.json
2. Set up Express.js server with logging middleware
3. Configure CORS for frontend communication
4. Create basic health check endpoint
5. Set up environment configuration (development/production)
6. Configure request rate limiting

### Acceptance Criteria
- [ ] Server starts without errors on port 3000
- [ ] Health check endpoint returns 200 OK
- [ ] CORS allows requests from PWA origin
- [ ] Rate limiting prevents abuse (100 req/min per IP)
- [ ] Environment variables properly loaded

### Depends On
- None

### Agent Type
- Coder

---

## Task 0.2: Audiveris OMR Service Integration

### Description
Set up Java runtime and Audiveris OMR engine as a backend service. Create endpoints for uploading images and receiving MusicXML output.

### Subtasks
1. Install Java runtime on server (JDK 11+)
2. Download and configure Audiveris CLI
3. Create `/api/omr/process` endpoint for image upload
4. Implement file upload handling with multer
5. Run Audiveris as subprocess and capture output
6. Return MusicXML to client
7. Add timeout handling (OMR can take 30-60 seconds)

### Acceptance Criteria
- [ ] POST /api/omr/process accepts image uploads (PNG, JPEG, TIFF)
- [ ] Audiveris processes images and returns valid MusicXML
- [ ] Timeout after 90 seconds if processing hangs
- [ ] Temporary files cleaned up after processing
- [ ] Error messages returned for unsupported formats

### Technical Notes
- Audiveris requires Java 11+
- Processing time varies from 10-60 seconds depending on image complexity
- Output is MusicXML format which the frontend can parse

### Depends On
- Task 0.1 (Express Server)

### Agent Type
- Coder

---

## Task 0.3: Sheet Music API Integration

### Description
Create a backend service integrating with legal sheet music sources: MuseScore API, SheetMusicPlus API, and/or a manually curated public domain collection. This replaces any web scraping approach to ensure legal compliance.

### Subtasks
1. Evaluate and integrate with MuseScore API (or similar legal service)
2. Create `/api/sheetmusic/search` endpoint
3. Implement search query to legal API
4. Add result parsing (title, composer, difficulty, PDF/MusicXML links)
5. Implement caching for API responses (1-hour TTL)
6. Add rate limiting to comply with API terms of service
7. Create fallback to curated local public domain collection
8. Handle pagination for large result sets

### Acceptance Criteria
- [ ] GET /api/sheetmusic/search?query=bach returns search results from legal sources
- [ ] Results include title, composer, difficulty, and download URL
- [ ] Rate limited per API terms of service
- [ ] Cached results returned within 100ms
- [ ] Graceful fallback if primary API is unavailable
- [ ] All data sourced from legal, licensed providers

### Technical Notes
- **LEGAL COMPLIANCE**: This task explicitly avoids web scraping of IMSLP or any site with TOS prohibiting automated access
- Primary: MuseScore API or SheetMusicPlus API
- Fallback: Manually curated public domain collection (CC0/PD works)
- Cache aggressively to minimize API calls

### Depends On
- Task 0.1 (Express Server)

### Agent Type
- Coder

---

## Task 0.4: File Storage System

### Description
Implement file storage for imported sheet music, processed MusicXML files, and user data.

### Subtasks
1. Set up local file storage directory structure
2. Create `/api/files/upload` endpoint for user imports
3. Implement `/api/files/download/:id` endpoint
4. Add file type validation (MusicXML, PDF, MEI)
5. Implement file deletion with cleanup
6. Add basic cloud backup capability (optional: S3-compatible)

### Acceptance Criteria
- [ ] Users can upload MusicXML/MEI files
- [ ] Files are stored with unique identifiers
- [ ] Files can be retrieved by ID
- [ ] Delete removes file from storage
- [ ] Storage usage tracked and limited (1GB default)

### Depends On
- Task 0.1 (Express Server)

### Agent Type
- Coder

---

## Task 0.5: Backend API Documentation

### Description
Document all backend API endpoints for frontend integration.

### Subtasks
1. Create OpenAPI/Swagger documentation
2. Document all endpoints with request/response schemas
3. Add example requests and responses
4. Document error codes and handling

### Acceptance Criteria
- [ ] Swagger UI accessible at /api/docs
- [ ] All endpoints documented with schemas
- [ ] Error responses documented
- [ ] Frontend team can integrate without clarification

### Depends On
- Task 0.1, 0.2, 0.3, 0.4

### Agent Type
- General

---

## Task 0.6: Backend Testing & Deployment

### Description
Write integration tests for backend services and prepare deployment configuration.

### Subtasks
1. Write integration tests for each endpoint
2. Set up CI/CD pipeline configuration
3. Create Docker configuration for containerization
4. Add health monitoring endpoints
5. Configure error logging and alerting

### Acceptance Criteria
- [ ] All endpoints have passing integration tests
- [ ] Docker image builds successfully
- [ ] Container runs locally without errors
- [ ] Health endpoint returns service status

### Depends On
- Task 0.1, 0.2, 0.3, 0.4

### Agent Type
- Coder

---

## Changes Required

All changes must be on a feature branch with a GitHub PR created via `gh pr create`.
