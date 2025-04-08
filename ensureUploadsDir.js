const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created successfully');
} else {
  console.log('Uploads directory already exists');
}

// Check directory permissions
fs.access(uploadsDir, fs.constants.W_OK, (err) => {
  if (err) {
    console.error('Uploads directory is not writable:', err);
  } else {
    console.log('Uploads directory is writable');
  }
}); 