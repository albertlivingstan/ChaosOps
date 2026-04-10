import mongoose from 'mongoose';

const UsersSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  picture: { type: String },
  email: { type: String },
  token: { type: String },
});

export const Users = mongoose.models.Users || mongoose.model('Users', UsersSchema);
