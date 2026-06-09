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
  const [insightsData, setInsightsData] = useState({ status: 'collecting', insights: [] });
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const fetchData = async () => {
    if (!token) {
      setTodayLog(null);
      setWeeklyLogs([]);
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
      
      const [todayRes, weeklyRes, insightsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/health/today'),
        axios.get('http://localhost:5000/api/health/weekly'),
        axios.get('http://localhost:5000/api/health/insights')
      ]);

      setTodayLog(todayRes.data);
      setWeeklyLogs(weeklyRes.data);
      setInsightsData(insightsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

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

  // Format Recharts data (last 7 days)
  const chartData = [...weeklyLogs]
    .reverse()
    .map(log => {
      const dateObj = new Date(log.date);
      return {
        date: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
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
              <p className="text-xs text-gray-500">Welcome back, {user?.name || 'Aura User'}</p>
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
          {/* Widget 1: Aura Score Gauge */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden group">
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

          {/* Widget 2: Today's Metrics Breakdown */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
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
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-850/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center h-full">
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
          </div>
        </div>

        {/* Third Section: Insights Engine & 7-Day Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Insights Panel */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
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

          {/* Recharts Chart Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-sm">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-6">7-Day Health Trend</h3>

            {chartData.length > 0 ? (
              <div className="h-64 sm:h-72">
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
              <div className="h-64 sm:h-72 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-850/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                <span className="text-3xl mb-2">📊</span>
                <p className="text-xs font-semibold text-gray-500">Not enough logging history to show trends</p>
                <p className="text-[10px] text-gray-400 mt-1">Keep logging daily data to view trend graphs</p>
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
