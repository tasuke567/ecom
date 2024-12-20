const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function () {
      return !this.isGoogleUser; // password required only for non-Google users
    }
  },
  googleId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('User', userSchema);