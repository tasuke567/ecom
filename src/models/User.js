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
   required: function() {
     return !this.googleId; // Password ไม่จำเป็นถ้าเป็น Google login
   }
 },
 googleId: {
   type: String,
   sparse: true
 },
 picture: String,
 createdAt: {
   type: Date,
   default: Date.now
 }
);
module.exports = mongoose.model('User', userSchema);