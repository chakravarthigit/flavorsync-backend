const Food = require("../models/food");

// Add a new food item
exports.addFood = async (req, res) => {
  try {
    const { name, category, cuisine, calories, image } = req.body;
    const newFood = new Food({ name, category, cuisine, calories, image });
    await newFood.save();
    res.json({ msg: "Food item added", food: newFood });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// Get all food items
exports.getFoods = async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    console.error("Error in getFoods:", error); // ✅ Logs the actual error
    res.status(500).json({ msg: "Server Error", error: error.message });
  } // <-- Missing closing bracket added here
};


// Get food recommendations (simple filter for now)
exports.getRecommendations = async (req, res) => {
  try {
    const { category, cuisine } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (cuisine) query.cuisine = cuisine;

    const foods = await Food.find(query);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};
