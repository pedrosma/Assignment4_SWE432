const express = require('express');
const router = express.Router();
const Show = require('../models/Show');

const slugify = (text) => text.toString().toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-');

router.get('/', async (req, res) => {
  try {
    req.session.lastRole = 'Manager';
    req.session.lastRoleFile = 'manager';
    req.session.lastVisitedAt = Date.now();

    const shows = await Show.find().sort({ order: 1, title: 1 });
    res.render('manager', {
      title: 'Station Manager',
      shows,
      activePage: 'manager'
    });
  } catch (error) {
    console.error('Error loading manager page:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load manager dashboard' });
  }
});

router.post('/shows', express.json(), async (req, res) => {
  try {
    const { title, description, genre } = req.body;
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters' });
    }

    const slug = slugify(title);
    const exists = await Show.findOne({ slug });
    if (exists) {
      return res.status(400).json({ error: 'Show with that title already exists' });
    }

    const nextOrder = await Show.countDocuments();

    const show = new Show({
      slug,
      title: title.trim(),
      description: description || '',
      genre: genre || '',
      order: nextOrder + 1,
      slots: [{ date: '', time: '', djName: '', note: '' }]
    });

    await show.save();
    res.json({ success: true, show });
  } catch (error) {
    console.error('Error creating show:', error);
    res.status(500).json({ error: 'Failed to create show' });
  }
});

router.post('/shows/:slug/slot', express.json(), async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, time, djName, note } = req.body;

    const show = await Show.findOne({ slug });
    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const slot = { date: date || '', time: time || '', djName: djName || '', note: note || '' };
    if (show.slots.length === 0) {
      show.slots.push(slot);
    } else {
      show.slots[0] = slot;
    }
    await show.save();

    res.json({ success: true, show });
  } catch (error) {
    console.error('Error updating slot:', error);
    res.status(500).json({ error: 'Failed to update slot' });
  }
});

module.exports = router;
