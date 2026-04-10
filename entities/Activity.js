import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  user_email: { type: String },
  date: { type: String },
  steps: { type: Number },
  calories_burned: { type: Number },
});

export const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
