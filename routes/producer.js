const express = require('express');
const router = express.Router();
const Track = require('../models/Track');

const mmssToSeconds = (value) => {
  const [m, s] = String(value || '').split(':').map(Number);
  if (!Number.isInteger(m) || !Number.isInteger(s) || m < 0 || s < 0 || s > 59) return NaN;
  return m * 60 + s;
};

const formatMmss = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};

router.get('/', async (req, res) => {
  try {
    req.session.lastRole = 'Producer';
    req.session.lastRoleFile = 'producer';
    req.session.lastVisitedAt = Date.now();

    const tracks = await Track.find().sort({ title: 1 });
    res.render('producer', {
      title: 'Producer Console',
      tracks,
      activePage: 'producer'
    });
  } catch (error) {
    console.error('Error loading producer page:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load producer console' });
  }
});

router.post('/tracks', express.json(), async (req, res) => {
  try {
    const { title, artist, bpm, duration } = req.body;
    if (!title || title.trim().length < 2) {
      return res.status(400).json({ error: 'Title is required (min 2 characters)' });
    }

    const seconds = mmssToSeconds(duration);
    if (Number.isNaN(seconds) || seconds <= 0) {
      return res.status(400).json({ error: 'Duration must be in mm:ss format' });
    }

    const track = new Track({
      title: title.trim(),
      artist: artist?.trim() || '',
      bpm: Number(bpm) || 0,
      duration: seconds,
      mmss: formatMmss(seconds)
    });
    await track.save();

    res.json({ success: true, track });
  } catch (error) {
    console.error('Error creating track:', error);
    res.status(500).json({ error: 'Failed to create track' });
  }
});

router.post('/tracks/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Track.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

module.exports = router;
