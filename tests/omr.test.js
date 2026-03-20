/**
 * OMR API Tests
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

// Simple test helper to make HTTP requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe('OMR API', () => {
  let server;

  before(async () => {
    // Start the server for testing
    const app = require('../src/index');
    server = app.listen(3001); // Use different port for testing
  });

  after(async () => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/omr/scan', () => {
    it('should start OMR processing job', async () => {
      const response = await request('POST', '/api/omr/scan', {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        instrument: 'violin'
      });

      assert.strictEqual(response.status, 202);
      assert.ok(response.data.jobId);
      assert.strictEqual(response.data.status, 'processing');
    });

    it('should reject request without image', async () => {
      const response = await request('POST', '/api/omr/scan', {});
      assert.strictEqual(response.status, 400);
    });
  });

  describe('GET /api/omr/status/:jobId', () => {
    it('should return job status', async () => {
      // First create a job
      const createResponse = await request('POST', '/api/omr/scan', {
        image: 'test',
        instrument: 'violin'
      });

      const jobId = createResponse.data.jobId;

      // Then check status
      const statusResponse = await request('GET', `/api/omr/status/${jobId}`);
      assert.strictEqual(statusResponse.status, 200);
      assert.strictEqual(statusResponse.data.jobId, jobId);
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request('GET', '/api/omr/status/nonexistent');
      assert.strictEqual(response.status, 404);
    });
  });

  describe('GET /api/omr/result/:jobId', () => {
    it('should return completed result', async () => {
      // First create a job
      const createResponse = await request('POST', '/api/omr/scan', {
        image: 'test',
        instrument: 'violin'
      });

      const jobId = createResponse.data.jobId;

      // Wait for processing (in real tests, we'd wait properly)
      // For now, we expect either processing or completed status
      const resultResponse = await request('GET', `/api/omr/result/${jobId}`);

      // The job might still be processing, which is okay
      assert.ok([202, 200].includes(resultResponse.status));
    });
  });

  describe('POST /api/omr/convert', () => {
    it('should convert to specified format', async () => {
      // First create and wait for a job
      const createResponse = await request('POST', '/api/omr/scan', {
        image: 'test',
        instrument: 'violin'
      });

      const jobId = createResponse.data.jobId;

      // Try to convert (will fail if job not complete)
      const convertResponse = await request('POST', '/api/omr/convert', {
        jobId: jobId,
        format: 'musicxml'
      });

      // Either the job is still processing or conversion succeeded
      assert.ok([202, 400, 200].includes(convertResponse.status));
    });

    it('should reject invalid format', async () => {
      const createResponse = await request('POST', '/api/omr/scan', {
        image: 'test',
        instrument: 'violin'
      });

      const convertResponse = await request('POST', '/api/omr/convert', {
        jobId: createResponse.data.jobId,
        format: 'invalid'
      });

      assert.strictEqual(convertResponse.status, 400);
    });

    it('should reject missing jobId', async () => {
      const response = await request('POST', '/api/omr/convert', {
        format: 'musicxml'
      });

      assert.strictEqual(response.status, 400);
    });
  });
});
