/**
 * OMR (Optical Music Recognition) API Routes
 * Handles image uploads and conversion to digital sheet music
 */

const express = require('express');
const router = express.Router();

// In-memory job storage (in production, use Redis or database)
const omrJobs = new Map();
let nextJobId = 1;

// Sample OMR result for demonstration
const generateSampleOMRResult = (jobId) => {
  return {
    jobId,
    status: 'completed',
    result: {
      title: 'Scanned Sheet Music',
      composer: 'Unknown',
      instrument: 'violin',
      measures: 8,
      musicxmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <identification>
    <rights>Scanned by Virtual Concertmaster OMR</rights>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>C</step>
          <octave>5</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch>
          <step>C</step>
          <octave>5</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`
    },
    confidence: 0.87,
    processedAt: new Date().toISOString()
  };
};

// POST /api/omr/scan - Upload image for OMR processing
router.post('/scan', (req, res) => {
  try {
    const { imageUrl, instrument } = req.body;

    if (!imageUrl && !req.body.image) {
      return res.status(400).json({
        error: 'No image provided',
        message: 'Please provide either an image URL or base64 image data'
      });
    }

    const jobId = `omr-${nextJobId++}`;

    // Create job entry
    const job = {
      jobId,
      status: 'processing',
      instrument: instrument || 'violin',
      createdAt: new Date().toISOString(),
      progress: 0
    };

    omrJobs.set(jobId, job);

    // Simulate async OMR processing
    setTimeout(() => {
      job.progress = 30;
    }, 500);

    setTimeout(() => {
      job.progress = 60;
    }, 1500);

    setTimeout(() => {
      job.progress = 90;
      const result = generateSampleOMRResult(jobId);
      job.status = 'completed';
      job.result = result.result;
      job.confidence = result.confidence;
      job.processedAt = result.processedAt;
    }, 3000);

    // Return immediately with job ID
    res.status(202).json({
      message: 'OMR processing started',
      jobId,
      status: 'processing'
    });
  } catch (error) {
    console.error('Error starting OMR scan:', error);
    res.status(500).json({ error: 'Failed to start OMR scan' });
  }
});

// GET /api/omr/status/:jobId - Check OMR job status
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = omrJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      processedAt: job.processedAt,
      error: job.error
    });
  } catch (error) {
    console.error('Error checking OMR status:', error);
    res.status(500).json({ error: 'Failed to check job status' });
  }
});

// GET /api/omr/result/:jobId - Get OMR result
router.get('/result/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = omrJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'processing') {
      return res.status(202).json({
        message: 'Processing still in progress',
        status: 'processing',
        progress: job.progress
      });
    }

    if (job.status === 'failed') {
      return res.status(500).json({
        error: 'OMR processing failed',
        message: job.error
      });
    }

    // Return the result
    res.json({
      jobId: job.jobId,
      status: job.status,
      result: job.result,
      confidence: job.confidence,
      processedAt: job.processedAt
    });
  } catch (error) {
    console.error('Error fetching OMR result:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// POST /api/omr/convert - Convert OMR result to different format
router.post('/convert', (req, res) => {
  try {
    const { jobId, format } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const job = omrJobs.get(jobId);

    if (!job || job.status !== 'completed') {
      return res.status(404).json({ error: 'Completed job not found' });
    }

    const validFormats = ['musicxml', 'midi', 'pdf'];
    const targetFormat = (format || 'musicxml').toLowerCase();

    if (!validFormats.includes(targetFormat)) {
      return res.status(400).json({
        error: 'Invalid format',
        valid: validFormats
      });
    }

    // In a real implementation, this would convert the MusicXML to the requested format
    // For now, we return the MusicXML
    res.json({
      jobId,
      format: targetFormat,
      content: job.result.musicxmlContent,
      convertedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error converting OMR result:', error);
    res.status(500).json({ error: 'Failed to convert result' });
  }
});

module.exports = router;
