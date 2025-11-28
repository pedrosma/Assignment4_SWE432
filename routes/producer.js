const express = require('express');
const router = express.Router();
const Producer = require('../models/Producer');
const Track = require('../models/Track');
const Genre = require('../models/Genre');
const Show = require('../models/Show');

async function getProducerProfile(req, res, next) {
  try {
    const sessionId = req.sessionID;

    let profile = await Producer.findOne({ sessionId })
      .populate('genre')
      .populate('shows')
      .populate('rotation.track')
      .populate('playlists.show')
      .populate('playlists.tracks');

    if (!profile) {
      profile = new Producer({
        sessionId,
        userId: req.session.userId || null,
        name: 'McKenzie',          
        station: 'GMU Radio',
        role: 'Producer',
        genre: null,
        shows: [],
        rotation: [],
        playlists: [],
        bookings: [],
        runOfShow: []
      });
      await profile.save();
    }

    req.producerProfile = profile;
    next();
  } catch (error) {
    console.error('Error getting producer profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

router.use(getProducerProfile);

router.get('/', async (req, res) => {
  try {
    const profile = req.producerProfile;

    // track last role in sessionr
    req.session.lastRole = 'Producer';
    req.session.lastRoleFile = 'producer';
    req.session.lastVisitedAt = Date.now();

    // genres and shows display
    const genres = await Genre.find().sort({ name: 1 });
    const shows = await Show.find().sort({ order: 1 });

  
    const stats = profile.stats;
    res.render('producer', {
      title: 'Producer Dashboard - Campus Radio',
      profile,
      producer: profile,            
      stats,
      genres,
      shows,
      activePage: 'producer'
    });
  } catch (error) {
    console.error('Error loading producer dashboard:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load producer dashboard'
    });
  }
});


function parseDuration(mmss) {
  const [mStr, sStr] = mmss.split(':');
  const m = parseInt(mStr, 10);
  const s = parseInt(sStr, 10);
  if (Number.isNaN(m) || Number.isNaN(s)) return null;
  return m * 60 + s;
}


router.post('/add-rotation', express.json(), async (req, res) => {
   

  try {
    const { title, artist, mmss, bin, notes, explicit } = req.body;

    if (!title || !mmss || !bin) {
      return res.status(400).json({ error: 'Title, duration, and bin are required' });
    }

    if (!['A', 'B', 'C'].includes(bin)) {
      return res.status(400).json({ error: 'Invalid bin value' });
    }

    const durationSeconds = parseDuration(mmss);
    if (durationSeconds === null) {
      return res.status(400).json({ error: 'Duration must be in mm:ss format' });
    }

    //create a Track 
    const track = new Track({
      title: title.trim(),
      artist: artist || '',
      bpm: 0,
      duration: durationSeconds,
      mmss
    });
    await track.save();

    //add to rotation 
    req.producerProfile.addRotationItem({
      track: track._id,
      bin,
      notes: notes || '',
      explicit: !!explicit
    });
    await req.producerProfile.save();

    await req.producerProfile.populate('rotation.track');

    res.json({
      success: true,
      message: 'Track added to rotation',
      rotation: req.producerProfile.rotation,
      stats: req.producerProfile.stats
    });
  } catch (error) {
    console.error('Error adding rotation item:', error);
    res.status(500).json({ error: 'Failed to add rotation item' });
  }
});


router.post('/remove-rotation', express.json(), async (req, res) => {
  try {
    const { index } = req.body;

    if (!Number.isInteger(index) || index < 0 || index >= req.producerProfile.rotation.length) {
      return res.status(400).json({ error: 'Invalid rotation index' });
    }

    req.producerProfile.removeRotationItem(index);
    await req.producerProfile.save();

    await req.producerProfile.populate('rotation.track');

    res.json({
      success: true,
      message: 'Rotation item removed',
      rotation: req.producerProfile.rotation,
      stats: req.producerProfile.stats
    });
  } catch (error) {
    console.error('Error removing rotation item:', error);
    res.status(500).json({ error: 'Failed to remove rotation item' });
  }
});


router.post('/add-booking', express.json(), async (req, res) => {
  try {
    const { guestOrSegment, day, startTime, endTime } = req.body;

    if (!guestOrSegment || !day || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const bookingData = {
      guestOrSegment: guestOrSegment.trim(),
      day: day.trim(),
      startTime,
      endTime
    };

    req.producerProfile.addBooking(bookingData);
    await req.producerProfile.save();

    res.json({
      success: true,
      message: 'Booking added',
      bookings: req.producerProfile.bookings,
      stats: req.producerProfile.stats
    });
  } catch (error) {
    console.error('Error adding booking:', error);
    res.status(500).json({ error: 'Failed to add booking' });
  }
});


router.post('/remove-booking', express.json(), async (req, res) => {
  try {
    const { index } = req.body;

    if (!Number.isInteger(index) || index < 0 || index >= req.producerProfile.bookings.length) {
      return res.status(400).json({ error: 'Invalid booking index' });
    }

    req.producerProfile.removeBooking(index);
    await req.producerProfile.save();

    res.json({
      success: true,
      message: 'Booking removed',
      bookings: req.producerProfile.bookings,
      stats: req.producerProfile.stats
    });
  } catch (error) {
    console.error('Error removing booking:', error);
    res.status(500).json({ error: 'Failed to remove booking' });
  }
});


router.get('/producer-data', async (req, res) => {
  try {
    const profile = await Producer.findOne({ sessionId: req.sessionID })
      .populate('rotation.track')
      .populate('playlists.tracks')
     

    if (!profile) {
      return res.status(404).json({ error: 'Producer profile not found' });
    }

    res.json({
      rotation: profile.rotation,
      playlists: profile.playlists,
      bookings: profile.bookings,
      runOfShow: profile.runOfShow,
      stats: profile.stats
    });
  } catch (error) {
    console.error('Error getting producer data:', error);
    res.status(500).json({ error: 'Failed to get producer data' });
  }
});

module.exports = router;
