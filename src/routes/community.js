/**
 * Community Library API Routes
 * Handles sharing, browsing, and uploading of sheet music
 */

const express = require('express');
const router = express.Router();

// In-memory storage for community scores (in production, use a database)
const communityScores = new Map();
let nextScoreId = 1;

// Seed with some sample community scores
const sampleScores = [
  {
    id: 'community-1',
    title: 'Bach - Cello Suite No. 1 in G Major',
    composer: 'Johann Sebastian Bach',
    instrument: 'cello',
    difficulty: 3,
    source: 'imslp',
    sourceUrl: 'https://imslp.org/wiki/Cello_Suite_No.1_in_G_major,_BWV_1007_(Bach,_Johann_Sebastian)',
    uploadedBy: 'community',
    uploadedAt: '2024-01-15T10:00:00Z',
    downloads: 1234,
    rating: 4.8,
    ratingCount: 156,
    description: 'The famous Prelude from Bach\'s first cello suite. Excellent for developing bow control.',
    tags: ['baroque', 'suite', 'beginner-friendly']
  },
  {
    id: 'community-2',
    title: 'Vivaldi - Spring from Four Seasons',
    composer: 'Antonio Vivaldi',
    instrument: 'violin',
    difficulty: 4,
    source: 'imslp',
    sourceUrl: 'https://imslp.org/wiki/The_Four_Seasons_(Vivaldi,_Antonio)',
    uploadedBy: 'community',
    uploadedAt: '2024-01-20T14:30:00Z',
    downloads: 2567,
    rating: 4.9,
    ratingCount: 312,
    description: 'The iconic Spring movement. Beautiful melody with technical challenges.',
    tags: ['baroque', 'concerto', 'famous']
  },
  {
    id: 'community-3',
    title: 'Suzuki Violin Book 1 - Allegro',
    composer: 'Shinichi Suzuki',
    instrument: 'violin',
    difficulty: 1,
    source: 'community',
    uploadedBy: 'teacher_suzuki',
    uploadedAt: '2024-02-01T09:00:00Z',
    downloads: 890,
    rating: 4.5,
    ratingCount: 89,
    description: 'The first piece in Suzuki Book 1. Perfect for beginners.',
    tags: ['method', 'beginner', 'classical']
  },
  {
    id: 'community-4',
    title: 'Dvořák - Humoresque No. 7',
    composer: 'Antonín Dvořák',
    instrument: 'violin',
    difficulty: 2,
    source: 'imslp',
    sourceUrl: 'https://imslp.org/wiki/Humoresques,_Op.33_(Dvo%C5%99%C3%A1k,_Anton%C3%ADn)',
    uploadedBy: 'community',
    uploadedAt: '2024-02-10T16:00:00Z',
    downloads: 567,
    rating: 4.7,
    ratingCount: 78,
    description: 'One of the most beloved violin pieces. Expressive and melodic.',
    tags: ['romantic', 'humoresque', 'expressive']
  },
  {
    id: 'community-5',
    title: 'Ecossaise in G Major',
    composer: 'Ludwig van Beethoven',
    instrument: 'violin',
    difficulty: 2,
    source: 'imslp',
    sourceUrl: 'https://imslp.org/wiki/2_Ecossaises,_WoO_22_(Beethoven,_Ludwig_van)',
    uploadedBy: 'community',
    uploadedAt: '2024-02-15T11:00:00Z',
    downloads: 432,
    rating: 4.6,
    ratingCount: 54,
    description: 'A charming Scottish-inspired piece. Great for developing finger dexterity.',
    tags: ['classical', 'technique', 'short']
  },
  {
    id: 'community-6',
    title: 'Bach - Violin Partita No. 2 - Chaconne',
    composer: 'Johann Sebastian Bach',
    instrument: 'violin',
    difficulty: 5,
    source: 'imslp',
    sourceUrl: 'https://imslp.org/wiki/Partita_No.2_in_D_minor,_BWV_1004_(Bach,_Johann_Sebastian)',
    uploadedBy: 'community',
    uploadedAt: '2024-02-20T20:00:00Z',
    downloads: 1890,
    rating: 5.0,
    ratingCount: 234,
    description: 'One of the greatest challenges for violinists. A monumental piece.',
    tags: ['baroque', 'advanced', 'masterwork']
  }
];

// Initialize with sample data
sampleScores.forEach(score => {
  communityScores.set(score.id, score);
});
nextScoreId = communityScores.size + 1;

