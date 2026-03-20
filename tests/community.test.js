/**
 * Community Library API Tests
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

describe('Community Library API', () => {
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

  describe('GET /api/community', () => {
    it('should return community scores', async () => {
      const response = await request('GET', '/api/community');
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.scores);
      assert.ok(Array.isArray(response.data.scores));
    });

    it('should filter by instrument', async () => {
      const response = await request('GET', '/api/community?instrument=violin');
      assert.strictEqual(response.status, 200);
      response.data.scores.forEach(score => {
        assert.strictEqual(score.instrument, 'violin');
      });
    });

    it('should filter by search query', async () => {
      const response = await request('GET', '/api/community?search=bach');
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.scores.length > 0);
    });

    it('should sort by downloads', async () => {
      const response = await request('GET', '/api/community?sort=downloads&order=desc');
      assert.strictEqual(response.status, 200);
      const scores = response.data.scores;
      for (let i = 1; i < scores.length; i++) {
        assert.ok(scores[i - 1].downloads >= scores[i].downloads);
      }
    });
  });

  describe('GET /api/community/:id', () => {
    it('should return a specific score', async () => {
      const response = await request('GET', '/api/community/community-1');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.id, 'community-1');
    });

    it('should return 404 for non-existent score', async () => {
      const response = await request('GET', '/api/community/nonexistent');
      assert.strictEqual(response.status, 404);
    });
  });

  describe('POST /api/community', () => {
    it('should create a new score', async () => {
      const newScore = {
        title: 'Test Piece',
        composer: 'Test Composer',
        instrument: 'violin',
        difficulty: 3,
        description: 'A test piece'
      };

      const response = await request('POST', '/api/community', newScore);
      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.data.score.title, 'Test Piece');
    });

    it('should reject invalid difficulty', async () => {
      const newScore = {
        title: 'Test Piece',
        composer: 'Test Composer',
        instrument: 'violin',
        difficulty: 10
      };

      const response = await request('POST', '/api/community', newScore);
      assert.strictEqual(response.status, 400);
    });

    it('should reject invalid instrument', async () => {
      const newScore = {
        title: 'Test Piece',
        composer: 'Test Composer',
        instrument: 'piano'
      };

      const response = await request('POST', '/api/community', newScore);
      assert.strictEqual(response.status, 400);
    });

    it('should reject missing required fields', async () => {
      const newScore = {
        title: 'Test Piece'
      };

      const response = await request('POST', '/api/community', newScore);
      assert.strictEqual(response.status, 400);
    });
  });

  describe('POST /api/community/:id/rate', () => {
    it('should submit a rating', async () => {
      const response = await request('POST', '/api/community/community-1/rate', { rating: 5 });
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.ratingCount, 1);
    });

    it('should reject invalid rating', async () => {
      const response = await request('POST', '/api/community/community-1/rate', { rating: 10 });
      assert.strictEqual(response.status, 400);
    });
  });

  describe('GET /api/community/meta/instruments', () => {
    it('should return available instruments', async () => {
      const response = await request('GET', '/api/community/meta/instruments');
      assert.strictEqual(response.status, 200);
      assert.ok(Array.isArray(response.data.instruments));
      assert.ok(response.data.instruments.length > 0);
    });
  });

  describe('GET /api/community/meta/tags', () => {
    it('should return popular tags', async () => {
      const response = await request('GET', '/api/community/meta/tags');
      assert.strictEqual(response.status, 200);
      assert.ok(Array.isArray(response.data.tags));
    });
  });
});
