const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const User = require('../models/User');

// Helper function to get network IP
function getNetworkAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Make sure we save to the same directory that express.static serves from
    const uploadDir = path.join(__dirname, '../uploads');
    console.log('Saving file to:', uploadDir);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads directory');
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.body.userId || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname) || '.jpg';
    const filename = `profile_${userId}_${uniqueSuffix}${fileExt}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload profile image
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    console.log('Received upload request');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.body.userId;
    console.log('User ID from request:', userId);

    if (!userId) {
      console.log('No user ID provided');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Instead of using local IP, use the Render deployment URL
    // Also check if we're in production or development environment
    let imageUrl;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.IS_RENDER === 'true';
    
    if (isProduction) {
      // Use the Render domain in production
      imageUrl = `https://flavorsync-backend.onrender.com/uploads/${req.file.filename}`;
      console.log('Using production URL for image:', imageUrl);
    } else {
      // Use local development IP in development
      const serverIp = getNetworkAddress();
      const PORT = process.env.PORT || 5000;
      imageUrl = `http://${serverIp}:${PORT}/uploads/${req.file.filename}`;
      console.log('Using development URL for image:', imageUrl);
    }

    // Double-check that the file exists
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    console.log('Checking if file exists at:', filePath);
    const fileExists = fs.existsSync(filePath);
    console.log('File exists:', fileExists);
    
    // Update user's profile image in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    );

    if (!updatedUser) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Successfully updated user profile image');
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      message: 'Profile image uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

// Update user profile
router.post('/update-profile', async (req, res) => {
  try {
    const { _id, name, username, email, phoneNumber, bio, profileImage } = req.body;

    if (!_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fix profile image URL if it contains an IP address
    let updatedProfileImage = profileImage;
    if (profileImage && (
      profileImage.includes('10.214.96.37') || 
      profileImage.includes('192.168.') || 
      profileImage.includes('localhost') || 
      profileImage.includes('127.0.0.1')
    )) {
      // Extract the filename from the URL
      const urlParts = profileImage.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Replace with Render URL
      updatedProfileImage = `https://flavorsync-backend.onrender.com/uploads/${filename}`;
      console.log('Fixed profile image URL:', updatedProfileImage);
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        name,
        username,
        email,
        phoneNumber,
        bio,
        profileImage: updatedProfileImage,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router; 