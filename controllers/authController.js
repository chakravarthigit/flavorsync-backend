const User = require("../models/User");  // Ensure you have a User model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require('resend');

// Initialize Resend with API key from environment variable or use the provided key
const resendApiKey = process.env.RESEND_API_KEY || 're_YuZv88Ke_82M38GpNF2Skbx6gpKxoJk1v';
const resend = new Resend(resendApiKey);

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
                msg: "If an account with that email exists, an OTP has been sent." 
            });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP expiration (10 minutes from now)
        user.resetPasswordToken = otp;
        user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
        
        await user.save();
        
        // Send OTP via email using Resend
        const { data, error } = await resend.emails.send({
            from: 'FlavorSync <noreply@flavorsync.xyz>',
            to: email,
            subject: 'FlavorSync Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You recently requested to reset your password for your FlavorSync account. Use the following OTP code to reset your password:</p>
                    <div style="margin: 20px 0; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${otp}</div>
                    </div>
                    <p>This OTP will expire in 10 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                    <p style="margin-top: 30px; font-size: 14px; color: #777;">© ${new Date().getFullYear()} FlavorSync. All rights reserved.</p>
                </div>
            `
        });
        
        if (error) {
            console.error("❌ Email sending error:", error);
            return res.status(500).json({ msg: "Failed to send OTP email" });
        }
        
        console.log('OTP sent successfully to:', email);
        console.log('OTP:', otp);
        
        return res.status(200).json({ 
            msg: "If an account with that email exists, an OTP has been sent." 
        });
        
    } catch (error) {
        console.error("❌ Forgot Password Error:", error.message);
        return res.status(500).json({ msg: "Server Error" });
    }
};

// ✅ Validate OTP Function
exports.validateOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ msg: "Email and OTP are required" });
        }
        
        // Find user by email and check if OTP is still valid
        const user = await User.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ 
                valid: false,
                msg: "Invalid or expired OTP" 
            });
        }
        
        // Return validation result
        res.json({ 
            valid: true,
            msg: "OTP is valid" 
        });
        
    } catch (error) {
        console.error("❌ Validate OTP Error:", error.message);
        res.status(500).json({ msg: "Server Error" });
    }
};

// ✅ Reset Password Function
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        
        if (!email || !otp || !password) {
            return res.status(400).json({ msg: "Email, OTP, and new password are required" });
        }
        
        // Find user by email and OTP and check if OTP is still valid
        const user = await User.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired OTP" });
        }
        
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Update password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        
        await user.save();
        
        console.log('Password reset successful for user:', user.email);
        
        return res.status(200).json({ msg: "Password has been reset successfully" });
        
    } catch (error) {
        console.error("❌ Reset Password Error:", error.message);
        return res.status(500).json({ msg: "Server Error" });
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
