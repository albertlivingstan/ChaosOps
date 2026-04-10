import mongoose from 'mongoose';

const SocialSchema = new mongoose.Schema({
});

export const Social = mongoose.models.Social || mongoose.model('Social', SocialSchema);
