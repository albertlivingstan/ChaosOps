import mongoose from 'mongoose';

const NutritionSchema = new mongoose.Schema({
  user_email: { type: String },
  date: { type: String },
  meal: { type: String },
  calories: { type: Number },
  items: { type: [String] },
});

export const Nutrition = mongoose.models.Nutrition || mongoose.model('Nutrition', NutritionSchema);
