/**
 * OMR (Optical Music Recognition) Uploader Service
 * Handles image uploads and conversion to digital sheet music
 */

class OMRService {
  constructor() {
    this.baseUrl = '/api/omr';
    this.pollingInterval = null;
  }

  /**
   * Upload an image for OMR processing
   * @param {File|Blob|string} image - Image file, blob, or base64 data URL
   * @param {string} instrument - Target instrument (violin, viola, cello, bass)
   * @returns {Promise<Object>} - Job info with jobId
   */
  async uploadImage(image, instrument = 'violin') {
    try {
      // Convert image to base64 if it's a File or Blob
      let imageData = image;

      if (image instanceof File || image instanceof Blob) {
        imageData = await this.blobToBase64(image);
      }

      const response = await fetch(`${this.baseUrl}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageData,
          instrument
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start OMR scan');
      }

      const data = await response.json();
      return {
        jobId: data.jobId,
        status: data.status
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Upload an image from a URL
   * @param {string} url - Image URL
   * @param {string} instrument - Target instrument
   * @returns {Promise<Object>} - Job info
   */
  async uploadFromUrl(url, instrument = 'violin') {
    try {
      const response = await fetch(`${this.baseUrl}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: url,
          instrument
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start OMR scan');
      }

      const data = await response.json();
      return {
        jobId: data.jobId,
        status: data.status
      };
    } catch (error) {
      console.error('Error uploading from URL:', error);
      throw error;
    }
  }

  /**
   * Check the status of an OMR job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Job status info
   */
  async checkStatus(jobId) {
    try {
      const response = await fetch(`${this.baseUrl}/status/${jobId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Job not found');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking job status:', error);
      throw error;
    }
  }

  /**
   * Get the result of an OMR job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - OMR result
   */
  async getResult(jobId) {
    try {
      const response = await fetch(`${this.baseUrl}/result/${jobId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get result');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting result:', error);
      throw error;
    }
  }

  /**
   * Poll for job completion
   * @param {string} jobId - Job ID
   * @param {Function} onProgress - Progress callback
   * @param {number} maxAttempts - Maximum polling attempts
   * @returns {Promise<Object>} - Completed result
   */
  async waitForResult(jobId, onProgress, maxAttempts = 60) {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const checkStatus = async () => {
        attempts++;

        try {
          const status = await this.checkStatus(jobId);

          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            const result = await this.getResult(jobId);
            resolve(result);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error(status.error || 'OMR processing failed'));
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Timeout waiting for OMR processing'));
            return;
          }

          // Continue polling
          this.pollingInterval = setTimeout(checkStatus, 1000);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }

  /**
   * Stop polling for results
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Convert OMR result to different format
   * @param {string} jobId - Job ID
   * @param {string} format - Target format (musicxml, midi, pdf)
   * @returns {Promise<Object>} - Converted content
   */
  async convertFormat(jobId, format = 'musicxml') {
    try {
      const response = await fetch(`${this.baseUrl}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          format
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Conversion failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error converting format:', error);
      throw error;
    }
  }

  /**
   * Helper: Convert Blob to Base64
   * @param {Blob} blob - Blob to convert
   * @returns {Promise<string>} - Base64 string
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Process an image file with OMR
   * @param {File} file - Image file
   * @param {string} instrument - Target instrument
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Parsed MusicXML
   */
  async processImage(file, instrument, onProgress) {
    // Upload the image
    const { jobId } = await this.uploadImage(file, instrument);

    // Wait for processing to complete
    const result = await this.waitForResult(jobId, onProgress);

    // Parse the MusicXML content
    if (result.result && result.result.musicxmlContent) {
      return {
        jobId,
        musicxmlContent: result.result.musicxmlContent,
        title: result.result.title,
        composer: result.result.composer,
        confidence: result.confidence,
        parsedAt: result.processedAt
      };
    }

    throw new Error('No MusicXML content in result');
  }
}

// Export for global use
window.OMRService = OMRService;
