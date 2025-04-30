const express = require("express");
const authController = require('../controllers/authController');
const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/validate-otp", authController.validateOTP);
router.post("/reset-password", authController.resetPassword);
router.get("/validate-reset-token/:token", authController.validateResetToken);

// Test email route - REMOVED

module.exports = router;
 
