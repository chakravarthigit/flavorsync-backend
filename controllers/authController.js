const User = require("../models/User");  // Ensure you have a User model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ Register Function
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.json({ msg: "User registered successfully" });
    } catch (error) {
        console.error("❌ Register Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
};

// ✅ Login Function
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists - don't use lean() here so we get the methods
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "User not found" });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        // Get the full user profile directly
        const userProfile = await User.findById(user._id);
        
        // Log the full user data being returned
        console.log('User data for login response:', {
            id: userProfile._id,
            name: userProfile.name,
            email: userProfile.email,
            username: userProfile.username,
            profileImage: userProfile.profileImage || 'Not set'
        });

        // Use the model's toAuthJSON method to get consistent user data
        const userData = userProfile.toAuthJSON();

        // Return response with token and user data
        res.json({
            token: token,
            user: userData
        });

    } catch (err) {
        console.error("❌ Login Error:", err.message);
        res.status(500).json({ msg: "Server Error" });
    }
};
