import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
  user_email: { type: String },
  date: { type: String },
  type: { type: String },
  duration_min: { type: Number },
});

export const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);