// GET /api/community - List all community scores
router.get('/', (req, res) => {
  try {
    const {
      instrument,
      difficulty,
      source,
      search,
      sort = 'downloads',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let scores = Array.from(communityScores.values());

    // Filter by instrument
    if (instrument) {
      scores = scores.filter(s => s.instrument === instrument);
    }

    // Filter by difficulty
    if (difficulty) {
      const diffLevel = parseInt(difficulty);
      scores = scores.filter(s => s.difficulty === diffLevel);
    }

    // Filter by source
    if (source) {
      scores = scores.filter(s => s.source === source);
    }

    // Search by title or composer
    if (search) {
      const searchLower = search.toLowerCase();
      scores = scores.filter(s =>
        s.title.toLowerCase().includes(searchLower) ||
        s.composer.toLowerCase().includes(searchLower) ||
        (s.tags && s.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Sort
    const sortKey = sort === 'rating' ? 'rating' :
                    sort === 'newest' ? 'uploadedAt' : 'downloads';
    scores.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'uploadedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedScores = scores.slice(startIndex, endIndex);

    res.json({
      scores: paginatedScores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: scores.length,
        pages: Math.ceil(scores.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching community scores:', error);
    res.status(500).json({ error: 'Failed to fetch community scores' });
  }
});

// GET /api/community/:id - Get a specific score
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const score = communityScores.get(id);

    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }

    // Increment download/view count
    score.downloads = (score.downloads || 0) + 1;

    res.json(score);
  } catch (error) {
    console.error('Error fetching score:', error);
    res.status(500).json({ error: 'Failed to fetch score' });
  }
});

// POST /api/community - Upload a new score to community
router.post('/', (req, res) => {
  try {
    const {
      title,
      composer,
      instrument,
      difficulty,
      description,
      tags,
      musicxmlContent,
      source = 'community',
      sourceUrl
    } = req.body;

    // Validate required fields
    if (!title || !composer || !instrument) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'composer', 'instrument']
      });
    }

    // Validate difficulty
    const diffLevel = parseInt(difficulty) || 3;
    if (diffLevel < 1 || diffLevel > 5) {
      return res.status(400).json({ error: 'Difficulty must be between 1 and 5' });
    }

    // Validate instrument
    const validInstruments = ['violin', 'viola', 'cello', 'bass'];
    if (!validInstruments.includes(instrument.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid instrument',
        valid: validInstruments
      });
    }

    // Create new score entry
    const newScore = {
      id: `community-${nextScoreId++}`,
      title: title.trim(),
      composer: composer.trim(),
      instrument: instrument.toLowerCase(),
      difficulty: diffLevel,
      description: description?.trim() || '',
      tags: Array.isArray(tags) ? tags : [],
      source,
      sourceUrl: sourceUrl?.trim() || '',
      uploadedBy: req.body.uploadedBy || 'anonymous',
      uploadedAt: new Date().toISOString(),
      downloads: 0,
      rating: 0,
      ratingCount: 0,
      musicxmlContent: musicxmlContent || null
    };

    communityScores.set(newScore.id, newScore);

    res.status(201).json({
      message: 'Score uploaded successfully',
      score: newScore
    });
  } catch (error) {
    console.error('Error uploading score:', error);
    res.status(500).json({ error: 'Failed to upload score' });
  }
});

// POST /api/community/:id/rate - Rate a score
router.post('/:id/rate', (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const score = communityScores.get(id);

    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }

    // Validate rating
    const ratingValue = parseInt(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Calculate new average rating
    const currentTotal = (score.rating || 0) * (score.ratingCount || 0);
    const newCount = (score.ratingCount || 0) + 1;
    const newAverage = (currentTotal + ratingValue) / newCount;

    score.rating = Math.round(newAverage * 10) / 10;
    score.ratingCount = newCount;

    res.json({
      message: 'Rating submitted successfully',
      rating: score.rating,
      ratingCount: score.ratingCount
    });
  } catch (error) {
    console.error('Error rating score:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// POST /api/community/:id/download - Get download URL for a score
router.post('/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const score = communityScores.get(id);

    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }

    // Increment download count
    score.downloads = (score.downloads || 0) + 1;

    // Return the score data for download (or URL if external)
    res.json({
      id: score.id,
      title: score.title,
      composer: score.composer,
      sourceUrl: score.sourceUrl,
      musicxmlContent: score.musicxmlContent,
      downloadUrl: score.sourceUrl || `/api/community/${id}/content`
    });
  } catch (error) {
    console.error('Error initiating download:', error);
    res.status(500).json({ error: 'Failed to initiate download' });
  }
});

// DELETE /api/community/:id - Delete a score (owner only in real implementation)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!communityScores.has(id)) {
      return res.status(404).json({ error: 'Score not found' });
    }

    communityScores.delete(id);

    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    console.error('Error deleting score:', error);
    res.status(500).json({ error: 'Failed to delete score' });
  }
});

// GET /api/community/instruments - Get available instruments
router.get('/meta/instruments', (req, res) => {
  res.json({
    instruments: [
      { id: 'violin', name: 'Violin', icon: 'violin' },
      { id: 'viola', name: 'Viola', icon: 'viola' },
      { id: 'cello', name: 'Cello', icon: 'cello' },
      { id: 'bass', name: 'Double Bass', icon: 'bass' }
    ]
  });
});

// GET /api/community/tags - Get popular tags
router.get('/meta/tags', (req, res) => {
  const allTags = [];
  communityScores.forEach(score => {
    if (score.tags) {
      allTags.push(...score.tags);
    }
  });

  // Count and sort tags
  const tagCounts = {};
  allTags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  res.json({ tags: sortedTags });
});

module.exports = router;
