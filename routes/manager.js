const express = require('express');
const router = express.Router();
const ManagerProfile = require('../models/ManagerProfile');
const Genre = require('../models/Genre');

async function getManagerProfile(req, res, next) {
  try {
    const sessionId = req.sessionID;
    let profile = await ManagerProfile.findOne({ sessionId });
    
    if (!profile) {
      profile = new ManagerProfile({
        sessionId,
        userId: req.session.userId || null
      });
      await profile.save();
    }
    
    req.managerProfile = profile;
    next();
  } catch (error) {
    console.error('Error getting manager profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

router.use(getManagerProfile);

router.get('/', async (req, res) => {
  try {
    const profile = req.managerProfile;
    req.session.lastRole = 'Manager';
    req.session.lastRoleFile = 'manager';
    req.session.lastVisitedAt = Date.now();

    const genres = await Genre.find().sort({ name: 1 });
    
    res.render('manager', {
      title: 'Manager Dashboard - Campus Radio',
      profile,
      schedule: profile.schedule,
      stats: profile.stats,
      featuredDJ: profile.featuredDJ || {
        name: 'DJ Echo',
        genre: 'Synthwave / Chillwave',
        timeSlot: '9:00 PM - 10:00 PM'
      },
      upcomingDJs: profile.upcomingDJs.length > 0 ? profile.upcomingDJs : [
        { name: 'DJ Mirage', genre: 'Chill EDM', timeSlot: '10:00 PM - 11:00 PM' },
        { name: 'DJ Solstice', genre: 'Deep House', timeSlot: '11:00 PM - 12:00 AM' },
        { name: 'DJ Static', genre: 'Ambient / Downtempo', timeSlot: '12:00 AM - 1:00 AM' }
      ],
      genres: genres.length > 0 ? genres.map(g => g.name) : ['EDM', 'House', 'Synthwave', 'Lo-Fi'],
      songReports: profile.songReports,
      activePage: 'manager'
    });
  } catch (error) {
    console.error('Error loading manager dashboard:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Failed to load manager dashboard' 
    });
  }
});

router.post('/add-schedule', express.json(), async (req, res) => {
  try {
    const { date, time, djName, genre } = req.body;
    
    if (!date || !time || !djName || !genre) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Validate DJ name
    const namePattern = /^[A-Za-z\s]+$/;
    if (!namePattern.test(djName)) {
      return res.status(400).json({ error: 'DJ name can only contain letters and spaces' });
    }

    // Validate time is not in the past
    const selectedDate = new Date(date + 'T' + time);
    const now = new Date();
    if (selectedDate < now) {
      return res.status(400).json({ error: 'Cannot select a time in the past' });
    }

    // Check for duplicates
    const isDuplicate = req.managerProfile.schedule.some(s => 
      s.djName.toLowerCase() === djName.toLowerCase()
    );
    if (isDuplicate) {
      return res.status(400).json({ error: 'This DJ is already in the schedule' });
    }

    // Create time slot string
    const hour = parseInt(time.split(':')[0]);
    const nextHour = hour + 1;
    const timeSlot = `${hour}:00 - ${nextHour}:00`;

    const scheduleData = {
      date,
      time,
      timeSlot,
      djName: djName.trim(),
      genre
    };

    req.managerProfile.addToSchedule(scheduleData);
    await req.managerProfile.save();

    res.json({ 
      success: true, 
      message: 'DJ assigned successfully',
      schedule: req.managerProfile.schedule,
      stats: req.managerProfile.stats
    });
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ error: 'Failed to add DJ to schedule' });
  }
});

router.post('/remove-schedule', express.json(), async (req, res) => {
  try {
    const { index } = req.body;
    
    if (!Number.isInteger(index) || index < 0 || index >= req.managerProfile.schedule.length) {
      return res.status(400).json({ error: 'Invalid schedule index' });
    }

    req.managerProfile.removeFromSchedule(index);
    await req.managerProfile.save();

    res.json({ 
      success: true,
      message: 'DJ removed from schedule',
      schedule: req.managerProfile.schedule,
      stats: req.managerProfile.stats
    });
  } catch (error) {
    console.error('Error removing schedule:', error);
    res.status(500).json({ error: 'Failed to remove DJ from schedule' });
  }
});

router.get('/schedule-data', async (req, res) => {
  try {
    res.json({
      schedule: req.managerProfile.schedule,
      stats: req.managerProfile.stats,
      songReports: req.managerProfile.songReports
    });
  } catch (error) {
    console.error('Error getting schedule data:', error);
    res.status(500).json({ error: 'Failed to get schedule data' });
  }
});

module.exports = router;