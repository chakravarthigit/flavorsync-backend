const Restaurant = require("../models/Restaurant");
const axios = require("axios");

// Get all restaurants from the database
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Get nearby restaurants using Google Places API
exports.getNearbyRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, radius = 1500 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ msg: "Latitude and longitude are required" });
    }

    // First, check our database for restaurants within the radius
    const localRestaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    });

    // Then, fetch from Google Places API
    const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${API_KEY}`;
    
    const response = await axios.get(url);
    const placesResults = response.data.results;
    
    // Transform Google Places results to match our schema
    const googleRestaurants = placesResults.map(place => {
      // Calculate distance (simple approximation for now)
      const placeLatitude = place.geometry.location.lat;
      const placeLongitude = place.geometry.location.lng;
      
      return {
        name: place.name,
        placeId: place.place_id,
        vicinity: place.vicinity,
        rating: place.rating || 4.0,
        priceRange: place.price_level ? '₹'.repeat(place.price_level) : '₹₹',
        image: place.photos && place.photos.length > 0 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${API_KEY}`
          : 'https://i.imgur.com/Nm7vIGs.jpeg', // Default image
        cuisine: place.types.includes('restaurant') ? 'Restaurant' : place.types[0].replace('_', ' '),
        address: place.vicinity,
        location: {
          type: 'Point',
          coordinates: [placeLongitude, placeLatitude]
        },
        // Store these restaurants in database for future use
        _justFetched: true
      };
    });
    
    // Save new restaurants to database if they don't already exist
    for (const restaurant of googleRestaurants) {
      if (restaurant._justFetched) {
        const { _justFetched, ...restaurantData } = restaurant;
        // Check if already exists by placeId
        const exists = await Restaurant.findOne({ placeId: restaurantData.placeId });
        if (!exists) {
          try {
            const newRestaurant = new Restaurant(restaurantData);
            await newRestaurant.save();
          } catch (saveError) {
            console.error("Error saving restaurant:", saveError);
            // Continue with next restaurant
          }
        }
      }
    }
    
    // Combine results, removing duplicates
    const allRestaurants = [...localRestaurants];
    
    // Add Google restaurants that don't exist in localRestaurants
    for (const googleRest of googleRestaurants) {
      const exists = localRestaurants.some(localRest => 
        localRest.placeId === googleRest.placeId
      );
      
      if (!exists) {
        delete googleRest._justFetched;
        allRestaurants.push(googleRest);
      }
    }
    
    res.json(allRestaurants);
  } catch (error) {
    console.error("Error fetching nearby restaurants:", error);
    res.status(500).json({ msg: "Server Error", details: error.message });
  }
};

// Add restaurant
exports.addRestaurant = async (req, res) => {
  try {
    const { 
      name, cuisine, address, description, priceRange, 
      rating, image, latitude, longitude 
    } = req.body;
    
    // Ensure coordinates are provided
    if (!latitude || !longitude) {
      return res.status(400).json({ msg: "Coordinates (latitude, longitude) are required" });
    }
    
    const newRestaurant = new Restaurant({
      name,
      cuisine,
      address,
      description,
      priceRange,
      rating: parseFloat(rating) || 4.5,
      image,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    });
    
    await newRestaurant.save();
    res.json({ msg: "Restaurant added successfully", restaurant: newRestaurant });
  } catch (error) {
    console.error("Error adding restaurant:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    res.status(500).json({ msg: "Server Error" });
  }
}; 