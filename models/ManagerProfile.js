const mongoose = require('mongoose');

const managerProfileSchema = new mongoose.Schema({
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
  schedule: [{
    date: String,
    time: String,
    timeSlot: String,
    djName: String,
    genre: String,
    isFeatured: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now }
  }],
  upcomingDJs: [{
    name: String,
    genre: String,
    timeSlot: String
  }],
  songReports: [{
    assignedSong: String,
    djName: String,
    status: String,
    icon: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

managerProfileSchema.virtual('stats').get(function() {
  return {
    djsScheduled: this.schedule.length,
    activeShows: this.upcomingDJs.length,
    songReports: this.songReports.length
  };
});

managerProfileSchema.set('toJSON', { virtuals: true });
managerProfileSchema.set('toObject', { virtuals: true });

managerProfileSchema.methods.addToSchedule = function(scheduleData) {
  this.schedule.push(scheduleData);
};

managerProfileSchema.methods.removeFromSchedule = function(index) {
  if (index >= 0 && index < this.schedule.length) {
    this.schedule.splice(index, 1);
  }
};

managerProfileSchema.methods.updateSchedule = function(index, scheduleData) {
  if (index >= 0 && index < this.schedule.length) {
    this.schedule[index] = { ...this.schedule[index], ...scheduleData };
  }
};

managerProfileSchema.methods.setFeatured = function(index) {
  this.schedule.forEach(slot => slot.isFeatured = false);
  if (index >= 0 && index < this.schedule.length) {
    this.schedule[index].isFeatured = true;
  }
};

managerProfileSchema.methods.addSongReport = function(reportData) {
  this.songReports.push(reportData);
};

module.exports = mongoose.model('ManagerProfile', managerProfileSchema);