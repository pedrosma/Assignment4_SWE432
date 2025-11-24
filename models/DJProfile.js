const mongoose = require('mongoose');

const djProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    default: 'DJ User'
  },
  queue: [{
    trackId: mongoose.Schema.Types.ObjectId,
    title: String,
    artist: String,
    bpm: Number,
    duration: Number,
    mmss: String,
    position: Number,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currentShow: {
    type: String,
    enum: ['morning', 'drive', 'night', ''],
    default: ''
  },
  currentSlot: {
    date: String,
    time: String
  },
  stats: {
    gigs: {
      type: Number,
      default: 0
    },
    totalSeconds: {
      type: Number,
      default: 0
    },
    tracksQueued: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

djProfileSchema.methods.addTrackToQueue = function(trackData) {
  const track = {
    trackId: trackData._id || null,
    title: trackData.title,
    artist: trackData.artist,
    bpm: trackData.bpm,
    duration: trackData.duration,
    mmss: trackData.mmss,
    position: this.queue.length + 1
  };
  this.queue.push(track);
  this.updateStats();
  return track;
};

djProfileSchema.methods.removeTrackFromQueue = function(index) {
  if (index >= 0 && index < this.queue.length) {
    this.queue.splice(index, 1);
    this.renumberQueue();
    this.updateStats();
    return true;
  }
  return false;
};

djProfileSchema.methods.moveTrack = function(fromIndex, toIndex) {
  if (fromIndex >= 0 && fromIndex < this.queue.length &&
      toIndex >= 0 && toIndex < this.queue.length) {
    const [track] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, track);
    this.renumberQueue();
    this.updateStats();
    return true;
  }
  return false;
};

djProfileSchema.methods.renumberQueue = function() {
  this.queue.forEach((track, index) => {
    track.position = index + 1;
  });
};

djProfileSchema.methods.updateStats = function() {
  this.stats.tracksQueued = this.queue.length;
  this.stats.totalSeconds = this.queue.reduce((sum, track) => sum + track.duration, 0);
};

djProfileSchema.methods.incrementGigs = function() {
  this.stats.gigs++;
  this.updatedAt = Date.now();
};

djProfileSchema.methods.clearSession = function() {
  this.queue = [];
  this.currentShow = '';
  this.currentSlot = { date: '', time: '' };
  this.stats = { gigs: 0, totalSeconds: 0, tracksQueued: 0 };
};

module.exports = mongoose.model('DJProfile', djProfileSchema);
