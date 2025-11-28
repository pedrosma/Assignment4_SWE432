const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const seedDatabase = require('./config/seed');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-radio';

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'campus-radio-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  },
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24
  })
}));

app.use((req, res, next) => {
  res.locals.sessionId = req.sessionID;
  res.locals.isLoggedIn = !!req.session.userId;
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const indexRoutes = require('./routes/index');
const djRoutes = require('./routes/dj');
const managerRoutes = require('./routes/manager');
const producerRoutes = require('./routes/producer');
const authRoutes = require('./routes/auth');

app.use('/', indexRoutes);
app.use('/dj', djRoutes);
app.use('/manager', managerRoutes);
app.use('/producer', producerRoutes);
app.use('/auth', authRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    message: err.message
  });
});

async function startServer() {
  await connectDatabase();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`✓ Campus Radio server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});