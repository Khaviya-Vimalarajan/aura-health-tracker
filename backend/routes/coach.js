import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import HealthLog from '../models/HealthLog.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/coach/chat
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body; // Array of { role: 'user'|'assistant', content: string }
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    // Retrieve recent logs (past 14 days)
    const logs = await HealthLog.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(14);

    // Format logs for context
    let healthDataSummary = "No logs recorded yet.";
    if (logs.length > 0) {
      healthDataSummary = logs.map(log => {
        const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        });
        const habitsList = Object.entries(log.habits || {})
          .filter(([_, active]) => active)
          .map(([habit]) => habit)
          .join(', ') || 'none';
          
        return `- ${formattedDate}: Sleep: ${log.sleepHours} hrs, Mood: ${log.mood}, Water: ${log.waterIntake} ml, Steps: ${log.steps}, Habits: [${habitsList}], Energy Score: ${log.energyScore}/100`;
      }).join('\n');
    }

    const systemPrompt = `You are Aura Coach, a friendly, professional AI wellness coach integrated into the Aura Health Tracker application.
Your goal is to analyze the user's logged health data, provide actionable and realistic advice, and keep them motivated.
Be warm, encouraging, concise, and focused on wellness. NEVER give medical prescriptions, but instead guide them on habits, routines, water intake, sleep, and movement.

Here is the user's health logging history for the last 14 days:
${healthDataSummary}

If they ask you to analyze their patterns, refer to the data above. If they have no logs, gently encourage them to log their mood, sleep, or water today.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
      // Fallback: Intelligent mock coaching responses based on real logs for a great demo experience!
      const userMessage = messages[messages.length - 1].content.toLowerCase();
      let responseContent = "";

      if (userMessage.includes('sleep') || userMessage.includes('tired')) {
        const avgSleep = logs.length ? (logs.reduce((acc, curr) => acc + curr.sleepHours, 0) / logs.length).toFixed(1) : 0;
        responseContent = `Hello there! I noticed you are asking about your sleep patterns. Looking at your logs, your average sleep duration is ${avgSleep} hours. 
        To optimize your sleep, I'd suggest winding down 30 minutes earlier, keeping your bedroom dark, and logging a calm habit like meditation. How does your evening routine look tonight? 
        *(Note: Operating in demo mode - set ANTHROPIC_API_KEY in backend/.env for live AI responses)*`;
      } else if (userMessage.includes('water') || userMessage.includes('hydrate') || userMessage.includes('hydration')) {
        const avgWater = logs.length ? Math.round(logs.reduce((acc, curr) => acc + curr.waterIntake, 0) / logs.length) : 0;
        responseContent = `Hi! Staying hydrated is crucial for maintaining energy! Your recorded logs show an average water intake of ${avgWater} ml. 
        Try keeping a reusable bottle at your desk and sipping periodically. Small steps lead to big wins! 
        *(Note: Operating in demo mode - set ANTHROPIC_API_KEY in backend/.env for live AI responses)*`;
      } else if (userMessage.includes('mood') || userMessage.includes('vibe')) {
        const moodCounts = logs.reduce((acc, curr) => {
          acc[curr.mood] = (acc[curr.mood] || 0) + 1;
          return acc;
        }, {});
        const dominantMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b, 'good');
        responseContent = `Hey! Your mood history has been predominantly "${dominantMood}" recently. 
        It is completely natural to experience ups and downs. Doing simple things like going for a short walk or taking 5 deep breaths can help lift your state. What's one positive thing you can focus on today?
        *(Note: Operating in demo mode - set ANTHROPIC_API_KEY in backend/.env for live AI responses)*`;
      } else {
        responseContent = `Hi! I'm Aura Coach, your personal wellness companion. I can analyze your logs, help you set habits, or design customized wellness challenges. 
        Based on your logging, you have recorded ${logs.length} day(s) of health logs. What aspect of your health would you like to discuss today - sleep, steps, habits, or hydration?
        *(Note: Operating in demo mode - set ANTHROPIC_API_KEY in backend/.env for live AI responses)*`;
      }

      // Simulate a small network latency
      await new Promise(resolve => setTimeout(resolve, 800));

      return res.json({
        content: responseContent,
        model: 'demo-mode-fallbacks'
      });
    }

    // Call Anthropic API
    const anthropic = new Anthropic({ apiKey });
    
    // Format message history for Anthropic messages API
    // Anthropic API expects messages to alternate between 'user' and 'assistant'
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: systemPrompt,
      messages: formattedMessages,
    });

    res.json({
      content: response.content[0].text,
      model: response.model
    });

  } catch (error) {
    console.error('AI Coach Error:', error);
    res.status(500).json({ message: 'Error processing AI chat query', error: error.message });
  }
});

export default router;
