const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: String,
  body: String
})

const Document = mongoose.model('Document', documentSchema);

module.exports = Document
