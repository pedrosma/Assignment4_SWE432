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
    
    let schedule = profile.schedule;
    let songReports = profile.songReports;
    
    if (schedule.length === 0) {
      const defaultProfile = await ManagerProfile.findOne({ sessionId: 'default-manager-session' });
      if (defaultProfile) {
        schedule = defaultProfile.schedule;
        songReports = defaultProfile.songReports;
        console.log('Using default profile data for display');
      }
    }
    
    let featuredDJ = {
      name: 'No DJ scheduled',
      genre: 'N/A',
      timeSlot: 'N/A'
    };
    
    if (schedule.length > 0) {
      const first = schedule[0];
      featuredDJ = {
        name: first.djName,
        genre: first.genre,
        timeSlot: first.timeSlot
      };
    }
    
    let upcomingDJs = [];
    if (schedule.length > 1) {
      upcomingDJs = schedule.slice(1, 4).map(slot => ({
        name: slot.djName,
        genre: slot.genre,
        timeSlot: slot.timeSlot
      }));
    }
    
    while (upcomingDJs.length < 3) {
      upcomingDJs.push({
        name: 'TBA',
        genre: 'TBA',
        timeSlot: 'TBA'
      });
    }
    
    const stats = {
      djsScheduled: schedule.length,
      activeShows: upcomingDJs.filter(dj => dj.name !== 'TBA').length,
      songReports: songReports.length
    };
    
    res.render('manager', {
      title: 'Manager Dashboard - Campus Radio',
      profile,
      schedule: schedule,
      stats: stats,
      featuredDJ: featuredDJ,
      upcomingDJs: upcomingDJs,
      genres: genres.length > 0 ? genres.map(g => g.name) : ['EDM', 'House', 'Synthwave', 'Lo-Fi'],
      songReports: songReports,
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

    const namePattern = /^[A-Za-z\s]+$/;
    if (!namePattern.test(djName)) {
      return res.status(400).json({ error: 'DJ name can only contain letters and spaces' });
    }

    const selectedDate = new Date(date + 'T' + time);
    const now = new Date();
    if (selectedDate < now) {
      return res.status(400).json({ error: 'Cannot select a time in the past' });
    }

    const isDuplicate = req.managerProfile.schedule.some(s => 
      s.djName.toLowerCase() === djName.toLowerCase()
    );
    if (isDuplicate) {
      return res.status(400).json({ error: 'This DJ is already in the schedule' });
    }

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