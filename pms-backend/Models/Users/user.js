import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  phone: { type: String },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: [
      'warehouse_officer',
      'warehouse_supervisor',
      'warehouse_manager',
      'port_manager',
      'admin',
      'IT'
    ],
    required: true
  }
}, { timestamps: true });

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default model('User', userSchema);