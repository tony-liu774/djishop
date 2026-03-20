/**
 * OMR Client - Optical Music Recognition Client
 * Handles image scanning and conversion to digital notation
 */

class OMRClient {
    constructor() {
        this.apiEndpoint = '/api/omr';
        this.isProcessing = false;
    }

    /**
     * Process an image file for OMR
     * @param {File} imageFile - The image file to process
     * @returns {Promise<Object>} - The parsed score data
     */
    async processImage(imageFile) {
        if (this.isProcessing) {
            throw new Error('Already processing an image');
        }

        this.isProcessing = true;

        try {
            // Convert file to base64 for API
            const base64Image = await this.fileToBase64(imageFile);

            // Send to backend for processing
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64Image,
                    format: imageFile.type
                })
            });

            if (!response.ok) {
                throw new Error(`OMR processing failed: ${response.statusText}`);
            }

            const result = await response.json();
            return this.convertToScore(result);

        } catch (error) {
            console.error('OMR processing error:', error);
            // Fallback: create a demo score for testing
            return this.createDemoScore(imageFile.name);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process image using canvas-based analysis (client-side fallback)
     * @param {HTMLImageElement} image - Image element
     * @returns {Object} - Simple score data
     */
    async processImageClientSide(image) {
        // Simple client-side analysis - creates demo notes
        // In a real implementation, this would use ML/AI for detection
        return this.createDemoScore('Scanned Score');
    }

    /**
     * Convert OMR result to Score object
     * @param {Object} result - OMR API result
     * @returns {Object} - Score object
     */
    convertToScore(result) {
        if (!result.success) {
            throw new Error(result.error || 'OMR processing failed');
        }

        // Parse the converted notation (MusicXML or MIDI)
        // For now, create a demo score structure
        return this.createDemoScore(result.title || 'Scanned Score');
    }

    /**
     * Create a demo score for testing
     * @param {string} title - Score title
     * @returns {Object} - Demo score
     */
    createDemoScore(title) {
        // Create a sample score with basic notes
        const score = new window.Score(title, 'Unknown Composer');

        // Create a part (Violin by default)
        const part = new window.Part('part-1', 'Violin');

        // Add some measures with sample notes
        const noteData = [
            // Measure 1: C D E F
            [{ step: 'C', octave: 4 }, { step: 'D', octave: 4 }, { step: 'E', octave: 4 }, { step: 'F', octave: 4 }],
            // Measure 2: G A B C
            [{ step: 'G', octave: 4 }, { step: 'A', octave: 4 }, { step: 'B', octave: 4 }, { step: 'C', octave: 5 }],
            // Measure 3: D E F G
            [{ step: 'D', octave: 5 }, { step: 'E', octave: 5 }, { step: 'F', octave: 5 }, { step: 'G', octave: 5 }],
            // Measure 4: A B C D
            [{ step: 'A', octave: 5 }, { step: 'B', octave: 5 }, { step: 'C', octave: 5 }, { step: 'D', octave: 5 }]
        ];

        noteData.forEach((measureNotes, measureIndex) => {
            const measure = new window.Measure(measureIndex + 1);
            measureNotes.forEach((pitch, beatIndex) => {
                const note = new window.Note(pitch, 1, {
                    measure: measureIndex,
                    beat: beatIndex,
                    voice: 0
                });
                measure.addElement(note);
            });
            part.addMeasure(measure);
        });

        score.addPart(part);
        return score;
    }

    /**
     * Convert file to base64
     * @param {File} file - File to convert
     * @returns {Promise<string>} - Base64 string
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Get supported file types
     * @returns {string[]} - Array of MIME types
     */
    getSupportedTypes() {
        return [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/tiff',
            'application/pdf'
        ];
    }

    /**
     * Check if file type is supported
     * @param {File} file - File to check
     * @returns {boolean}
     */
    isSupported(file) {
        return this.getSupportedTypes().includes(file.type) ||
               file.type.startsWith('image/') ||
               file.type === 'application/pdf';
    }
}

// Create global instance
window.omrClient = new OMRClient();