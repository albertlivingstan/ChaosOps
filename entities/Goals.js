import mongoose from 'mongoose';

const GoalsSchema = new mongoose.Schema({
});

export const Goals = mongoose.models.Goals || mongoose.model('Goals', GoalsSchema);
