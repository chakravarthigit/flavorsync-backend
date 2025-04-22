const express = require("express");
const { register, login, forgotPassword, resetPassword, validateResetToken } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/validate-reset-token/:token", validateResetToken);

module.exports = router;
 
