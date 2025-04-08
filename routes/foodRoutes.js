const express = require("express");
const { addFood, getFoods, getRecommendations } = require("../controllers/foodController");
const router = express.Router();

router.post("/add", addFood); // Add food item
router.get("/all", getFoods); // Get all food items
router.get("/recommend", getRecommendations); // Get food recommendations

module.exports = router;
