const User = require("../models/User");  // Ensure you have a User model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

// ✅ Forgot Password Function
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ msg: "Email is required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal that the user doesn't exist
            return res.status(200).json({ 
                msg: "If an account with that email exists, a password reset link has been sent." 
            });
        }
        
        // Generate random token
        const token = crypto.randomBytes(20).toString('hex');
        
        // Set token expiration (1 hour from now)
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        
        await user.save();
        
        // Create a transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail', 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        
        // Get the frontend URL from environment or use default
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        // Define email options
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@flavorsync.com',
            to: user.email,
            subject: 'FlavorSync Password Reset',
            text: 
                `You are receiving this because you (or someone else) requested a password reset for your account.\n\n` +
                `Please click on the following link, or paste it into your browser to complete the process:\n\n` +
                `${frontendUrl}/reset-password/${token}\n\n` +
                `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };
        
        // Send the email
        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ msg: "Error sending email" });
            }
            
            // For security, always return success even if the user doesn't exist
            return res.status(200).json({ 
                msg: "If an account with that email exists, a password reset link has been sent." 
            });
        });
        
    } catch (error) {
        console.error("❌ Forgot Password Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
};

// ✅ Reset Password Function
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({ msg: "Token and new password are required" });
        }
        
        // Find user by token
        const user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }  // Check if token is still valid
        });
        
        if (!user) {
            return res.status(400).json({ msg: "Password reset token is invalid or has expired" });
        }
        
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        // Clear reset token fields
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        
        await user.save();
        
        // Return success message
        res.json({ msg: "Password has been reset successfully" });
        
    } catch (error) {
        console.error("❌ Reset Password Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
};

// ✅ Validate Reset Token Function (to check if a token is valid before showing reset form)
exports.validateResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ msg: "Token is required" });
        }
        
        // Find user by token
        const user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }  // Check if token is still valid
        });
        
        if (!user) {
            return res.status(400).json({ 
                valid: false,
                msg: "Password reset token is invalid or has expired" 
            });
        }
        
        // Return validation result
        res.json({ 
            valid: true,
            msg: "Token is valid" 
        });
        
    } catch (error) {
        console.error("❌ Validate Reset Token Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
};
