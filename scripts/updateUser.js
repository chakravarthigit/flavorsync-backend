require('dotenv').config();
const mongoose = require('mongoose');

// The image URL from previous logs
const imageUrl = 'http://192.168.55.101:5000/uploads/user_67f4384a5f702ea6807e84b7_1744061559035-729793075.jpg';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Update the user directly in the collection
    return mongoose.connection.db.collection('users').updateOne(
      { email: 'raj123@gmail.com' },
      { 
        $set: { 
          profileImage: imageUrl,
          username: 'raj123'  // Also set username since it was undefined
        }
      }
    );
  })
  .then(result => {
    console.log('Update result:', result);
    
    // Verify the update
    return mongoose.connection.db.collection('users').findOne({email: 'raj123@gmail.com'});
  })
  .then(user => {
    if (user) {
      console.log('Updated user:');
      console.log(JSON.stringify(user, null, 2));
      console.log('Profile Image:', user.profileImage || 'Not set');
    } else {
      console.log('User not found after update');
    }
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    return mongoose.disconnect();
  }); 