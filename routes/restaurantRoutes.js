const express = require("express");
const { 
  getAllRestaurants, 
  getNearbyRestaurants, 
  addRestaurant,
  getRestaurantById
} = require("../controllers/restaurantController");
const router = express.Router();

// Get all restaurants
router.get("/all", getAllRestaurants);

// Get nearby restaurants (requires lat, lng query params)
router.get("/nearby", getNearbyRestaurants);

// Get restaurant by ID
router.get("/:id", getRestaurantById);

// Add a new restaurant
router.post("/add", addRestaurant);

module.exports = router; 