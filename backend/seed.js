import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import HealthLog from './models/HealthLog.js';

dotenv.config();

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    // Find the first user in the system
    const user = await User.findOne();
    if (!user) {
      console.error('❌ No user found in the database. Please register an account on the frontend first!');
      process.exit(1);
    }

    console.log(`Generating mock health logs for user: ${user.email} (${user.name})`);

    // Clean existing logs to prevent duplicates
    await HealthLog.deleteMany({ userId: user._id });
    console.log('Cleaned existing health logs.');

    const logsData = [];
    const moods = ['great', 'good', 'okay', 'low', 'exhausted'];
    
    // Generate data for the past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Create realistic patterns (e.g. meditating is linked to better mood & energy)
      const meditated = Math.random() > 0.4;
      const walked = Math.random() > 0.3;
      const ateHealthy = Math.random() > 0.3;

      let mood = 'okay';
      let energyScore = 60;
      
      if (meditated && walked) {
        mood = 'great';
        energyScore = 90;
      } else if (walked || ateHealthy) {
        mood = 'good';
        energyScore = 75;
      } else if (!walked && !meditated && Math.random() > 0.5) {
        mood = 'low';
        energyScore = 35;
      }

      logsData.push({
        userId: user._id,
        date,
        energyScore,
        mood,
        sleepHours: Math.round((6 + Math.random() * 3) * 10) / 10, // 6 to 9 hours
        waterIntake: 1500 + Math.round(Math.random() * 3) * 500, // 1500 to 3000 ml
        steps: walked ? 7000 + Math.round(Math.random() * 5000) : 1500 + Math.round(Math.random() * 2000),
        habits: {
          meditated,
          walked,
          ateHealthy
        },
        notes: `Mock log for day -${i}`
      });
    }

    await HealthLog.insertMany(logsData);
    console.log('✅ Generated 7 days of health logs successfully!');
    console.log('Run "npm run dev" and log in on the frontend to check your new charts & insights!');
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seed();
