const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: String,
  type: { type: String },
  starred: Boolean,
  trashed: Boolean,
  key: String,
  parent: String,
  created: Date,
  updated: Date,
  children: [String]
})

const Content = mongoose.model('Content', contentSchema);

module.exports = Content
