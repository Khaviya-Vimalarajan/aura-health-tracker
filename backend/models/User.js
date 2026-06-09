import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // Email format validation: must contain @ and . 
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please enter a valid email address (example@domain.com)'
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  preferences: {
    theme: { type: String, default: 'dark' },
    waterGoal: { type: Number, default: 2500 },
    stepsGoal: { type: Number, default: 10000 },
    sleepGoal: { type: Number, default: 8 },
  },
});

const User = mongoose.model('User', UserSchema);
export default User;