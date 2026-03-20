/**
 * Library Service - Manages library CRUD operations with IndexedDB
 * Handles score metadata, thumbnails, difficulty ratings, and practice history
 */

class LibraryService {
    constructor() {
        this.db = null;
        this.dbName = 'ConcertmasterLibrary';
        this.dbVersion = 2;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create scores store with enhanced schema
                if (!db.objectStoreNames.contains('scores')) {
                    const scoresStore = db.createObjectStore('scores', { keyPath: 'id' });
                    scoresStore.createIndex('title', 'title', { unique: false });
                    scoresStore.createIndex('composer', 'composer', { unique: false });
                    scoresStore.createIndex('addedAt', 'addedAt', { unique: false });
                    scoresStore.createIndex('lastPracticed', 'lastPracticed', { unique: false });
                    scoresStore.createIndex('difficulty', 'difficulty', { unique: false });
                }

                // Create thumbnails store
                if (!db.objectStoreNames.contains('thumbnails')) {
                    db.createObjectStore('thumbnails', { keyPath: 'scoreId' });
                }
            };
        });
    }

    async getAllScores() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve([]);
                return;
            }

            const transaction = this.db.transaction(['scores'], 'readonly');
            const store = transaction.objectStore('scores');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getScoreById(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null);
                return;
            }

            const transaction = this.db.transaction(['scores'], 'readonly');
            const store = transaction.objectStore('scores');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async addScore(score) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            // Set defaults
            score.id = score.id || crypto.randomUUID();
            score.addedAt = score.addedAt || new Date().toISOString();
            score.lastPracticed = score.lastPracticed || null;
            score.difficulty = score.difficulty || 3; // Default 3 stars
            score.tags = score.tags || [];
            score.thumbnail = score.thumbnail || null;

            const transaction = this.db.transaction(['scores'], 'readwrite');
            const store = transaction.objectStore('scores');
            const request = store.add(score);

            request.onsuccess = () => {
                resolve(score);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async updateScore(score) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['scores'], 'readwrite');
            const store = transaction.objectStore('scores');
            const request = store.put(score);

            request.onsuccess = () => {
                resolve(score);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async deleteScore(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['scores', 'thumbnails'], 'readwrite');

            // Delete score
            const scoresStore = transaction.objectStore('scores');
            scoresStore.delete(id);

            // Delete thumbnail
            const thumbnailsStore = transaction.objectStore('thumbnails');
            thumbnailsStore.delete(id);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async updateLastPracticed(id) {
        const score = await this.getScoreById(id);
        if (score) {
            score.lastPracticed = new Date().toISOString();
            await this.updateScore(score);
        }
    }

    async setDifficulty(id, difficulty) {
        const score = await this.getScoreById(id);
        if (score) {
            score.difficulty = Math.max(1, Math.min(5, difficulty));
            await this.updateScore(score);
        }
    }

    async setThumbnail(scoreId, thumbnailData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['thumbnails'], 'readwrite');
            const store = transaction.objectStore('thumbnails');
            const request = store.put({ scoreId, data: thumbnailData });

            request.onsuccess = async () => {
                // Also update score with thumbnail reference
                const score = await this.getScoreById(scoreId);
                if (score) {
                    score.thumbnail = thumbnailData;
                    await this.updateScore(score);
                }
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getThumbnail(scoreId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null);
                return;
            }

            const transaction = this.db.transaction(['thumbnails'], 'readonly');
            const store = transaction.objectStore('thumbnails');
            const request = store.get(scoreId);

            request.onsuccess = () => {
                resolve(request.result?.data || null);
            };

            request.onerror = () => reject(request.error);
        });
    }

    search(query, options = {}) {
        return (scores) => {
            if (!query || query.trim() === '') {
                return scores;
            }

            const lowerQuery = query.toLowerCase();
            let results = scores.filter(score =>
                score.title.toLowerCase().includes(lowerQuery) ||
                score.composer.toLowerCase().includes(lowerQuery) ||
                (score.tags && score.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
            );

            // Apply filters
            if (options.difficulty) {
                results = results.filter(score => score.difficulty === options.difficulty);
            }

            if (options.instrument) {
                results = results.filter(score =>
                    score.instrument && score.instrument.toLowerCase() === options.instrument.toLowerCase()
                );
            }

            // Sort options
            if (options.sortBy === 'title') {
                results.sort((a, b) => a.title.localeCompare(b.title));
            } else if (options.sortBy === 'composer') {
                results.sort((a, b) => a.composer.localeCompare(b.composer));
            } else if (options.sortBy === 'lastPracticed') {
                results.sort((a, b) => {
                    if (!a.lastPracticed) return 1;
                    if (!b.lastPracticed) return -1;
                    return new Date(b.lastPracticed) - new Date(a.lastPracticed);
                });
            } else if (options.sortBy === 'addedAt') {
                results.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            }

            return results;
        };
    }

    formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    }
}

// Create global instance
window.libraryService = new LibraryService();