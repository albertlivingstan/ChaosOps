import mongoose from 'mongoose';

const RecommendationsSchema = new mongoose.Schema({
});

export const Recommendations = mongoose.models.Recommendations || mongoose.model('Recommendations', RecommendationsSchema);
