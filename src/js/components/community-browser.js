/**
 * Community Browser Component
 * Displays and manages community sheet music library
 */

class CommunityBrowser {
  constructor(container) {
    this.container = container;
    this.communityService = new CommunityLibraryService();
    this.scores = [];
    this.filters = {
      instrument: null,
      difficulty: null,
      source: null,
      search: ''
    };
    this.sort = 'downloads';
    this.order = 'desc';
    this.page = 1;
    this.isLoading = false;
  }

  async init() {
    await this.loadScores();
    this.render();
    this.setupFilters();
  }

  async loadScores() {
    this.isLoading = true;
    this.showLoading();

    try {
      const result = await this.communityService.fetchScores({
        ...this.filters,
        sort: this.sort,
        order: this.order,
        page: this.page,
        limit: 20
      });

      this.scores = result.scores;
      this.totalPages = result.pagination.pages;
      this.totalCount = result.pagination.total;
    } catch (error) {
      console.error('Error loading community scores:', error);
      this.showError(error.message);
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="community-browser">
        <div class="community-header">
          <h2>Community Library</h2>
          <p class="subtitle">Discover and share sheet music with other musicians</p>
        </div>

        <div class="community-filters">
          <div class="filter-group">
            <label>Instrument</label>
            <select id="community-instrument-filter" class="filter-select">
              <option value="">All Instruments</option>
              <option value="violin">Violin</option>
              <option value="viola">Viola</option>
              <option value="cello">Cello</option>
              <option value="bass">Double Bass</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Difficulty</label>
            <select id="community-difficulty-filter" class="filter-select">
              <option value="">All Levels</option>
              <option value="1">1 - Beginner</option>
              <option value="2">2 - Easy</option>
              <option value="3">3 - Intermediate</option>
              <option value="4">4 - Advanced</option>
              <option value="5">5 - Expert</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Source</label>
            <select id="community-source-filter" class="filter-select">
              <option value="">All Sources</option>
              <option value="imslp">IMSLP</option>
              <option value="community">Community Uploads</option>
              <option value="omr">OMR Scans</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Sort By</label>
            <select id="community-sort-filter" class="filter-select">
              <option value="downloads">Most Downloads</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        <div class="community-search">
          <input type="text"
                 id="community-search-input"
                 placeholder="Search by title, composer, or tag..."
                 value="${this.filters.search}">
        </div>

        <div class="community-results" id="community-results">
          ${this.renderScoreGrid()}
        </div>

        <div class="community-pagination" id="community-pagination">
          ${this.renderPagination()}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  renderScoreGrid() {
    if (this.scores.length === 0) {
      return `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <h3>No scores found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      `;
    }

    return this.scores.map(score => `
      <div class="community-card" data-id="${score.id}">
        <div class="community-card-thumbnail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="community-card-content">
          <h3 class="community-card-title">${this.escapeHtml(score.title)}</h3>
          <p class="community-card-composer">${this.escapeHtml(score.composer)}</p>
          <div class="community-card-meta">
            <span class="instrument-badge">${this.formatInstrument(score.instrument)}</span>
            <span class="difficulty-badge difficulty-${score.difficulty}">${score.difficulty}/5</span>
          </div>
          <div class="community-card-stats">
            <span class="stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              ${score.downloads}
            </span>
            <span class="stat rating">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              ${score.rating > 0 ? score.rating.toFixed(1) : 'N/A'}
            </span>
          </div>
        </div>
        <div class="community-card-actions">
          <button class="btn btn-primary btn-sm download-btn" data-id="${score.id}">Download</button>
          <button class="btn btn-secondary btn-sm share-btn" data-id="${score.id}">Share</button>
        </div>
      </div>
    `).join('');
  }

  renderPagination() {
    if (this.totalPages <= 1) return '';

    let pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.page - 2 && i <= this.page + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return `
      <button class="pagination-btn" ${this.page <= 1 ? 'disabled' : ''} data-page="${this.page - 1}">
        Previous
      </button>
      ${pages.map(p => p === '...'
        ? '<span class="pagination-ellipsis">...</span>'
        : `<button class="pagination-btn ${p === this.page ? 'active' : ''}" data-page="${p}">${p}</button>`
      ).join('')}
      <button class="pagination-btn" ${this.page >= this.totalPages ? 'disabled' : ''} data-page="${this.page + 1}">
        Next
      </button>
    `;
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('community-search-input');
    searchInput?.addEventListener('input', this.debounce((e) => {
      this.filters.search = e.target.value;
      this.page = 1;
      this.loadScoresAndRender();
    }, 300));

    // Filter selects
    document.getElementById('community-instrument-filter')?.addEventListener('change', (e) => {
      this.filters.instrument = e.target.value || null;
      this.page = 1;
      this.loadScoresAndRender();
    });

    document.getElementById('community-difficulty-filter')?.addEventListener('change', (e) => {
      this.filters.difficulty = e.target.value ? parseInt(e.target.value) : null;
      this.page = 1;
      this.loadScoresAndRender();
    });

    document.getElementById('community-source-filter')?.addEventListener('change', (e) => {
      this.filters.source = e.target.value || null;
      this.page = 1;
      this.loadScoresAndRender();
    });

    document.getElementById('community-sort-filter')?.addEventListener('change', (e) => {
      this.sort = e.target.value;
      this.loadScoresAndRender();
    });

    // Pagination
    document.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== this.page) {
          this.page = page;
          this.loadScoresAndRender();
        }
      });
    });

    // Download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadScore(btn.dataset.id);
      });
    });

    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shareScore(btn.dataset.id);
      });
    });

    // Card click
    document.querySelectorAll('.community-card').forEach(card => {
      card.addEventListener('click', () => {
        this.viewScore(card.dataset.id);
      });
    });
  }

  async loadScoresAndRender() {
    await this.loadScores();
    const resultsEl = document.getElementById('community-results');
    const paginationEl = document.getElementById('community-pagination');

    if (resultsEl) resultsEl.innerHTML = this.renderScoreGrid();
    if (paginationEl) paginationEl.innerHTML = this.renderPagination();

    this.setupEventListeners();
  }

  async downloadScore(id) {
    try {
      const data = await this.communityService.downloadScore(id);
      this.showToast('Download started', 'success');

      // Trigger download
      if (data.musicxmlContent) {
        const blob = new Blob([data.musicxmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.title}.musicxml`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (data.sourceUrl) {
        window.open(data.sourceUrl, '_blank');
      }
    } catch (error) {
      this.showToast('Download failed: ' + error.message, 'error');
    }
  }

  async shareScore(id) {
    const score = this.scores.find(s => s.id === id);
    if (!score) return;

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: score.title,
          text: `Check out "${score.title}" by ${score.composer} on Virtual Concertmaster!`,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `"${score.title}" by ${score.composer} - Found on Virtual Concertmaster Community Library`;
      try {
        await navigator.clipboard.writeText(shareText);
        this.showToast('Link copied to clipboard', 'success');
      } catch (err) {
        this.showToast('Could not copy link', 'error');
      }
    }
  }

  viewScore(id) {
    // Emit event to parent app
    this.container.dispatchEvent(new CustomEvent('scoreview', {
      detail: { scoreId: id }
    }));
  }

  showLoading() {
    const resultsEl = document.getElementById('community-results');
    if (resultsEl) {
      resultsEl.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading community scores...</p></div>';
    }
  }

  hideLoading() {
    // Loading state removed by render
  }

  showError(message) {
    const resultsEl = document.getElementById('community-results');
    if (resultsEl) {
      resultsEl.innerHTML = `
        <div class="error-state">
          <p>Error: ${this.escapeHtml(message)}</p>
          <button class="btn btn-secondary" onclick="window.app?.communityBrowser?.loadScoresAndRender()">Try Again</button>
        </div>
      `;
    }
  }

  showToast(message, type = 'info') {
    window.app?.showToast?.(message, type);
  }

  formatInstrument(instrument) {
    const names = {
      violin: 'Violin',
      viola: 'Viola',
      cello: 'Cello',
      bass: 'Double Bass'
    };
    return names[instrument] || instrument;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  setupFilters() {
    // Initial filter setup if needed
  }
}

// Export for global use
window.CommunityBrowser = CommunityBrowser;
