import mongoose from 'mongoose';

const HealthLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  energyScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'low', 'exhausted'],
    required: true,
  },
  sleepHours: {
    type: Number,
    min: 0,
    max: 24,
    default: 0,
  },
  waterIntake: {
    type: Number,
    default: 0,
    comment: 'in milliliters',
  },
  steps: {
    type: Number,
    default: 0,
  },
  habits: {
    meditated: { type: Boolean, default: false },
    walked: { type: Boolean, default: false },
    ateHealthy: { type: Boolean, default: false },
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure one log per user per day
HealthLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const HealthLog = mongoose.model('HealthLog', HealthLogSchema);
export default HealthLog;