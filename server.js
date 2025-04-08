require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006',
      'http://192.168.55.102:19006',
      'https://flavorsync.netlify.app',
      'exp://192.168.55.102:19000',
      'http://192.168.55.101:19006',
      'http://192.168.55.102:3000',
      'https://flavorsync.onrender.com',
      'http://10.0.2.2:5000', // Android emulator localhost
      'http://localhost:5000', // Add local development
      'http://10.0.2.2:19006', // Add Expo development server
      'http://10.0.2.2:8081', // Add React Native development server
      'http://192.168.1.100:5000', // Add local network IP
      'http://192.168.1.100:19006',
      'http://192.168.1.100:8081'
    ];
    
    if(allowedOrigins.indexOf(origin) === -1){
      console.log(`Request from origin ${origin} - not in allowed list`);
      return callback(null, true); // Allow all origins for development
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add body parser middleware with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: err.message 
  });
});

// Import routes
const routes = require('./routes/index');

// Use routes with /api prefix
app.use('/api', routes);

// Add a root endpoint for easy testing
app.get('/', (req, res) => {
  res.json({
    message: 'FlavorSync API is running',
    endpoints: {
      healthcheck: '/api/healthcheck',
      login: '/api/auth/login',
      register: '/api/auth/register'
    }
  });
});

// Setup uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at:', uploadDir);
}

// Serve the uploads directory statically
// Place this AFTER all middleware but BEFORE routes
app.use('/uploads', express.static(uploadDir));
console.log('Serving static files from:', uploadDir);

// Import Routes
const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const userRoutes = require('./routes/userRoutes');

let foodRoutes, reviewRoutes, chatbotRoutes;

try {
    foodRoutes = require("./routes/foodRoutes");
    reviewRoutes = require("./routes/reviewRoutes");
    chatbotRoutes = require("./routes/chatbotRoutes");
} catch (error) {
    console.warn("⚠️ Some route files not found. If needed, create them.");
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/users", userRoutes); // This will handle /api/users/upload-image
if (foodRoutes && typeof foodRoutes === "function") app.use("/api/food", foodRoutes);
if (reviewRoutes && typeof reviewRoutes === "function") app.use("/api/reviews", reviewRoutes);
if (chatbotRoutes && typeof chatbotRoutes === "function") app.use("/api/chatbot", chatbotRoutes);

// Add a simple endpoint to check if file serving works
app.get('/check-uploads', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ 
        message: 'Error reading uploads directory',
        error: err.message
      });
    }
    
    res.json({
      message: 'Uploads directory content',
      files: files,
      uploadPath: uploadDir
    });
  });
});

// Add a diagnostic route
app.get("/api/healthcheck", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "FlavorSync API is running",
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

// Verify MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('❌ MongoDB connection disconnected');
});

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    isMongoConnected = true;
    
    // Log the User model schema fields
    console.log('User model schema fields:', Object.keys(User.schema.paths));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    isMongoConnected = false;
  });

// Start server with specific host
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`Network: http://${getNetworkAddress()}:${PORT}`);
});

// Helper function to get network IP
function getNetworkAddress() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Global error handler: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Fallback for all other routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.originalUrl}` 
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        message: 'Email and password are required',
        receivedEmail: !!email,
        receivedPassword: !!password
      });
    }
    
    console.log('Login attempt received for:', email);
    
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;
    if (!isMongoConnected) {
      console.log('MongoDB not connected, cannot authenticate');
      return res.status(503).json({ 
        message: 'Login service unavailable - please try again later',
        mongoStatus: 'offline'
      });
    }
    
    // Find user by email with lean() to get a plain JS object
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Simple password check (in a real app, you would use bcrypt)
    if (user.password !== password) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Create a simple token (in a real app, you would use JWT)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
    
    console.log('User logged in successfully:', user.email);
    console.log('User profile image:', user.profileImage || 'No profile image');
    
    // Return user data and token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        id: user._id, // Add id field for consistency
        name: user.name,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        bio: user.bio,
        profileImage: user.profileImage, // Ensure profileImage is included
        createdAt: user.createdAt,
        lastUpdated: user.updatedAt || user.lastUpdated
      },
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Server error during login', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
