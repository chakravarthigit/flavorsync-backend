const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the User schema to match the database structure
const UserSchema = new Schema({
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
    required: true 
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: 'Food enthusiast using FlavorSync to discover great meals.'
  },
  profileImage: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true, // Keep the timestamps created by MongoDB
  toJSON: { virtuals: true }, // Include virtuals when converted to JSON
  toObject: { virtuals: true } // Include virtuals when converted to object
});

// Method to convert user object to safe JSON for client
UserSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    id: this._id, // Include both formats for compatibility
    name: this.name,
    email: this.email,
    username: this.username,
    bio: this.bio,
    phoneNumber: this.phoneNumber,
    profileImage: this.profileImage,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', UserSchema);
