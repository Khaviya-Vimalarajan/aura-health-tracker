import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { 
  Activity, Sparkles, Smile, Coffee, Plus, Droplets, 
  Footprints, Brain, Calendar, Moon, Sun, LogOut, MessageSquare, Apple, Settings
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

import LogModal from '../components/LogModal';
import CoachDrawer from '../components/CoachDrawer';
import SettingsModal from '../components/SettingsModal';
import { generateWeeklyPDF } from '../utils/pdfGenerator';
import BadgesCard from '../components/BadgesCard';
import VibeGrid from '../components/VibeGrid';
import InteractiveCalendar from '../components/InteractiveCalendar';
import QuestsCard from '../components/QuestsCard';
import AuraStudio from '../components/AuraStudio';

export default function Dashboard() {
  const { user: contextUser, logout, token: contextToken } = useAuth();
  const token = contextToken || localStorage.getItem('token');
  const user = contextUser || (() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [todayLog, setTodayLog] = useState(null);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [vibeLogs, setVibeLogs] = useState([]);
  const [chartLogs, setChartLogs] = useState([]);
  const [chartDays, setChartDays] = useState(7);
  const [activeView, setActiveView] = useState('chart');
  const [insightsData, setInsightsData] = useState({ status: 'collecting', insights: [] });
  
  const [activeQuestId, setActiveQuestId] = useState(() => localStorage.getItem('activeQuestId') || null);
  const [completedQuests, setCompletedQuests] = useState(() => {
    const saved = localStorage.getItem('completedQuests');
    return saved ? JSON.parse(saved) : [];
  });
  const [questXP, setQuestXP] = useState(() => Number(localStorage.getItem('questXP')) || 0);

  const getTodayDateKey = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [isAuraStudioQuestDone, setIsAuraStudioQuestDone] = useState(() => {
    const todayKey = getTodayDateKey();
    const saved = localStorage.getItem(`aura_studio_quest_${todayKey}`);
    return saved === 'true';
  });

  const handleAuraStudioQuestComplete = () => {
    const todayKey = getTodayDateKey();
    localStorage.setItem(`aura_studio_quest_${todayKey}`, 'true');
    setIsAuraStudioQuestDone(true);
  };

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [quickBreathActive, setQuickBreathActive] = useState(false);
  const [quickBreathTimer, setQuickBreathTimer] = useState(60);
  const [quickBreathPhase, setQuickBreathPhase] = useState('Inhale');
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);

  const [gratitudeText, setGratitudeText] = useState('');
  const [showGratitudeText, setShowGratitudeText] = useState(null);
  const [gratitudeBubbles, setGratitudeBubbles] = useState([
    { x: 50, y: 80, vx: 0.2, vy: -0.5, radius: 24, text: "Grateful for soft warm sunshine ☀️", color: '#F59E0B' },
    { x: 120, y: 50, vx: -0.3, vy: -0.3, radius: 28, text: "Grateful for deep, relaxing sleep 😴", color: '#8B5CF6' },
    { x: 180, y: 100, vx: 0.1, vy: -0.4, radius: 22, text: "Grateful for a fresh cup of coffee ☕", color: '#3B82F6' }
  ]);
  // Fetch chart logs specifically when the range changes
  const fetchChartData = async () => {
    if (!token) {
      setChartLogs([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/health/analytics?days=${chartDays}`);
      setChartLogs(res.data);
    } catch (err) {
      console.error('Error fetching chart analytics:', err);
    }
  };

  // Fetch dashboard data
  const fetchData = async () => {
    if (!token) {
      setTodayLog(null);
      setWeeklyLogs([]);
      setVibeLogs([]);
      setChartLogs([]);
      setInsightsData({
        status: 'collecting',
        message: 'Sign up to record logs and unlock your smart correlation insights!',
        insights: []
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [todayRes, weeklyRes, insightsRes, vibeRes] = await Promise.all([
        axios.get('http://localhost:5000/api/health/today'),
        axios.get('http://localhost:5000/api/health/weekly'),
        axios.get('http://localhost:5000/api/health/insights'),
        axios.get('http://localhost:5000/api/health/analytics?days=28')
      ]);

      setTodayLog(todayRes.data);
      setWeeklyLogs(weeklyRes.data);
      setInsightsData(insightsRes.data);
      setVibeLogs(vibeRes.data);
      
      // Also sync chart data
      await fetchChartData();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    fetchChartData();
  }, [chartDays, token]);

  useEffect(() => {
    let interval;
    if (quickBreathActive) {
      interval = setInterval(() => {
        setQuickBreathTimer(prev => {
          if (prev <= 1) {
            setQuickBreathActive(false);
            handleQuickBoost('meditated', true, true);
            handleAuraStudioQuestComplete();
            return 60;
          }
          const elapsed = 60 - prev + 1;
          const cycle = elapsed % 12;
          if (cycle >= 1 && cycle <= 4) {
            setQuickBreathPhase('Inhale 💨');
          } else if (cycle >= 5 && cycle <= 8) {
            setQuickBreathPhase('Hold 🧘');
          } else {
            setQuickBreathPhase('Exhale 🍃');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setQuickBreathTimer(60);
      setQuickBreathPhase('Inhale');
    }
    return () => clearInterval(interval);
  }, [quickBreathActive]);

  const handleQuickBoost = async (field, value, isHabit = false) => {
    if (!token) {
      alert("Please sign up or log in to track your daily health logs!");
      navigate('/login');
      return;
    }
    
    try {
      const existingLog = todayLog && !todayLog.message ? todayLog : {
        energyScore: 60,
        mood: 'good',
        sleepHours: 7,
        waterIntake: 0,
        steps: 0,
        habits: { meditated: false, walked: false, ateHealthy: false },
        notes: 'Quick logged vibe!'
      };

      const updatedPayload = { ...existingLog };
      
      if (isHabit) {
        updatedPayload.habits = {
          ...(existingLog.habits || {}),
          [field]: value
        };
      } else {
        updatedPayload[field] = (existingLog[field] || 0) + value;
      }

      const energyIncrement = isHabit ? 4 : field === 'waterIntake' ? 3 : 5;
      updatedPayload.energyScore = Math.min((existingLog.energyScore || 60) + energyIncrement, 100);

      const res = await axios.post('http://localhost:5000/api/health/log', {
        ...updatedPayload,
        date: existingLog.date || new Date().toISOString()
      });

      setTodayLog(res.data);
      
      await Promise.all([
        fetchChartData(),
        axios.get('http://localhost:5000/api/health/weekly').then(r => setWeeklyLogs(r.data)),
        axios.get('http://localhost:5000/api/health/insights').then(r => setInsightsData(r.data))
      ]);
    } catch (err) {
      console.error('Error in Quick Boost:', err);
    }
  };

  // walking simulator interval
  useEffect(() => {
    let interval;
    if (isSimulatingWalk) {
      interval = setInterval(() => {
        setTodayLog(prev => {
          if (!prev || prev.message) {
            return {
              energyScore: 60,
              mood: 'good',
              sleepHours: 7,
              waterIntake: 0,
              steps: 1,
              habits: { meditated: false, walked: true, ateHealthy: false },
              notes: 'Simulating walk!'
            };
          }
          return {
            ...prev,
            steps: (prev.steps || 0) + 1,
            habits: {
              ...(prev.habits || {}),
              walked: true
            }
          };
        });
        setSessionSteps(prev => prev + 1);
      }, 700); // 700ms is standard walking cadence
    }
    return () => clearInterval(interval);
  }, [isSimulatingWalk]);

  // Sync simulated steps to database every 15 seconds
  useEffect(() => {
    let syncInterval;
    if (isSimulatingWalk) {
      syncInterval = setInterval(() => {
        syncSimulatedSteps();
      }, 15000);
    }
    return () => clearInterval(syncInterval);
  }, [isSimulatingWalk, todayLog]);

  const syncSimulatedSteps = async () => {
    if (!token || !todayLog || todayLog.message) return;
    try {
      await axios.post('http://localhost:5000/api/health/log', {
        ...todayLog,
        date: todayLog.date || new Date().toISOString()
      });
      fetchChartData();
    } catch (err) {
      console.error('Error syncing simulated steps:', err);
    }
  };

  const toggleWalkSimulation = () => {
    if (!token) {
      alert("Please sign up or log in to simulate walks!");
      navigate('/login');
      return;
    }
    
    if (isSimulatingWalk) {
      setIsSimulatingWalk(false);
      // Final sync on stop
      setTimeout(() => {
        syncSimulatedSteps();
      }, 100);
    } else {
      setSessionSteps(0);
      setIsSimulatingWalk(true);
    }
  };

  // Gratitude canvas animation loop
  useEffect(() => {
    const canvas = document.getElementById('gratitudeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    let animFrame;
    
    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      gratitudeBubbles.forEach((b) => {
        b.y += b.vy;
        b.x += b.vx;
        
        if (b.x - b.radius < 0 || b.x + b.radius > rect.width) {
          b.vx *= -1;
        }
        if (b.y + b.radius < 0) {
          b.y = rect.height + b.radius;
        }
        
        const grad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(0.2, b.color + '55');
        grad.addColorStop(0.8, b.color + '15');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius - 1, 0, Math.PI * 2);
        ctx.strokeStyle = b.color + '77';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      
      animFrame = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animFrame);
  }, [gratitudeBubbles]);

  const handleGratitudeCanvasClick = (e) => {
    const canvas = document.getElementById('gratitudeCanvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    let poppedIndex = -1;
    for (let i = 0; i < gratitudeBubbles.length; i++) {
      const b = gratitudeBubbles[i];
      const dist = Math.sqrt((clickX - b.x) ** 2 + (clickY - b.y) ** 2);
      if (dist < b.radius) {
        poppedIndex = i;
        break;
      }
    }
    
    if (poppedIndex !== -1) {
      const popped = gratitudeBubbles[poppedIndex];
      setShowGratitudeText(popped.text);
      setGratitudeBubbles(prev => prev.filter((_, idx) => idx !== poppedIndex));
      setTimeout(() => setShowGratitudeText(null), 3500);
    }
  };

  const handleLaunchGratitude = async () => {
    if (!gratitudeText.trim()) return;
    
    const colors = ['#3B82F6', '#10B981', '#14B8A6', '#8B5CF6', '#F59E0B', '#EF4444'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newBubble = {
      x: 30 + Math.random() * 150,
      y: 120,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -0.3 - Math.random() * 0.3,
      radius: 20 + Math.random() * 10,
      text: gratitudeText,
      color: randomColor
    };
    
    setGratitudeBubbles(prev => [...prev, newBubble]);
    setGratitudeText('');
    
    if (token) {
      try {
        const existingLog = todayLog && !todayLog.message ? todayLog : {
          energyScore: 60,
          mood: 'good',
          sleepHours: 7,
          waterIntake: 0,
          steps: 0,
          habits: { meditated: false, walked: false, ateHealthy: false },
          notes: ''
        };
        const updatedNotes = existingLog.notes 
          ? `${existingLog.notes} | Gratitude: ${gratitudeText}`
          : `Gratitude: ${gratitudeText}`;
          
        const res = await axios.post('http://localhost:5000/api/health/log', {
          ...existingLog,
          notes: updatedNotes.substring(0, 500),
          date: existingLog.date || new Date().toISOString()
        });
        setTodayLog(res.data);
      } catch (err) {
        console.error('Error saving gratitude:', err);
      }
    }
  };

  const handleLogClick = () => {
    if (!token) {
      alert("Please sign up or log in to track your daily health logs!");
      navigate('/login');
      return;
    }
    setIsLogOpen(true);
  };

  const handleCoachClick = () => {
    if (!token) {
      alert("Please sign up or log in to talk to the AI Coach!");
      navigate('/login');
      return;
    }
    setIsCoachOpen(true);
  };

  const handleSettingsClick = () => {
    if (!token) {
      alert("Please sign up or log in to edit preferences!");
      navigate('/login');
      return;
    }
    setIsSettingsOpen(true);
  };

  const handlePDFClick = () => {
    if (!token) {
      alert("Please sign up or log in to download your health report!");
      navigate('/login');
      return;
    }
    generateWeeklyPDF(weeklyLogs, user);
  };

  // Mood to emoji/score mapping
  const moodMap = {
    great: { emoji: '😃', score: 100, color: 'text-emerald-500 bg-emerald-500/10' },
    good: { emoji: '🙂', score: 80, color: 'text-teal-500 bg-teal-500/10' },
    okay: { emoji: '😐', score: 60, color: 'text-blue-500 bg-blue-500/10' },
    low: { emoji: '🙁', score: 30, color: 'text-orange-500 bg-orange-500/10' },
    exhausted: { emoji: '😩', score: 10, color: 'text-red-500 bg-red-500/10' }
  };

  // Calculate Aura Score
  const getAuraScore = (log) => {
    if (!log || log.message) return 0;
    
    const sleepGoal = user?.preferences?.sleepGoal || 8;
    const stepsGoal = user?.preferences?.stepsGoal || 10000;
    const waterGoal = user?.preferences?.waterGoal || 2500;
    
    // Weights: Sleep (30%), Mood (25%), Steps (25%), Water (20%)
    const sleepScore = Math.min(((log.sleepHours || 0) / sleepGoal) * 100, 100);
    
    const moodInfo = moodMap[log.mood] || { score: 50 };
    const moodScore = moodInfo.score;
    
    const stepsScore = Math.min(((log.steps || 0) / stepsGoal) * 100, 100);
    const waterScore = Math.min(((log.waterIntake || 0) / waterGoal) * 100, 100);
    
    const score = (sleepScore * 0.3) + (moodScore * 0.25) + (stepsScore * 0.25) + (waterScore * 0.2);
    return Math.round(score);
  };

  const currentAuraScore = getAuraScore(todayLog);

  // Calculate badges count for XP calculation
  const getUnlockedBadgesCount = () => {
    if (!Array.isArray(weeklyLogs) || weeklyLogs.length === 0) return 0;
    
    const waterGoal = user?.preferences?.waterGoal || 2500;
    const sleepGoal = user?.preferences?.sleepGoal || 8;
    const stepsGoal = user?.preferences?.stepsGoal || 10000;

    const getAuraScoreLocal = (log) => {
      if (!log || log.message) return 0;
      const sleepScore = Math.min(((log.sleepHours || 0) / sleepGoal) * 100, 100);
      const moodMapping = { great: 100, good: 80, okay: 60, low: 30, exhausted: 10 };
      const moodScore = moodMapping[log.mood] || 50;
      const stepsScore = Math.min(((log.steps || 0) / stepsGoal) * 100, 100);
      const waterScore = Math.min(((log.waterIntake || 0) / waterGoal) * 100, 100);
      return Math.round((sleepScore * 0.3) + (moodScore * 0.25) + (stepsScore * 0.25) + (waterScore * 0.2));
    };

    const waterDays = weeklyLogs.filter(log => log && !log.message && (log.waterIntake || 0) >= waterGoal).length;
    const hasWaterBadge = waterDays >= 3;

    const sleepDays = weeklyLogs.filter(log => log && !log.message && (log.sleepHours || 0) >= sleepGoal).length;
    const hasSleepBadge = sleepDays >= 3;

    const meditationDays = weeklyLogs.filter(log => log && !log.message && log.habits?.meditated).length;
    const hasMeditationBadge = meditationDays >= 2;

    const hasAuraBadge = weeklyLogs.some(log => log && !log.message && getAuraScoreLocal(log) >= 90);

    const calculateStreak = () => {
      const validLogs = weeklyLogs.filter(log => log && !log.message);
      if (validLogs.length === 0) return 0;
      const sorted = [...validLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
      let currentStreak = 1;
      let maxStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1].date);
        const currDate = new Date(sorted[i].date);
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      return maxStreak;
    };
    const streak = calculateStreak();
    const hasStreakBadge = streak >= 3;

    let count = 0;
    if (hasStreakBadge) count++;
    if (hasWaterBadge) count++;
    if (hasSleepBadge) count++;
    if (hasMeditationBadge) count++;
    if (hasAuraBadge) count++;
    return count;
  };

  const validVibeLogs = Array.isArray(vibeLogs) ? vibeLogs.filter(log => log && !log.message) : [];
  const vibeLogsLength = validVibeLogs.length;
  const unlockedBadgesCount = getUnlockedBadgesCount();
  const totalXP = (vibeLogsLength * 100) + (unlockedBadgesCount * 200) + questXP;
  const userLevel = Math.floor(totalXP / 500) + 1;
  const progressXP = totalXP % 500;

  // Format Recharts data (dynamic days)
  const chartData = [...chartLogs]
    .reverse()
    .map(log => {
      const dateObj = new Date(log.date);
      const label = chartDays <= 7
        ? dateObj.toLocaleDateString('en-US', { weekday: 'short' })
        : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: label,
        'Aura Score': getAuraScore(log),
        'Sleep (Hrs)': log.sleepHours || 0,
        'Water (L)': (log.waterIntake || 0) / 1000,
        'Steps': log.steps || 0
      };
    });

  if (loading && weeklyLogs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="w-16 h-16 glow-orb mb-4 flex items-center justify-center animate-spin">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Powering up your dashboard...</p>
      </div>
    );
  }

  // Aura Score radial visual configuration
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentAuraScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-green-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 glow-orb flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">Aura Health</h1>
            {token ? (
              <div className="mt-1 flex flex-col gap-1 w-48 sm:w-60">
                <p className="text-[11px] text-gray-500 font-bold">Welcome back, {user?.name || 'Aura User'}</p>
                {/* Level / XP Progress Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-400">
                    <span className="text-emerald-500 font-black flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500/10 animate-pulse" />
                      Lvl {userLevel}
                    </span>
                    <span>{progressXP} / 500 XP</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner relative">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      style={{ width: `${(progressXP / 500) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Discover your glow (Guest Mode)</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Coach Action Button */}
          <button
            onClick={handleCoachClick}
            className="hidden sm:flex items-center gap-1.5 py-2 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Talk to AI Coach
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>

          {/* Preferences Settings Button */}
          {token && (
            <button
              onClick={handleSettingsClick}
              className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              title="Preferences"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* Logout or Sign In */}
          {token ? (
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-950/20 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="py-2 px-4 bg-emerald-500 hover:bg-emerald-655 text-white rounded-xl font-bold text-xs transition-all duration-200 transform hover:scale-[1.05]"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Aura Score Gauge & Quests */}
          <div className="space-y-6 flex flex-col justify-start">
            {/* Widget 1: Aura Score Gauge */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden group">
              <button 
                onClick={() => setActiveView('studio')}
                className="absolute top-4 left-4 text-[9px] font-black text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-0.5 transition-colors duration-200 z-10 animate-pulse"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Studio
              </button>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
              
              <h2 className="text-base font-extrabold text-gray-700 dark:text-gray-300">Daily Aura Score</h2>
              
              <div className="relative flex items-center justify-center my-6">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r={radius} className="text-gray-100 dark:text-gray-800" strokeWidth="10" stroke="currentColor" fill="transparent" />
                  <circle cx="72" cy="72" r={radius} className="text-emerald-500 transition-all duration-500 ease-out" strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-gray-900 dark:text-white leading-none">{currentAuraScore}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Glow Rating</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mb-4">
                {currentAuraScore > 75 
                  ? 'Your aura is glowing brilliantly today! Keep it up!'
                  : currentAuraScore > 40
                  ? 'Looking good! Hit your sleep or water targets to boost your vibe.'
                  : 'Your aura is dim. Log habits and refresh to rebuild energy.'}
              </p>

              <button
                onClick={handleLogClick}
                className="btn-primary py-2.5 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {todayLog && !todayLog.message ? 'Update Today\'s Log' : 'Log Today\'s Vibe'}
              </button>
            </div>

            {/* Quests Card */}
            {token && (
              <QuestsCard 
                todayLog={todayLog} 
                user={user} 
                completedQuests={completedQuests} 
                activeQuestId={activeQuestId}
                isAuraStudioQuestDone={isAuraStudioQuestDone}
                onAcceptQuest={(id) => {
                  setActiveQuestId(id);
                  localStorage.setItem('activeQuestId', id);
                }}
                onClaimReward={(quest) => {
                  const newXP = questXP + quest.reward;
                  setQuestXP(newXP);
                  localStorage.setItem('questXP', newXP);
                  
                  const nextCompleted = [...completedQuests, quest.id];
                  setCompletedQuests(nextCompleted);
                  localStorage.setItem('completedQuests', JSON.stringify(nextCompleted));
                  
                  setActiveQuestId(null);
                  localStorage.removeItem('activeQuestId');
                  
                  fetchData(); // sync dashboard state
                }}
              />
            )}
          </div>

          {/* Widget 2: Today's Metrics Breakdown */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-sm flex flex-col justify-start gap-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Daily Vital Stats</h2>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Today
              </span>
            </div>

            {/* Grid of stats */}
            {todayLog && !todayLog.message ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Mood */}
                <div className="p-4 bg-gray-50 dark:bg-gray-850/50 rounded-2xl flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Smile className="w-4 h-4 text-emerald-500" /> Mood
                  </span>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-2xl">{moodMap[todayLog.mood]?.emoji || '😐'}</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white capitalize">{todayLog.mood}</span>
                  </div>
                </div>

                {/* Sleep */}
                <div className="p-4 bg-gray-50 dark:bg-gray-850/50 rounded-2xl flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-emerald-500" /> Sleep
                  </span>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{todayLog.sleepHours}</span>
                    <span className="text-xs text-gray-500">/ {user?.preferences?.sleepGoal || 8} hrs</span>
                  </div>
                </div>

                {/* Water */}
                <div className="p-4 bg-gray-50 dark:bg-gray-850/50 rounded-2xl flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-emerald-500" /> Hydration
                  </span>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{todayLog.waterIntake}</span>
                    <span className="text-xs text-gray-500">ml / {user?.preferences?.waterGoal || 2500}ml</span>
                  </div>
                </div>

                {/* Steps */}
                <div className="p-4 bg-gray-50 dark:bg-gray-850/50 rounded-2xl flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-emerald-500" /> Movement
                  </span>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{todayLog.steps}</span>
                    <span className="text-xs text-gray-500">/ {user?.preferences?.stepsGoal || 10000} steps</span>
                  </div>
                </div>

                {/* Energy */}
                <div className="p-4 bg-gray-50 dark:bg-gray-850/50 rounded-2xl flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500" /> Energy
                  </span>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{todayLog.energyScore}%</span>
                  </div>
                </div>

                {/* Habits */}
                <div className="p-4 bg-gray-50 dark:bg-gray-850/50 rounded-2xl flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-emerald-500" /> Habits
                  </span>
                  <div className="mt-2.5 flex gap-1 flex-wrap">
                    {todayLog.habits?.meditated && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 rounded flex items-center gap-0.5">
                        <Brain className="w-2.5 h-2.5" /> Med
                      </span>
                    )}
                    {todayLog.habits?.walked && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-teal-500/10 text-teal-500 rounded flex items-center gap-0.5">
                        <Footprints className="w-2.5 h-2.5" /> Walk
                      </span>
                    )}
                    {todayLog.habits?.ateHealthy && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-yellow-500/10 text-yellow-500 rounded flex items-center gap-0.5">
                        <Apple className="w-2.5 h-2.5" /> Diet
                      </span>
                    )}
                    {!todayLog.habits?.meditated && !todayLog.habits?.walked && !todayLog.habits?.ateHealthy && (
                      <span className="text-xs text-gray-400">None completed</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-850/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center h-[260px]">
                <span className="text-3xl mb-2">🌿</span>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">No logs recorded today</h4>
                <p className="text-xs text-gray-500 max-w-[260px] mt-1 mb-4">Aura score depends on your hydration, steps, habits, and sleep</p>
                <button
                  onClick={handleLogClick}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all"
                >
                  Log Your First Vibe
                </button>
              </div>
            )}

            {/* Quick Aura Boosters Panel */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500/10 animate-pulse" />
                    ⚡ Quick Aura Boosters
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Increment your stats instantly to elevate your aura score & complete quests</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Quick Hydration */}
                <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/30 dark:border-blue-950/20 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 block uppercase">Hydration</span>
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300">
                        {todayLog && !todayLog.message ? `${todayLog.waterIntake || 0} ml` : '0 ml'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickBoost('waterIntake', 250)}
                    className="w-full py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-[9px] transition-all transform hover:scale-[1.03] shadow-sm active:scale-[0.98]"
                  >
                    +250ml Water 💧
                  </button>
                </div>

                {/* 2. Quick Movement */}
                <div className="p-3 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-950/20 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
                  <div className="flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Movement</span>
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300">
                        {todayLog && !todayLog.message ? `${(todayLog.steps || 0).toLocaleString()} steps` : '0 steps'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickBoost('steps', 1000)}
                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-[9px] transition-all transform hover:scale-[1.03] shadow-sm active:scale-[0.98]"
                  >
                    +1,000 Steps 👣
                  </button>
                </div>

                {/* 3. 1-Min Quick Breathing Meditation */}
                <div className="p-3 bg-purple-50/20 dark:bg-purple-950/10 border border-purple-100/30 dark:border-purple-950/20 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <div>
                      <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 block uppercase">Quick Zen</span>
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300">
                        {quickBreathActive ? `${quickBreathTimer}s remaining` : todayLog && todayLog.habits?.meditated ? 'Done today ✓' : 'Not meditated'}
                      </span>
                    </div>
                  </div>
                  {quickBreathActive ? (
                    <div className="w-full py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-[9px] font-black flex items-center justify-center gap-1 animate-pulse border border-purple-200/20">
                      <span>{quickBreathPhase}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQuickBreathActive(true)}
                      className="w-full py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-[9px] transition-all transform hover:scale-[1.03] shadow-sm active:scale-[0.98]"
                    >
                      Start 1m Breath 🧘
                    </button>
                  )}
                </div>

                {/* 4. Habit Quick Toggles */}
                <div className="p-3 bg-yellow-50/20 dark:bg-yellow-950/10 border border-yellow-100/30 dark:border-yellow-950/20 rounded-2xl flex flex-col justify-between gap-1">
                  <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 uppercase flex items-center gap-1.5">
                    <Apple className="w-3.5 h-3.5" /> Quick Habits
                  </span>
                  
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      onClick={() => handleQuickBoost('walked', todayLog && todayLog.habits ? !todayLog.habits.walked : true, true)}
                      className={`py-1 px-2 rounded-lg text-[9px] font-black border text-left flex justify-between items-center transition-all ${
                        todayLog && todayLog.habits?.walked
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold'
                          : 'bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-800 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span>Logged Walk 👣</span>
                      <span>{todayLog && todayLog.habits?.walked ? '✓' : '+'}</span>
                    </button>

                    <button
                      onClick={() => handleQuickBoost('ateHealthy', todayLog && todayLog.habits ? !todayLog.habits.ateHealthy : true, true)}
                      className={`py-1 px-2 rounded-lg text-[9px] font-black border text-left flex justify-between items-center transition-all ${
                        todayLog && todayLog.habits?.ateHealthy
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold'
                          : 'bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-800 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span>Healthy Diet 🥗</span>
                      <span>{todayLog && todayLog.habits?.ateHealthy ? '✓' : '+'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 🚶 Live Walk Simulator */}
            <style>{`
              @keyframes walkLegLeft {
                0% { transform: rotate(-28deg); }
                100% { transform: rotate(28deg); }
              }
              @keyframes walkLegRight {
                0% { transform: rotate(28deg); }
                100% { transform: rotate(-28deg); }
              }
              @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
              }
            `}</style>
            
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left Column: Animation Canvas Area */}
              <div className="md:col-span-2 relative bg-gray-950 dark:bg-gray-950 rounded-2xl border border-gray-800 p-6 overflow-hidden h-[240px] flex flex-col justify-between items-center">
                {/* Moving lines background to simulate forward progress */}
                <div className="absolute inset-0 flex flex-col justify-around opacity-10 pointer-events-none">
                  <div className={`h-0.5 bg-white w-full`} style={{ animation: isSimulatingWalk ? 'marquee 2s infinite linear' : 'none' }} />
                  <div className={`h-0.5 bg-white w-full`} style={{ animation: isSimulatingWalk ? 'marquee 1.5s infinite linear' : 'none', animationDelay: '0.4s' }} />
                  <div className={`h-0.5 bg-white w-full`} style={{ animation: isSimulatingWalk ? 'marquee 2.5s infinite linear' : 'none', animationDelay: '0.8s' }} />
                </div>

                <div className="absolute top-3 left-3 bg-black/55 text-[9px] font-bold text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Walk Simulator
                </div>

                {/* Animated walking avatar */}
                <div className="flex-1 flex flex-col items-center justify-center mt-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <Footprints className={`w-8 h-8 text-emerald-400 ${isSimulatingWalk ? 'animate-bounce' : ''}`} />
                  </div>
                  <div className="flex gap-4 mt-2">
                    {/* Left Leg */}
                    <div 
                      className="w-1.5 h-7 bg-emerald-500 rounded-full origin-top"
                      style={{ 
                        animation: isSimulatingWalk ? 'walkLegLeft 0.7s infinite alternate ease-in-out' : 'none',
                        transformOrigin: 'top center'
                      }}
                    />
                    {/* Right Leg */}
                    <div 
                      className="w-1.5 h-7 bg-emerald-450 rounded-full origin-top"
                      style={{ 
                        animation: isSimulatingWalk ? 'walkLegRight 0.7s infinite alternate ease-in-out' : 'none',
                        transformOrigin: 'top center'
                      }}
                    />
                  </div>
                </div>

                {/* Status text HUD */}
                <div className="text-[10px] text-gray-400 font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm z-10">
                  {isSimulatingWalk ? 'Walking session active... 🚶' : 'Simulator paused ⏸️'}
                </div>
              </div>
              
              {/* Right Column: Walk Stats & Action Toggles */}
              <div className="space-y-4 text-left">
                <div>
                  <h4 className="text-xs font-black text-gray-800 dark:text-white uppercase flex items-center gap-1.5">
                    🚶 Steps Pedometer HUD
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-relaxed">
                    Simulate dynamic step counts in real-time. Turn on the switch to naturally walk step-by-step and automatically fulfill daily step targets!
                  </p>
                </div>

                {/* Step Stats details grid */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>Active Session Steps</span>
                    <span className="text-emerald-500 font-extrabold">+{sessionSteps} steps</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>Estimated Distance</span>
                    <span className="text-teal-500 font-extrabold">{(sessionSteps * 0.00075).toFixed(3)} km</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>Est. Calories Burned</span>
                    <span className="text-purple-500 font-extrabold">{(sessionSteps * 0.04).toFixed(1)} kcal</span>
                  </div>
                </div>

                {/* Start/Stop simulation button */}
                <button
                  onClick={toggleWalkSimulation}
                  className={`w-full py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 transform hover:scale-[1.02] ${
                    isSimulatingWalk 
                      ? 'bg-red-500 hover:bg-red-650 text-white shadow-red-500/10' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/10'
                  }`}
                >
                  {isSimulatingWalk ? (
                    <>⏸️ Pause Walk Simulation</>
                  ) : (
                    <>▶️ Start Walk Simulator</>
                  )}
                </button>
              </div>
            </div>

            {/* ✨ Daily Gratitude Bubbles */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left Column: Canvas display area */}
              <div className="md:col-span-2 relative bg-gray-950 dark:bg-gray-950 rounded-2xl border border-gray-800 p-2 overflow-hidden h-[180px] flex items-center justify-center">
                <canvas 
                  id="gratitudeCanvas" 
                  onClick={handleGratitudeCanvasClick}
                  className="w-full h-full block cursor-pointer" 
                />
                
                {/* Floating message overlay if a bubble is popped */}
                {showGratitudeText && (
                  <div className="absolute inset-x-4 bottom-4 p-3 bg-white/10 dark:bg-black/45 border border-white/20 rounded-xl backdrop-blur-md shadow-lg text-center animate-slide-up z-20 pointer-events-none">
                    <p className="text-xs font-black text-white">✨ Today I am Grateful For:</p>
                    <p className="text-[11px] font-semibold text-emerald-350 dark:text-emerald-400 mt-1 italic">"{showGratitudeText}"</p>
                  </div>
                )}
                
                <div className="absolute top-2.5 left-3 bg-black/55 text-[8px] font-bold text-teal-400 px-2 py-0.5 rounded-full uppercase tracking-wider pointer-events-none select-none">
                  Gratitude Bubbles 🫧
                </div>
                <div className="absolute top-2.5 right-3 text-[8px] text-white/55 bg-black/45 px-2 py-0.5 rounded-full pointer-events-none select-none">
                  Tap bubble to reveal notes
                </div>
              </div>
              
              {/* Right Column: Input field & Action button */}
              <div className="space-y-3.5 text-left">
                <div>
                  <h4 className="text-xs font-black text-gray-800 dark:text-white uppercase flex items-center gap-1.5">
                    ✨ Gratitude Bubbles
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-relaxed">
                    Formulate a positive thought or gratitude, then click Launch. Watch it join your aura as a glowing floating bubble!
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Today I am grateful for..."
                    value={gratitudeText}
                    onChange={(e) => setGratitudeText(e.target.value)}
                    maxLength={100}
                    className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold"
                  />
                  <button
                    onClick={handleLaunchGratitude}
                    disabled={!gratitudeText.trim()}
                    className="w-full py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[10px] shadow-md shadow-blue-500/10 transition-all active:scale-95 transform hover:scale-[1.01]"
                  >
                    Launch Bubble 🫧
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Section: Insights Engine, Achievements & 7-Day Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Insights & Achievements */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* Insights Panel */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Aura Insights
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {insightsData.status === 'collecting' ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                      <span className="text-2xl block mb-1">⏳</span>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Correlation Engine Booting</p>
                      <p className="text-[10px] text-gray-500 mt-1">{insightsData.message}</p>
                    </div>
                  ) : (
                    insightsData.insights.map((insight, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 border rounded-2xl text-xs flex gap-2.5 items-start ${
                          insight.impact === 'positive'
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-800 dark:text-emerald-400'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-850 dark:border-gray-800 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        <span className="text-base flex-shrink-0">💡</span>
                        <p className="leading-relaxed font-semibold">{insight.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Mobile / Inline coach button */}
              <div className="pt-6 mt-6 border-t border-gray-50 dark:border-gray-850 sm:hidden">
                <button
                  onClick={handleCoachClick}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-colors shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  Talk to AI Coach
                </button>
              </div>
            </div>

            {/* Achievements Card */}
            <BadgesCard logs={weeklyLogs} user={user} />

            {/* Vibe Grid Card */}
            <VibeGrid logs={vibeLogs} />
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-6">
            {/* View Switcher Tabs */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-800 pb-3">
              <div className="flex gap-4 text-xs sm:text-sm font-extrabold text-gray-400">
                <button
                  onClick={() => setActiveView('chart')}
                  className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                    activeView === 'chart'
                      ? 'border-emerald-500 text-gray-900 dark:text-white'
                      : 'border-transparent hover:text-gray-650 dark:hover:text-gray-300'
                  }`}
                >
                  📊 Trend Chart
                </button>
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                    activeView === 'calendar'
                      ? 'border-emerald-500 text-gray-900 dark:text-white'
                      : 'border-transparent hover:text-gray-650 dark:hover:text-gray-350'
                  }`}
                >
                  📅 Wellness Calendar
                </button>
                <button
                  onClick={() => setActiveView('studio')}
                  className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                    activeView === 'studio'
                      ? 'border-emerald-500 text-gray-900 dark:text-white'
                      : 'border-transparent hover:text-gray-650 dark:hover:text-gray-350'
                  }`}
                >
                  🎨 Aura Art Studio
                </button>
              </div>
            </div>

            {activeView === 'chart' ? (
              <div className="animate-slide-up space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                        {chartDays}-Day Health Trend
                      </h3>
                      <p className="text-xs text-gray-400">Visualize your Aura Score, sleep, water, and step metrics</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {/* Range Toggle */}
                    <div className="flex bg-gray-50 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-150 dark:border-gray-705 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setChartDays(7)}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          chartDays === 7
                            ? 'bg-white dark:bg-gray-900 text-emerald-500 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        7D
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartDays(30)}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          chartDays === 30
                            ? 'bg-white dark:bg-gray-900 text-emerald-500 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        30D
                      </button>
                    </div>

                    {/* Download PDF button */}
                    {chartData.length > 0 && (
                      <button
                        onClick={handlePDFClick}
                        className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs transition-colors"
                      >
                        Download Report
                      </button>
                    )}
                  </div>
                </div>

                {chartData.length > 0 ? (
                  <div className="h-64 sm:h-72 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="auraGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1F2937' : '#F3F4F6'} />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                            borderColor: darkMode ? '#374151' : '#E5E7EB',
                            borderRadius: '16px',
                            fontSize: '11px',
                            color: darkMode ? '#FFFFFF' : '#111827'
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Area 
                          type="monotone" 
                          dataKey="Aura Score" 
                          stroke="#10B981" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#auraGrad)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 sm:h-72 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                    <span className="text-3xl mb-2">📊</span>
                    <p className="text-xs font-semibold text-gray-500">Not enough logging history to show trends</p>
                    <p className="text-[10px] text-gray-400 mt-1">Keep logging daily data to view trend graphs</p>
                  </div>
                )}
              </div>
            ) : activeView === 'calendar' ? (
              <div className="animate-slide-up">
                <InteractiveCalendar onLogChange={fetchData} user={user} token={token} />
              </div>
            ) : (
              <div className="animate-slide-up">
                <AuraStudio 
                  todayLog={todayLog} 
                  user={user} 
                  onQuestComplete={handleAuraStudioQuestComplete} 
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Slide-out Coach Drawer & Logging Modal */}
      <LogModal 
        isOpen={isLogOpen} 
        onClose={() => setIsLogOpen(false)} 
        onSave={(updatedLog) => {
          setTodayLog(updatedLog);
          fetchData(); // reload charts & insights
        }}
        todayLog={todayLog}
      />

      <CoachDrawer 
        isOpen={isCoachOpen} 
        onClose={() => setIsCoachOpen(false)} 
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
