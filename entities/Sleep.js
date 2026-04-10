import mongoose from 'mongoose';

const SleepSchema = new mongoose.Schema({
  user_email: { type: String },
  date: { type: String },
  hours: { type: Number },
});

export const Sleep = mongoose.models.Sleep || mongoose.model('Sleep', SleepSchema);
