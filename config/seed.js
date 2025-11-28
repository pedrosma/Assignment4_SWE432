const Track = require('../models/Track');
const Show = require('../models/Show');
const Genre = require('../models/Genre');
const ManagerProfile = require('../models/ManagerProfile');
const ProducerProfile = require('../models/Producer');

async function seedTracks() {
  const count = await Track.countDocuments();
  if (count > 0) return;

  const samples = [
    { title: 'Campus Sunrise', artist: 'DJ Nova', bpm: 122, duration: 215, mmss: '03:35' },
    { title: 'Library Lo-Fi', artist: 'Study Group', bpm: 90, duration: 260, mmss: '04:20' },
    { title: 'Stadium Anthem', artist: 'The Ravens', bpm: 128, duration: 198, mmss: '03:18' },
    { title: 'Late Lab Night', artist: 'Night Coder', bpm: 110, duration: 245, mmss: '04:05' }
  ];

  await Track.insertMany(samples);
  console.log(`Seeded ${samples.length} tracks`);
}

async function seedShows() {
  const count = await Show.countDocuments();
  if (count > 0) return;

  const defaults = [
    {
      slug: 'morning',
      title: 'Morning Show',
      description: 'Wake-up mixes, campus announcements, and news.',
      genre: 'Variety',
      order: 1,
      slots: [{ date: '', time: '', djName: '', note: '' }]
    },
    {
      slug: 'drive',
      title: 'Drive Time',
      description: 'Commuter anthems and student takeovers.',
      genre: 'Pop/Rock',
      order: 2,
      slots: [{ date: '', time: '', djName: '', note: '' }]
    },
    {
      slug: 'night',
      title: 'Night Mix',
      description: 'Chill, electronic, and requests into the night.',
      genre: 'Electronic',
      order: 3,
      slots: [{ date: '', time: '', djName: '', note: '' }]
    }
  ];

  await Show.insertMany(defaults);
  console.log(`✓ Seeded ${defaults.length} shows`);
}

async function seedGenres() {
  const count = await Genre.countDocuments();
  if (count > 0) return;

  const genres = [
    { name: 'EDM', description: 'Electronic Dance Music', isActive: true },
    { name: 'House', description: 'House Music', isActive: true },
    { name: 'Synthwave', description: 'Retro synthesizer music', isActive: true },
    { name: 'Lo-Fi', description: 'Low fidelity chill beats', isActive: true },
    { name: 'Pop/Rock', description: 'Popular and Rock music', isActive: true },
    { name: 'Variety', description: 'Mixed genres', isActive: true },
    { name: 'Electronic', description: 'Electronic music', isActive: true },
    { name: 'Chill EDM', description: 'Relaxed electronic music', isActive: true }
  ];

  await Genre.insertMany(genres);
  console.log(`Seeded ${genres.length} genres`);
}

async function seedManagerProfile() {
  // Only seed if the default manager profile doesn't exist yet
  const existingDefault = await ManagerProfile.findOne({ sessionId: 'default-manager-session' });
  if (existingDefault) {
    console.log('Default manager profile already exists');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  
  const defaultProfile = new ManagerProfile({
    sessionId: 'default-manager-session',
    userId: null,
    schedule: [
      {
        date: today,
        time: '20:00',
        timeSlot: '20:00 - 21:00',
        djName: 'DJ Luna',
        genre: 'Lo-Fi',
        isFeatured: false
      },
      {
        date: today,
        time: '21:00',
        timeSlot: '21:00 - 22:00',
        djName: 'DJ Echo',
        genre: 'Synthwave',
        isFeatured: false
      },
      {
        date: today,
        time: '22:00',
        timeSlot: '22:00 - 23:00',
        djName: 'DJ Mirage',
        genre: 'Chill EDM',
        isFeatured: false
      }
    ],
    songReports: [
      {
        assignedSong: 'Moonlight Drive',
        djName: 'DJ Luna',
        status: 'played "Moonlight Drive"',
        icon: '✅',
        date: new Date()
      },
      {
        assignedSong: 'Digital Mirage',
        djName: 'DJ Mirage',
        status: 'replaced with "Echo Chamber"',
        icon: '⚠️',
        date: new Date()
      },
      {
        assignedSong: 'Solar Drift',
        djName: 'DJ Solstice',
        status: 'played as assigned',
        icon: '✅',
        date: new Date()
      },
      {
        assignedSong: 'Neon Nights',
        djName: 'DJ Echo',
        status: 'played as assigned',
        icon: '✅',
        date: new Date()
      }
    ]
  });

  await defaultProfile.save();
  console.log('Seeded default manager profile with 3 scheduled DJs');
}

 async function seedProducerProfile() {

  
  const existingDefault = await ProducerProfile.findOne({ name: 'McKenzie' });
  if (existingDefault) {
    console.log('Default producer profile already exists');
    return;
  }

  const [genreVariety, shows, tracks] = await Promise.all([
    Genre.findOne({ name: 'Variety' }),
    Show.find().sort({ order: 1 }).limit(2),
    Track.find().limit(4)
  ]);

  const today = new Date();

  const rotation = [];
  if (tracks[0]) {
    rotation.push({
      track: tracks[0]._id,
      bin: 'A',
      notes: 'Bin A rotation',
      explicit: false
    });
  }
  if (tracks[1]) {
    rotation.push({
      track: tracks[1]._id,
      bin: 'B',
      notes: 'Bin B rotation',
      explicit: false
    });
  }

  const defaultProducer = new ProducerProfile({
  sessionId: 'default-producer-session',
  userId: null,
  name: 'McKenzie',
  station: 'GMU Radio',
  role: 'Producer',

    playlists: [
      {
        name: 'Campus Beats - Week 1',
        date: today,
        show: shows[0] ? shows[0]._id : null,
        tracks: tracks.map(t => t._id)
      }
    ],

    bookings: [
      {
        guestOrSegment: 'Interview: Campus News',
        day: 'Friday',
        startTime: '20:36',
        endTime: '20:46'
      }
    ],

    runOfShow: [
      { startLabel: '20:00', description: 'Open + Show ID', duration: '0:30' },
      { startLabel: '20:01', description: 'Music Block A (5 tracks)', duration: '18:00' },
      { startLabel: '20:19', description: 'Live Break / Commercial', duration: '2:00' },
      { startLabel: '20:21', description: 'Music Block B (4 tracks)', duration: '15:00' },
      { startLabel: '20:36', description: 'Interview Segment', duration: '10:00' }
    ]
  });

  await defaultProducer.save();
  console.log('Seeded default producer profile');
}


async function seedDatabase() {
  await Promise.all([
    seedTracks(),
    seedShows(),
    seedGenres(),
    seedManagerProfile(),
    seedProducerProfile()
  ]);
}

module.exports = seedDatabase;