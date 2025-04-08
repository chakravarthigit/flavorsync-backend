 
const { getGoogleReviews } = require("../services/reviewService");

// Fetch reviews for a specific food place
exports.fetchReviews = async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) return res.status(400).json({ msg: "Place ID is required" });

    const reviews = await getGoogleReviews(placeId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};
