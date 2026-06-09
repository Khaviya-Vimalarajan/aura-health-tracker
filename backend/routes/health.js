import express from 'express';
import HealthLog from '../models/HealthLog.js';
import { authMiddleware } from '../middleware/auth.js';
import { runReminderCheck } from '../cron/reminders.js';

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

// Get health insights (Correlation Engine)
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    // Fetch last 30 logs to find correlations
    const logs = await HealthLog.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(30);

    if (logs.length < 3) {
      return res.json({
        status: 'collecting',
        message: `Log at least ${3 - logs.length} more day(s) to unlock smart insights!`,
        insights: []
      });
    }

    const moodValues = { great: 100, good: 80, okay: 60, low: 40, exhausted: 20 };

    // Group logs by habits
    let meditatedMoods = [];
    let noMeditatedMoods = [];
    let walkedMoods = [];
    let noWalkedMoods = [];
    let healthyFoodMoods = [];
    let noHealthyFoodMoods = [];
    
    let totalSleep = 0;
    let totalEnergy = 0;
    
    logs.forEach(log => {
      const moodScore = moodValues[log.mood] || 50;
      totalSleep += log.sleepHours || 0;
      totalEnergy += log.energyScore || 0;

      // Meditated correlation
      if (log.habits?.meditated) {
        meditatedMoods.push(moodScore);
      } else {
        noMeditatedMoods.push(moodScore);
      }

      // Walked correlation
      if (log.habits?.walked) {
        walkedMoods.push(moodScore);
      } else {
        noWalkedMoods.push(moodScore);
      }

      // Ate healthy correlation
      if (log.habits?.ateHealthy) {
        healthyFoodMoods.push(moodScore);
      } else {
        noHealthyFoodMoods.push(moodScore);
      }
    });

    const average = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const insights = [];

    // Analyze meditation impact
    if (meditatedMoods.length > 0 && noMeditatedMoods.length > 0) {
      const avgMed = average(meditatedMoods);
      const avgNoMed = average(noMeditatedMoods);
      const diff = avgMed - avgNoMed;
      if (diff > 5) {
        insights.push({
          type: 'habit_meditation',
          text: `Your mood is on average ${Math.round(diff)}% higher on days you meditate.🧘‍♀️`,
          impact: 'positive'
        });
      }
    }

    // Analyze walking impact
    if (walkedMoods.length > 0 && noWalkedMoods.length > 0) {
      const avgWalk = average(walkedMoods);
      const avgNoWalk = average(noWalkedMoods);
      const diff = avgWalk - avgNoWalk;
      if (diff > 5) {
        insights.push({
          type: 'habit_walking',
          text: `Your daily energy levels increase by about ${Math.round(diff)}% on days you log a walk.🚶‍♂️`,
          impact: 'positive'
        });
      }
    }

    // Analyze diet impact
    if (healthyFoodMoods.length > 0 && noHealthyFoodMoods.length > 0) {
      const avgHealthy = average(healthyFoodMoods);
      const avgNoHealthy = average(noHealthyFoodMoods);
      const diff = avgHealthy - avgNoHealthy;
      if (diff > 5) {
        insights.push({
          type: 'habit_diet',
          text: `Eating healthy meals is linked to a ${Math.round(diff)}% boost in your overall vibe!🥗`,
          impact: 'positive'
        });
      }
    }

    // Correlation between sleep & energy
    const sleepEnergyCorrelation = logs.filter(l => l.sleepHours >= 7 && l.energyScore >= 70).length;
    if (sleepEnergyCorrelation >= 2) {
      insights.push({
        type: 'sleep_energy',
        text: `You consistently report high energy (70+) when getting at least 7 hours of sleep.💤`,
        impact: 'positive'
      });
    }

    // Fallback if no specific differences are large enough
    if (insights.length === 0) {
      insights.push({
        type: 'general',
        text: "You're building a great logging habit! Keep logging your daily routines to find hidden correlations.",
        impact: 'neutral'
      });
    }

    res.json({
      status: 'active',
      logsAnalyzed: logs.length,
      insights
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Trigger daily logging reminders check manually (testing route)
router.post('/trigger-reminders', authMiddleware, async (req, res) => {
  try {
    const result = await runReminderCheck();
    res.json({ message: 'Reminder check triggered successfully', result });
  } catch (error) {
    res.status(500).json({ message: 'Error running reminder check', error: error.message });
  }
});

export default router;