const mongoose = require("mongoose");

// Define the Restaurant schema with geospatial location support
const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cuisine: { type: String, required: true },
  address: { type: String, required: true },
  description: { type: String },
  priceRange: { type: String, default: '₹₹' },
  rating: { type: Number, default: 4.5 },
  image: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  placeId: { type: String }, // Google Places ID if available
  vicinity: { type: String }, // Simplified address from Google Places
  distance: { type: Number } // Distance in meters (calculated field)
}, { timestamps: true });

// Add geospatial index for location-based queries
RestaurantSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("Restaurant", RestaurantSchema); 