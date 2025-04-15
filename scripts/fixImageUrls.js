/**
 * Script to fix existing image URLs in the database
 * 
 * Run with: node scripts/fixImageUrls.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function fixImageUrls() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Find all users with profile images containing IP addresses
    const users = await User.find({
      profileImage: {
        $regex: /(10\.214\.96\.37|192\.168\.|localhost|127\.0\.0\.1)/
      }
    });

    console.log(`Found ${users.length} users with incorrect image URLs`);

    // Fix each user's profile image URL
    for (const user of users) {
      if (!user.profileImage) continue;

      // Extract the filename from the URL
      const urlParts = user.profileImage.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Create new URL with Render domain
      const newImageUrl = `https://flavorsync-backend.onrender.com/uploads/${filename}`;
      
      console.log(`Updating user ${user._id}:`);
      console.log(`  Old URL: ${user.profileImage}`);
      console.log(`  New URL: ${newImageUrl}`);
      
      // Update the user record
      await User.findByIdAndUpdate(user._id, {
        profileImage: newImageUrl
      });
    }

    console.log('Image URL update completed successfully');
  } catch (error) {
    console.error('Error fixing image URLs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
fixImageUrls(); 