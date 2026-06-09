import { useState } from 'react';
import { Calendar, Info } from 'lucide-react';

export default function VibeGrid({ logs = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Generate date list for the last 28 days (4 weeks)
  const generatePast28Days = () => {
    const daysList = [];
    for (let i = 27; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      daysList.push(date);
    }
    return daysList;
  };

  const past28Days = generatePast28Days();

  // Mood color configurations
  const moodColors = {
    great: 'bg-emerald-500 hover:ring-2 hover:ring-emerald-400 dark:hover:ring-emerald-300',
    good: 'bg-teal-400 hover:ring-2 hover:ring-teal-300 dark:hover:ring-teal-200',
    okay: 'bg-blue-400 hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-200',
    low: 'bg-amber-400 hover:ring-2 hover:ring-amber-300 dark:hover:ring-amber-200',
    exhausted: 'bg-red-400 hover:ring-2 hover:ring-red-300 dark:hover:ring-red-200',
    none: 'bg-gray-100 dark:bg-gray-800 hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
  };

  const moodEmojis = {
    great: '😃',
    good: '🙂',
    okay: '😐',
    low: '🙁',
    exhausted: '😩',
    none: '⚪'
  };

  // Match logs to past 28 days list
  const gridData = past28Days.map(date => {
    const log = logs.find(l => {
      const logDate = new Date(l.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === date.getTime();
    });

    return {
      date,
      logExists: !!log,
      mood: log ? log.mood : 'none',
      sleepHours: log ? log.sleepHours : 0,
      waterIntake: log ? log.waterIntake : 0,
      steps: log ? log.steps : 0,
      energyScore: log ? log.energyScore : 0
    };
  });

  // Render weekday labels (Mon, Wed, Fri, Sun)
  const weekdaysShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-3xl shadow-sm space-y-4 relative">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-emerald-500" />
          Aura Vibe Grid (28D)
        </h3>
        <span className="text-[9px] text-gray-400 font-semibold flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-gray-400" /> Hover for details
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {/* The Grid container */}
        <div className="flex justify-center items-center py-2">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-2.5 w-full max-w-[280px]">
            {gridData.map((day, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-7 h-7 rounded-lg transition-all duration-200 cursor-pointer ${
                  moodColors[day.mood]
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Tooltip display */}
        <div className="h-11 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/40 rounded-xl p-2.5 flex items-center justify-center text-center">
          {hoveredDay ? (
            <div className="text-[10px] leading-relaxed font-semibold text-gray-700 dark:text-gray-300">
              <span className="text-gray-400">
                {hoveredDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}:
              </span>{' '}
              {hoveredDay.logExists ? (
                <>
                  Mood: {moodEmojis[hoveredDay.mood]} <span className="capitalize">{hoveredDay.mood}</span> | 
                  Sleep: {hoveredDay.sleepHours}h | Water: {hoveredDay.waterIntake}ml | Steps: {hoveredDay.steps.toLocaleString()}
                </>
              ) : (
                <span className="text-gray-400 font-medium">No record logged for this day</span>
              )}
            </div>
          ) : (
            <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
              <span>Hover over a block to view history</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 pt-1 border-t border-gray-50 dark:border-gray-800">
          <span>Exhausted</span>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-400"></span>
            <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
            <span className="w-2.5 h-2.5 rounded bg-blue-400"></span>
            <span className="w-2.5 h-2.5 rounded bg-teal-400"></span>
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
          </div>
          <span>Great</span>
        </div>
      </div>
    </div>
  );
}
