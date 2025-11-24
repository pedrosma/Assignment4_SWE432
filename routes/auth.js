const express = require('express');
const router = express.Router();

router.post('/logout', (req, res) => {
  try {
    const sessionId = req.sessionID;
    console.log(`Logout: Clearing session ${sessionId.substring(0, 20)}...`);

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).send('Logout failed');
      }

      res.clearCookie('connect.sid', {
        httpOnly: true,
        path: '/'
      });

      console.log(`Logout successful. Session cleared, database data preserved.`);

      res.redirect('/');
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).send('Logout error');
  }
});

router.get('/logout', (req, res) => {
  res.redirect('/');
});

router.get('/status', (req, res) => {
  res.json({
    authenticated: !!req.sessionID,
    sessionId: req.sessionID || null,
    lastRole: req.session.lastRole || null,
    userId: req.session.userId || null,
    createdAt: req.session.cookie._expires || null
  });
});

module.exports = router;
