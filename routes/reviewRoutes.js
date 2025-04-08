const express = require("express");
const axios = require("axios");
const router = express.Router();

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY; // Store API key in .env

// Function to get `place_id` from a place name
const getPlaceId = async (placeName) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(placeName)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`;
        const response = await axios.get(url);
        return response.data.candidates[0]?.place_id || null;
    } catch (error) {
        console.error("❌ Error fetching Place ID:", error.message);
        return null;
    }
};

// GET Reviews by Place Name or Place ID
router.get("/", async (req, res) => {
    try {
        let { placeId, placeName } = req.query;

        if (!placeId && !placeName) {
            return res.status(400).json({ msg: "Provide either placeId or placeName" });
        }

        // Convert placeName to placeId if needed
        if (!placeId && placeName) {
            placeId = await getPlaceId(placeName);
            if (!placeId) {
                return res.status(404).json({ msg: "Place not found" });
            }
        }

        // Fetch reviews from Google Places API
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${GOOGLE_PLACES_API_KEY}`;
        const response = await axios.get(url);
        const reviews = response.data.result?.reviews || [];

        res.json(reviews.length ? reviews : { msg: "No reviews found for this place" });
    } catch (error) {
        console.error("❌ Error fetching Google Reviews:", error.message);
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

module.exports = router;
