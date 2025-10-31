// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  pass: { type: String, required: true },
  name: { type: String, required: true },
  currency: { type: Number, default: 0 },
  experience: { type: Number, default: 0 },
  flags: { type: Object, default: {} }
});

module.exports = mongoose.model('User', userSchema);