import { Trophy, CheckCircle, Target, Sparkles, Star } from 'lucide-react';

export default function QuestsCard({ todayLog, user, completedQuests = [], activeQuestId, isAuraStudioQuestDone, onAcceptQuest, onClaimReward }) {
  const waterGoal = user?.preferences?.waterGoal || 2500;
  const sleepGoal = user?.preferences?.sleepGoal || 8;
  const stepsGoal = user?.preferences?.stepsGoal || 10000;

  const quests = [
    {
      id: 'water_warrior',
      title: 'Water Warrior 💧',
      description: `Drink at least ${waterGoal}ml of water today`,
      reward: 150,
      evaluate: (log) => log && !log.message && (log.waterIntake || 0) >= waterGoal,
      getProgressText: (log) => {
        const val = log && !log.message ? log.waterIntake || 0 : 0;
        return `${val} / ${waterGoal} ml`;
      },
      getProgressPercent: (log) => {
        const val = log && !log.message ? log.waterIntake || 0 : 0;
        return Math.min((val / waterGoal) * 100, 100);
      }
    },
    {
      id: 'zen_master',
      title: 'Zen Master 🧘‍♀️',
      description: `Meditate and sleep at least ${sleepGoal} hours`,
      reward: 200,
      evaluate: (log) => log && !log.message && log.habits?.meditated && (log.sleepHours || 0) >= sleepGoal,
      getProgressText: (log) => {
        const hasMed = log && !log.message && log.habits?.meditated;
        const hasSleep = log && !log.message && (log.sleepHours || 0) >= sleepGoal;
        return `${hasMed ? '🧘' : '❌'} Meditated | ${hasSleep ? '😴' : '❌'} ${log?.sleepHours || 0}/${sleepGoal}h sleep`;
      },
      getProgressPercent: (log) => {
        const hasMed = log && !log.message && log.habits?.meditated;
        const hasSleep = log && !log.message && (log.sleepHours || 0) >= sleepGoal;
        let count = 0;
        if (hasMed) count += 50;
        if (hasSleep) count += 50;
        return count;
      }
    },
    {
      id: 'active_explorer',
      title: 'Active Explorer 👣',
      description: `Log at least ${stepsGoal} steps today`,
      reward: 150,
      evaluate: (log) => log && !log.message && (log.steps || 0) >= stepsGoal,
      getProgressText: (log) => {
        const val = log && !log.message ? log.steps || 0 : 0;
        return `${val.toLocaleString()} / ${stepsGoal.toLocaleString()} steps`;
      },
      getProgressPercent: (log) => {
        const val = log && !log.message ? log.steps || 0 : 0;
        return Math.min((val / stepsGoal) * 100, 100);
      }
    },
    {
      id: 'diet_champion',
      title: 'Diet Champion 🥗',
      description: 'Eat healthy meals today',
      reward: 100,
      evaluate: (log) => log && !log.message && !!log.habits?.ateHealthy,
      getProgressText: (log) => {
        const val = log && !log.message && log.habits?.ateHealthy;
        return val ? 'Meals logged 🥗' : 'Not logged yet';
      },
      getProgressPercent: (log) => {
        const val = log && !log.message && log.habits?.ateHealthy;
        return val ? 100 : 0;
      }
    },
    {
      id: 'aura_alchemist',
      title: 'Aura Alchemist 🎨',
      description: 'Meditate for 1 min or export your daily Aura Vibe Card',
      reward: 150,
      evaluate: () => !!isAuraStudioQuestDone,
      getProgressText: () => isAuraStudioQuestDone ? 'Activity Completed 🎨' : 'Visit Aura Studio to begin',
      getProgressPercent: () => isAuraStudioQuestDone ? 100 : 0
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-3xl shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500/10" />
          Daily Wellness Quests
        </h3>
        <span className="text-[9px] text-gray-400 font-bold bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Target className="w-3 h-3 text-emerald-500" /> 1 active max
        </span>
      </div>

      <div className="space-y-3">
        {quests.map((quest) => {
          const isCompleted = completedQuests.includes(quest.id);
          const isActive = activeQuestId === quest.id;
          const isRequirementsMet = quest.evaluate(todayLog);
          const progressPercent = quest.getProgressPercent(todayLog);
          const progressText = quest.getProgressText(todayLog);

          // Card borders and backgrounds
          let cardStyle = 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900';
          if (isCompleted) {
            cardStyle = 'border-emerald-250 bg-emerald-50/10 dark:border-emerald-900/30 dark:bg-emerald-950/5 opacity-80';
          } else if (isActive) {
            cardStyle = 'border-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/10 ring-1 ring-emerald-500/25 shadow-md shadow-emerald-500/5';
          } else if (activeQuestId) {
            // Another quest is active
            cardStyle = 'border-gray-100 dark:border-gray-850 bg-white dark:bg-gray-900 opacity-50';
          }

          return (
            <div 
              key={quest.id} 
              className={`p-3.5 border rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col gap-2.5 ${cardStyle}`}
            >
              {/* Header Info */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                    {quest.title}
                    {isCompleted && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                    )}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-relaxed">
                    {quest.description}
                  </p>
                </div>
                <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-500/25 px-2 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
                  <Star className="w-2.5 h-2.5 fill-current" /> +{quest.reward} XP
                </span>
              </div>

              {/* Progress Bar (Only show if active or completed) */}
              {(isActive || isCompleted) && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[8px] font-bold text-gray-400">
                    <span>Progress</span>
                    <span>{progressText}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-1">
                {isCompleted ? (
                  <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    Quest Cleared ✓
                  </span>
                ) : isActive ? (
                  isRequirementsMet ? (
                    <button
                      onClick={() => onClaimReward(quest)}
                      className="px-2.5 py-1 text-[9px] font-black text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg flex items-center gap-1 shadow-md shadow-yellow-500/10 animate-pulse"
                    >
                      <Sparkles className="w-3 h-3" /> Claim Reward!
                    </button>
                  ) : (
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                      Quest In Progress...
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => onAcceptQuest(quest.id)}
                    disabled={!!activeQuestId}
                    className={`px-2.5 py-1 text-[9px] font-black rounded-lg transition-all ${
                      activeQuestId
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:scale-[1.03]'
                    }`}
                  >
                    Accept Quest
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
