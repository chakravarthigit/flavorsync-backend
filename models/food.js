const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  cuisine: { type: String, required: true },
  calories: { type: Number, required: true },
  image: { type: String, required: true }, // URL or local path
});

module.exports = mongoose.model("food", FoodSchema);
