const Track = require('../models/Track');
const Show = require('../models/Show');

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
  console.log(`✓ Seeded ${samples.length} tracks`);
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

async function seedDatabase() {
  await Promise.all([
    seedTracks(),
    seedShows()
  ]);
}

module.exports = seedDatabase;
