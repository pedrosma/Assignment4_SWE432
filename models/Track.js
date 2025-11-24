const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  artist: {
    type: String,
    trim: true,
    default: ''
  },
  bpm: {
    type: Number,
    min: 0,
    default: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  mmss: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

trackSchema.methods.label = function() {
  const artist = this.artist ? ` – ${this.artist}` : '';
  const bpm = this.bpm ? `, ${this.bpm} BPM` : '';
  return `${this.title}${artist} [${this.mmss}${bpm}]`;
};

trackSchema.methods.fmtSeconds = function() {
  const m = Math.floor(this.duration / 60);
  const s = this.duration % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};

module.exports = mongoose.model('Track', trackSchema);
