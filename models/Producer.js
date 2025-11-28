const mongoose = require('mongoose');
const { Schema } = mongoose;

// Weekly Rotation Items 
const rotationItemSchema = new Schema({
  track: {
    type: Schema.Types.ObjectId,
    ref: 'Track',         
    required: true
  },
  bin: {
    type: String,
    enum: ['A', 'B', 'C'], 
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  explicit: {
    type: Boolean,
    default: false
  }
}, { _id: false });


//Playlists
const playlistSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  date: {
    type: Date,
    required: true
  },
  show: {
    type: Schema.Types.ObjectId,
    ref: 'Show',
    default: null
  },
  tracks: [{
    type: Schema.Types.ObjectId,
    ref: 'Track'
  }]
}, { _id: false });


//Guest segment bookings
const bookingSchema = new Schema({
  guestOrSegment: {
    type: String,
    required: true,
    trim: true
  },
  day: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
}, { _id: false });


//ROS Items
const rosItemSchema = new Schema({
  startLabel: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  }
}, { _id: false });


//MAIN Producer Schema
const producerSchema = new Schema({
    sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  station: {
    type: String,
    default: 'GMU Radio',
    trim: true
  },
  role: {
    type: String,
    default: 'Producer'
  },
 genre: {
    type: Schema.Types.ObjectId,
    ref: 'Genre',
    default: null
  },
  shows: [{
    type: Schema.Types.ObjectId,
    ref: 'Show'
  }],


  rotation: [rotationItemSchema],

  playlists: [playlistSchema],

  //Guest/Segment Bookings
  bookings: [bookingSchema],

  //Run of Show
  runOfShow: [rosItemSchema]

}, { timestamps: true });

producerSchema.virtual('stats').get(function () {
  const shows = this.shows || [];
  const rotation = this.rotation || [];
  const playlists = this.playlists || [];
  const bookings = this.bookings || [];
  const runOfShow = this.runOfShow || [];

  const binCounts = { A: 0, B: 0, C: 0 };

  rotation.forEach(item => {
    if (item && item.bin && binCounts[item.bin] !== undefined) {
      binCounts[item.bin]++;
    }
  });

  return {
    totalShows: shows.length,
    rotationItems: rotation.length,
    playlists: playlists.length,
    bookings: bookings.length,
    rosItems: runOfShow.length,
    rotationBins: binCounts
  };
});

producerSchema.set('toJSON', { virtuals: true });
producerSchema.set('toObject', { virtuals: true });
producerSchema.methods.addShow = function (showId) {
  if (!this.shows.includes(showId)) {
    this.shows.push(showId);
  }
};

producerSchema.methods.removeShow = function (showId) {
  this.shows = this.shows.filter(id => id.toString() !== showId.toString());
};


producerSchema.methods.addRotationItem = function (rotationData) {
  this.rotation.push(rotationData);
};

producerSchema.methods.removeRotationItem = function (index) {
  if (index >= 0 && index < this.rotation.length) {
    this.rotation.splice(index, 1);
  }
};

producerSchema.methods.clearRotation = function () {
  this.rotation = [];
};

producerSchema.methods.addPlaylist = function (playlistData) {
  this.playlists.push({
    name: playlistData.name,
    date: playlistData.date,
    show: playlistData.show || null,
    tracks: playlistData.tracks || []
  });
};

producerSchema.methods.addTrackToPlaylist = function (playlistIndex, trackId) {
  if (playlistIndex >= 0 && playlistIndex < this.playlists.length) {
    this.playlists[playlistIndex].tracks.push(trackId);
  }
};

producerSchema.methods.removeTrackFromPlaylist = function (playlistIndex, trackIndex) {
  if (
    playlistIndex >= 0 &&
    playlistIndex < this.playlists.length &&
    trackIndex >= 0 &&
    trackIndex < this.playlists[playlistIndex].tracks.length
  ) {
    this.playlists[playlistIndex].tracks.splice(trackIndex, 1);
  }
};

//Additional Methods for Bookings and run of show
producerSchema.methods.addBooking = function (bookingData) {
  this.bookings.push(bookingData);
};

producerSchema.methods.removeBooking = function (index) {
  if (index >= 0 && index < this.bookings.length) {
    this.bookings.splice(index, 1);
  }
};

producerSchema.methods.addRosItem = function (rosData) {
  this.runOfShow.push(rosData);
};

producerSchema.methods.clearRunOfShow = function () {
  this.runOfShow = [];
};

module.exports = mongoose.model('Producer', producerSchema);
