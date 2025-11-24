const express = require('express');
const router = express.Router();

function handleLogout(req, res, next) {
  try {
    const sessionId = req.sessionID;
    if (sessionId) {
      console.log(`Logout: Clearing session ${sessionId.substring(0, 20)}...`);
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return next(err);
      }

      res.clearCookie('connect.sid', {
        httpOnly: true,
        path: '/'
      });

      console.log('Logout successful. Session cleared, database data preserved.');
      res.redirect('/');
    });
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
}

router.get('/logout', handleLogout);
router.post('/logout', handleLogout);

router.get('/status', (req, res) => {
  const hasSession = !!req.sessionID;

  res.json({
    authenticated: hasSession,
    sessionId: hasSession ? req.sessionID : null,
    lastRole: req.session?.lastRole || null,
    userId: req.session?.userId || null,
    expiresAt: req.session?.cookie?._expires || null
  });
});

module.exports = router;
