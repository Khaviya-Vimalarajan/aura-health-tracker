import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import HealthLog from '../models/HealthLog.js';

// Setup email transport config (falls back to console logging if credentials not set)
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      auth: { user, pass }
    });
  }
  return null;
};

// Main function to run the daily log check
export const runReminderCheck = async () => {
  console.log('⏰ Running daily health logging reminder check...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Get all users
    const users = await User.find();
    let remindersSent = 0;

    for (const user of users) {
      // Check if user logged today
      const todayLog = await HealthLog.findOne({
        userId: user._id,
        date: { $gte: today, $lt: tomorrow }
      });

      if (!todayLog) {
        remindersSent++;
        const subject = '🌿 Complete your Aura Vibe Check today!';
        const body = `Hi ${user.name},\n\nWe noticed you haven't recorded your health metrics for today yet. Keeping a daily log is the key to unlocking accurate health insights!\n\nTake 30 seconds to log your sleep, steps, hydration, and mood on Aura.\n\nBe well,\nTeam Aura`;

        const transporter = getTransporter();

        if (transporter) {
          try {
            await transporter.sendMail({
              from: process.env.SMTP_FROM || '"Aura Health" <reminders@aurahealth.com>',
              to: user.email,
              subject,
              text: body
            });
            console.log(`✉️ Real Email Reminder sent to: ${user.email}`);
          } catch (mailError) {
            console.error(`❌ Failed to send email to ${user.email}:`, mailError.message);
            logMockEmail(user.email, subject, body);
          }
        } else {
          // Mock logging fallback
          logMockEmail(user.email, subject, body);
        }
      }
    }

    console.log(`✓ Reminder check complete. Reminders triggered for ${remindersSent}/${users.length} users.`);
    return { success: true, checked: users.length, sent: remindersSent };
  } catch (err) {
    console.error('❌ Error in reminder check:', err);
    return { success: false, error: err.message };
  }
};

const logMockEmail = (email, subject, body) => {
  console.log('\n==================================================');
  console.log(`📡 [MOCK EMAIL REMINDER SENT]`);
  console.log(`📬 To:      ${email}`);
  console.log(`📌 Subject: ${subject}`);
  console.log(`💬 Body:\n${body}`);
  console.log('==================================================\n');
};

// Schedule background job to run every night at 9:00 PM (21:00)
export const initCronJobs = () => {
  // Cron expression: 0 21 * * * (At 21:00 / 9:00 PM every day)
  // For testing convenience, we'll initialize the cron job
  cron.schedule('0 21 * * *', () => {
    runReminderCheck();
  });
  console.log('📅 Background reminder cron job scheduled for 9:00 PM daily.');
};
