require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Query for the user directly from the collection
    return mongoose.connection.db.collection('users').findOne({email: 'raj123@gmail.com'});
  })
  .then(user => {
    if (user) {
      console.log('User found:');
      console.log(JSON.stringify(user, null, 2));
      console.log('Profile Image:', user.profileImage || 'Not set');
    } else {
      console.log('User not found');
    }
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    return mongoose.disconnect();
  }); 