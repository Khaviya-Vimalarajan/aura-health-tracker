import { Trophy, Droplets, Coffee, Brain, Sparkles, Flame, CheckCircle2 } from 'lucide-react';

export default function BadgesCard({ logs, user }) {
  const waterGoal = user?.preferences?.waterGoal || 2500;
  const sleepGoal = user?.preferences?.sleepGoal || 8;
  const stepsGoal = user?.preferences?.stepsGoal || 10000;

  // Calculate Aura Score helper
  const getAuraScore = (log) => {
    if (!log) return 0;
    const sleepScore = Math.min(((log.sleepHours || 0) / sleepGoal) * 100, 100);
    
    const moodMapping = { great: 100, good: 80, okay: 60, low: 30, exhausted: 10 };
    const moodScore = moodMapping[log.mood] || 50;
    
    const stepsScore = Math.min(((log.steps || 0) / stepsGoal) * 100, 100);
    const waterScore = Math.min(((log.waterIntake || 0) / waterGoal) * 100, 100);
    
    return Math.round((sleepScore * 0.3) + (moodScore * 0.25) + (stepsScore * 0.25) + (waterScore * 0.2));
  };

  // 1. Hydration Master: Water logged >= waterGoal on 3+ days
  const waterDays = logs.filter(log => (log.waterIntake || 0) >= waterGoal).length;
  const hasWaterBadge = waterDays >= 3;

  // 2. Sleep Champ: Sleep logged >= sleepGoal on 3+ days
  const sleepDays = logs.filter(log => (log.sleepHours || 0) >= sleepGoal).length;
  const hasSleepBadge = sleepDays >= 3;

  // 3. Mindful Sage: Meditated habit checked 2+ times
  const meditationDays = logs.filter(log => log.habits?.meditated).length;
  const hasMeditationBadge = meditationDays >= 2;

  // 4. Aura Champion: Aura score >= 90 at least once
  const highAuraDay = logs.some(log => getAuraScore(log) >= 90);
  const hasAuraBadge = highAuraDay;

  // 5. Streak Starter: 3 consecutive days logged
  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    
    // Sort logs chronologically
    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
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

  const badges = [
    {
      id: 'streak',
      name: 'Streak Starter',
      description: 'Log health data 3 consecutive days',
      unlocked: hasStreakBadge,
      progress: `${Math.min(streak, 3)} / 3 days`,
      icon: <Flame className="w-5 h-5" />,
      color: 'from-orange-500 to-red-500 text-orange-500 bg-orange-500/10'
    },
    {
      id: 'hydration',
      name: 'Hydration Master',
      description: `Hit your water goal on 3 days`,
      unlocked: hasWaterBadge,
      progress: `${Math.min(waterDays, 3)} / 3 days`,
      icon: <Droplets className="w-5 h-5" />,
      color: 'from-blue-400 to-indigo-600 text-blue-500 bg-blue-500/10'
    },
    {
      id: 'sleep',
      name: 'Sleep Champ',
      description: `Hit your sleep goal on 3 days`,
      unlocked: hasSleepBadge,
      progress: `${Math.min(sleepDays, 3)} / 3 days`,
      icon: <Coffee className="w-5 h-5" />,
      color: 'from-indigo-500 to-purple-600 text-indigo-500 bg-indigo-500/10'
    },
    {
      id: 'meditation',
      name: 'Mindful Sage',
      description: 'Meditate at least 2 times',
      unlocked: hasMeditationBadge,
      progress: `${Math.min(meditationDays, 2)} / 2 times`,
      icon: <Brain className="w-5 h-5" />,
      color: 'from-pink-400 to-rose-600 text-pink-500 bg-pink-500/10'
    },
    {
      id: 'score',
      name: 'Aura Champion',
      description: 'Achieve an Aura Score of 90+',
      unlocked: hasAuraBadge,
      progress: hasAuraBadge ? '1 / 1 unlocked' : '0 / 1 score 90+',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-emerald-400 to-teal-600 text-emerald-500 bg-emerald-500/10'
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-5 rounded-3xl shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-4.5 h-4.5 text-emerald-500" />
          Aura Achievements
        </h3>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {unlockedCount} / {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
              badge.unlocked
                ? 'bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-850 dark:to-gray-900 border-gray-100 dark:border-gray-800 shadow-sm'
                : 'bg-gray-50/45 dark:bg-gray-900/40 border-dashed border-gray-200 dark:border-gray-800 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Badge Icon */}
              <div 
                className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                  badge.unlocked 
                    ? badge.color
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                }`}
              >
                {badge.icon}
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  {badge.name}
                  {badge.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">{badge.description}</p>
              </div>
            </div>

            {/* Progress Label */}
            <div className="text-right flex-shrink-0">
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                badge.unlocked
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-gray-200/50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {badge.progress}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
