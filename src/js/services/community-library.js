/**
 * Community Library Service
 * Handles interaction with the community sheet music backend
 */

class CommunityLibraryService {
  constructor() {
    this.baseUrl = '/api/community';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch community scores with optional filters
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} - Paginated results
   */
  async fetchScores(options = {}) {
    const {
      instrument,
      difficulty,
      source,
      search,
      sort = 'downloads',
      order = 'desc',
      page = 1,
      limit = 20
    } = options;

    // Build query string
    const params = new URLSearchParams();
    if (instrument) params.set('instrument', instrument);
    if (difficulty) params.set('difficulty', difficulty.toString());
    if (source) params.set('source', source);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());

    const cacheKey = params.toString();
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch scores');
      }

      const data = await response.json();

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching community scores:', error);
      throw error;
    }
  }

  /**
   * Get a specific score by ID
   * @param {string} id - Score ID
   * @returns {Promise<Object>} - Score details
   */
  async getScore(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Score not found');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching score:', error);
      throw error;
    }
  }

  /**
   * Upload a score to the community library
   * @param {Object} scoreData - Score data to upload
   * @returns {Promise<Object>} - Uploaded score
   */
  async uploadScore(scoreData) {
    const {
      title,
      composer,
      instrument,
      difficulty,
      description,
      tags,
      musicxmlContent,
      sourceUrl
    } = scoreData;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          composer,
          instrument,
          difficulty,
          description,
          tags,
          musicxmlContent,
          sourceUrl,
          uploadedBy: scoreData.uploadedBy || 'anonymous'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload score');
      }

      // Clear cache after upload
      this.cache.clear();

      return await response.json();
    } catch (error) {
      console.error('Error uploading score:', error);
      throw error;
    }
  }

  /**
   * Rate a score
   * @param {string} id - Score ID
   * @param {number} rating - Rating (1-5)
   * @returns {Promise<Object>} - Updated rating info
   */
  async rateScore(id, rating) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rate score');
      }

      // Clear cache after rating
      this.cache.clear();

      return await response.json();
    } catch (error) {
      console.error('Error rating score:', error);
      throw error;
    }
  }

  /**
   * Download a score
   * @param {string} id - Score ID
   * @returns {Promise<Object>} - Download URL and content
   */
  async downloadScore(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download score');
      }

      return await response.json();
    } catch (error) {
      console.error('Error downloading score:', error);
      throw error;
    }
  }

  /**
   * Get available instruments
   * @returns {Promise<Array>} - List of instruments
   */
  async getInstruments() {
    try {
      const response = await fetch(`${this.baseUrl}/meta/instruments`);

      if (!response.ok) {
        throw new Error('Failed to fetch instruments');
      }

      const data = await response.json();
      return data.instruments;
    } catch (error) {
      console.error('Error fetching instruments:', error);
      // Return default instruments if API fails
      return [
        { id: 'violin', name: 'Violin' },
        { id: 'viola', name: 'Viola' },
        { id: 'cello', name: 'Cello' },
        { id: 'bass', name: 'Double Bass' }
      ];
    }
  }

  /**
   * Get popular tags
   * @returns {Promise<Array>} - List of tags with counts
   */
  async getTags() {
    try {
      const response = await fetch(`${this.baseUrl}/meta/tags`);

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      return data.tags;
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  }

  /**
   * Delete a score (owner only)
   * @param {string} id - Score ID
   * @returns {Promise<void>}
   */
  async deleteScore(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete score');
      }

      // Clear cache after deletion
      this.cache.clear();
    } catch (error) {
      console.error('Error deleting score:', error);
      throw error;
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// IMSLP Service for searching public domain sheet music
class IMSLPService {
  constructor() {
    this.baseUrl = '/api/community';
  }

  /**
   * Search IMSLP for sheet music
   * @param {string} query - Search query
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Search results
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        search: query,
        source: 'imslp',
        sort: 'downloads',
        order: 'desc'
      });

      if (filters.instrument) {
        params.set('instrument', filters.instrument);
      }

      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      return data.scores;
    } catch (error) {
      console.error('Error searching IMSLP:', error);
      throw error;
    }
  }

  /**
   * Get a specific IMSLP score
   * @param {string} id - Score ID
   * @returns {Promise<Object>} - Score details
   */
  async getScore(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        throw new Error('Score not found');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching IMSLP score:', error);
      throw error;
    }
  }

  /**
   * Download an IMSLP score
   * @param {string} id - Score ID
   * @returns {Promise<Object>} - Score data for download
   */
  async download(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/download`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error downloading IMSLP score:', error);
      throw error;
    }
  }
}

// Export for global use
window.CommunityLibraryService = CommunityLibraryService;
window.IMSLPService = IMSLPService;
