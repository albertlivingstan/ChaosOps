import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
});

export const Progress = mongoose.models.Progress || mongoose.model('Progress', ProgressSchema);
