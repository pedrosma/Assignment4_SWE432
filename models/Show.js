const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: String,
  time: String,
  djName: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  }
}, { _id: false });

const showSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  genre: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  slots: [slotSchema]
}, { timestamps: true });

module.exports = mongoose.model('Show', showSchema);
