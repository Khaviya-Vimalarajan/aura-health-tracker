import express from 'express';
import HealthLog from '../models/HealthLog.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get today's log (or specific date)
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const log = await HealthLog.findOne({
      userId: req.userId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });
    
    res.json(log || { message: 'No log for today yet' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update today's log
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { energyScore, mood, sleepHours, waterIntake, steps, habits, notes } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.userId, date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
      {
        userId: req.userId,
        date: today,
        energyScore,
        mood,
        sleepHours,
        waterIntake,
        steps,
        habits,
        notes,
      },
      { upsert: true, new: true }
    );
    
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get last 7 days of logs
router.get('/weekly', authMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const logs = await HealthLog.find({
      userId: req.userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: -1 });
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;