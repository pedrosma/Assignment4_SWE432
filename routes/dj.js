const express = require('express');
const router = express.Router();
const DJProfile = require('../models/DJProfile');
const Show = require('../models/Show');
const Track = require('../models/Track');

const fmtSeconds = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};

async function getDJProfile(req, res, next) {
  try {
    const sessionId = req.sessionID;
    let profile = await DJProfile.findOne({ sessionId });
    
    if (!profile) {
      profile = new DJProfile({
        sessionId,
        userId: req.session.userId || null
      });
      await profile.save();
    }
    
    req.djProfile = profile;
    next();
  } catch (error) {
    console.error('Error getting DJ profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

router.use(getDJProfile);

router.get('/', async (req, res) => {
  try {
    const profile = req.djProfile;
    req.session.lastRole = 'DJ';
    req.session.lastRoleFile = 'dj';
    req.session.lastVisitedAt = Date.now();

    const shows = await Show.find().sort({ order: 1 });
    const catalog = await Track.find().sort({ title: 1 });
    
    res.render('dj', {
      title: 'DJ Dashboard - Campus Radio',
      profile,
      queue: profile.queue,
      shows,
      stats: profile.stats,
      currentShow: profile.currentShow,
      currentSlot: profile.currentSlot,
      catalog,
      activePage: 'dj',
      fmtSeconds
    });
  } catch (error) {
    console.error('Error loading DJ dashboard:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Failed to load DJ dashboard' 
    });
  }
});

router.post('/add-track', express.json(), async (req, res) => {
  try {
    const { title, artist, bpm, duration, trackId } = req.body;
    let trackData;

    if (trackId) {
      const existing = await Track.findById(trackId);
      if (!existing) {
        return res.status(404).json({ error: 'Track not found in catalog' });
      }
      trackData = existing.toObject();
    } else {
      if (!title || title.trim().length < 2) {
        return res.status(400).json({ error: 'Title required (min 2 characters)' });
      }
  
      const seconds = mmssToSeconds(duration);
      if (isNaN(seconds) || seconds <= 0 || seconds > 600) {
        return res.status(400).json({ error: 'Duration must be mm:ss format (max 10:00)' });
      }
  
      const isDuplicate = req.djProfile.queue.some(t => 
        t.title.toLowerCase().includes(title.toLowerCase())
      );
      if (isDuplicate) {
        return res.status(400).json({ error: 'Track already exists in queue' });
      }
  
      trackData = {
        title: title.trim(),
        artist: artist?.trim() || '',
        bpm: Number(bpm) || 0,
        duration: seconds,
        mmss: fmtSeconds(seconds)
      };
    }

    const lowerTitle = trackData.title.toLowerCase();
    if (req.djProfile.queue.some(t => t.title.toLowerCase() === lowerTitle)) {
      return res.status(400).json({ error: 'Track already exists in queue' });
    }

    req.djProfile.addTrackToQueue(trackData);
    await req.djProfile.save();

    res.json({ 
      success: true, 
      message: 'Track added to queue',
      queue: req.djProfile.queue,
      stats: req.djProfile.stats
    });
  } catch (error) {
    console.error('Error adding track:', error);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

router.post('/remove-track', express.json(), async (req, res) => {
  try {
    const { index } = req.body;
    
    if (!Number.isInteger(index) || index < 0 || index >= req.djProfile.queue.length) {
      return res.status(400).json({ error: 'Invalid track index' });
    }

    req.djProfile.removeTrackFromQueue(index);
    await req.djProfile.save();

    res.json({ 
      success: true,
      message: 'Track removed from queue',
      queue: req.djProfile.queue,
      stats: req.djProfile.stats
    });
  } catch (error) {
    console.error('Error removing track:', error);
    res.status(500).json({ error: 'Failed to remove track' });
  }
});

router.post('/move-track', express.json(), async (req, res) => {
  try {
    const { fromIndex, toIndex } = req.body;
    
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
      return res.status(400).json({ error: 'Invalid indices' });
    }

    if (!req.djProfile.moveTrack(fromIndex, toIndex)) {
      return res.status(400).json({ error: 'Failed to move track' });
    }

    await req.djProfile.save();
    res.json({ 
      success: true,
      queue: req.djProfile.queue,
      stats: req.djProfile.stats
    });
  } catch (error) {
    console.error('Error moving track:', error);
    res.status(500).json({ error: 'Failed to move track' });
  }
});

router.post('/save-show', express.json(), async (req, res) => {
  try {
    const { show, date, time } = req.body;
    
    if (!show) {
      return res.status(400).json({ error: 'Missing show selection' });
    }

    const showDoc = await Show.findOne({ slug: show });
    if (!showDoc) {
      return res.status(404).json({ error: 'Show not found' });
    }

    req.djProfile.currentShow = showDoc.slug;
    req.djProfile.currentSlot = { date: date || '', time: time || '' };
    req.djProfile.incrementGigs();
    
    await req.djProfile.save();

    res.json({ 
      success: true,
      message: 'Show and timeslot saved',
      stats: req.djProfile.stats,
      currentShow: req.djProfile.currentShow
    });
  } catch (error) {
    console.error('Error saving show:', error);
    res.status(500).json({ error: 'Failed to save show' });
  }
});

router.post('/search-queue', express.json(), async (req, res) => {
  try {
    const { term } = req.body;
    const query = String(term || '').toLowerCase();
    
    const filtered = req.djProfile.queue.filter(track =>
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query)
    );

    res.json({
      results: filtered,
      count: filtered.length
    });
  } catch (error) {
    console.error('Error searching queue:', error);
    res.status(500).json({ error: 'Failed to search queue' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    res.json({
      profile: req.djProfile,
      stats: req.djProfile.stats,
      queue: req.djProfile.queue,
      currentShow: req.djProfile.currentShow,
      currentSlot: req.djProfile.currentSlot
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

function mmssToSeconds(v) {
  const parts = String(v || '').trim().split(':');
  const m = Number(parts[0]);
  const s = Number(parts[1]);
  
  if (!Number.isInteger(m) || !Number.isInteger(s)) return NaN;
  if (m < 0 || s < 0 || s > 59) return NaN;
  
  return m * 60 + s;
}

module.exports = router;
