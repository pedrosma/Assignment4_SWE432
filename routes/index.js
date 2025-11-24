const express = require('express');
const router = express.Router();
const DJProfile = require('../models/DJProfile');

async function getOrCreateDJProfile(req) {
  const sessionId = req.sessionID;
  let profile = await DJProfile.findOne({ sessionId });
  
  if (!profile) {
    profile = new DJProfile({
      sessionId,
      userId: req.session.userId || null
    });
    await profile.save();
  }
  
  return profile;
}

router.get('/', async (req, res) => {
  try {
    const profile = await getOrCreateDJProfile(req);
    
    const lastRole = req.session.lastRole || null;
    const lastRoleFile = req.session.lastRoleFile || null;
    const lastVisitedAt = req.session.lastVisitedAt || null;
    
    res.render('index', {
      title: 'Campus Radio',
      lastRole,
      lastRoleFile,
      lastVisitedAt,
      activePage: 'home'
    });
  } catch (error) {
    console.error('Error loading index:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Failed to load home page' 
    });
  }
});

router.post('/set-last-page', express.json(), async (req, res) => {
  try {
    const { role, file } = req.body;
    
    if (!role || !file) {
      return res.status(400).json({ error: 'Missing role or file' });
    }
    
    if (file.toLowerCase() !== 'index.html') {
      req.session.lastRole = role;
      req.session.lastRoleFile = file;
      req.session.lastVisitedAt = Date.now();
    }
    
    res.json({ 
      success: true,
      lastRole: req.session.lastRole,
      lastVisitedAt: req.session.lastVisitedAt
    });
  } catch (error) {
    console.error('Error setting last page:', error);
    res.status(500).json({ error: 'Failed to set last page' });
  }
});

router.get('/session-data', (req, res) => {
  res.json({
    lastRole: req.session.lastRole || null,
    lastRoleFile: req.session.lastRoleFile || null,
    lastVisitedAt: req.session.lastVisitedAt || null,
    sessionId: req.session.id
  });
});

module.exports = router;
