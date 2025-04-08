const axios = require("axios");
require("dotenv").config();

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = "https://maps.googleapis.com/maps/api/place/details/json";

exports.getGoogleReviews = async (placeId) => {
  try {
    const response = await axios.get(GOOGLE_PLACES_URL, {
      params: {
        place_id: placeId,
        key: GOOGLE_API_KEY,
        fields: "name,rating,reviews",
      },
    });

    if (response.data.result) {
      return response.data.result.reviews || [];
    }

    return [];
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return [];
  }
};

