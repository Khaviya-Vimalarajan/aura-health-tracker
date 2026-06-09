import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronLeft, ChevronRight, Plus, Smile, Coffee, 
  Droplets, Footprints, Info, Calendar, Sparkles 
} from 'lucide-react';
import LogModal from './LogModal';

export default function InteractiveCalendar({ onLogChange, user, token }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyLogs, setMonthlyLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);

  // States for logging modals clicked from the calendar
  const [selectedCellDate, setSelectedCellDate] = useState(null);
  const [selectedCellLog, setSelectedCellLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const waterGoal = user?.preferences?.waterGoal || 2500;
  const sleepGoal = user?.preferences?.sleepGoal || 8;
  const stepsGoal = user?.preferences?.stepsGoal || 10000;

  const fetchMonthlyLogs = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/health/calendar?year=${year}&month=${month}`);
      setMonthlyLogs(res.data);
    } catch (err) {
      console.error('Error fetching calendar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyLogs();
  }, [year, month, token]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay(); // 0 = Sun, 6 = Sat

  const daysInMonth = getDaysInMonth(year, month);
  const startPadding = getFirstDayOfMonth(year, month);

  // Generate calendar grid items
  const calendarCells = [];
  
  // Previous month padding days
  for (let i = 0; i < startPadding; i++) {
    calendarCells.push({ isPadding: true });
  }

  // Active month days
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);

    const log = monthlyLogs.find(l => {
      const logDate = new Date(l.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === cellDate.getTime();
    });

    calendarCells.push({
      isPadding: false,
      day,
      date: cellDate,
      log
    });
  }

  // Mood to style mappings
  const moodStyles = {
    great: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    good: 'bg-teal-500/10 border-teal-200 dark:border-teal-900/50 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400',
    okay: 'bg-blue-500/10 border-blue-200 dark:border-blue-900/50 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400',
    low: 'bg-amber-500/10 border-amber-200 dark:border-amber-900/50 hover:bg-amber-500/20 text-amber-700 dark:text-amber-450',
    exhausted: 'bg-red-500/10 border-red-200 dark:border-red-900/50 hover:bg-red-500/20 text-red-700 dark:text-red-400',
    none: 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 hover:border-emerald-350 dark:hover:border-emerald-500/40 text-gray-400'
  };

  const moodEmojis = {
    great: '😃',
    good: '🙂',
    okay: '😐',
    low: '🙁',
    exhausted: '😩',
    none: ''
  };

  const handleCellClick = (cell) => {
    if (!token) return;
    setSelectedCellDate(cell.date);
    setSelectedCellLog(cell.log || null);
    setIsModalOpen(true);
  };

  const handleSaveLog = (updatedLog) => {
    // Refresh local calendar logs
    fetchMonthlyLogs();
    // Notify Dashboard parent to sync dashboard metrics & insights
    if (onLogChange) {
      onLogChange();
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
              📅 Wellness Calendar
            </h3>
            <p className="text-xs text-gray-400">Track habits and mood consistency across the month</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {loading && (
            <span className="text-[10px] text-gray-400 font-semibold animate-pulse">Syncing...</span>
          )}
          <div className="flex items-center bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 text-xs font-black text-gray-900 dark:text-white min-w-[100px] text-center uppercase tracking-wide">
              {monthNames[month]} {year}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2 border-b border-gray-50 dark:border-gray-800">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2.5">
        {calendarCells.map((cell, idx) => {
          if (cell.isPadding) {
            return (
              <div 
                key={idx} 
                className="aspect-square bg-gray-50/40 dark:bg-gray-950/20 border border-dashed border-gray-100 dark:border-gray-850/30 rounded-2xl opacity-40"
              />
            );
          }

          const hasLog = !!cell.log;
          const mood = hasLog ? cell.log.mood : 'none';

          return (
            <div
              key={idx}
              onClick={() => handleCellClick(cell)}
              onMouseEnter={() => hasLog && setHoveredDay(cell)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`aspect-square border rounded-2xl p-2 flex flex-col justify-between cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                moodStyles[mood]
              }`}
            >
              {/* Day Number */}
              <span className={`text-[10px] font-bold ${
                hasLog ? 'text-gray-850 dark:text-gray-100' : 'text-gray-400 dark:text-gray-650'
              }`}>
                {cell.day}
              </span>

              {/* Day Value Content */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {hasLog ? (
                  <span className="text-xl sm:text-2xl transform group-hover:scale-115 transition-transform duration-200">
                    {moodEmojis[mood]}
                  </span>
                ) : (
                  <Plus className="w-3.5 h-3.5 text-gray-305 dark:text-gray-700 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200 text-emerald-500" />
                )}
              </div>

              {/* Extra desktop stats with goal indicator colors */}
              {hasLog && (
                <div className="hidden sm:flex justify-between w-full text-[7px] font-black pt-1 border-t border-gray-500/10 gap-0.5">
                  <span 
                    className={`flex items-center gap-0.5 ${cell.log.sleepHours >= sleepGoal ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`} 
                    title={`Sleep: ${cell.log.sleepHours}h / ${sleepGoal}h`}
                  >
                    <Coffee className="w-2 h-2" />{cell.log.sleepHours}h
                  </span>
                  <span 
                    className={`flex items-center gap-0.5 ${cell.log.waterIntake >= waterGoal ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} 
                    title={`Water: ${cell.log.waterIntake}ml / ${waterGoal}ml`}
                  >
                    <Droplets className="w-2 h-2" />{(cell.log.waterIntake / 1000).toFixed(1)}L
                  </span>
                  <span 
                    className={`flex items-center gap-0.5 ${cell.log.steps >= stepsGoal ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} 
                    title={`Steps: ${cell.log.steps.toLocaleString()} / ${stepsGoal.toLocaleString()}`}
                  >
                    <Footprints className="w-2 h-2" />{(cell.log.steps / 1000).toFixed(0)}k
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dynamic Hover Tooltip / Detail Panel */}
      <div className="h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/80 rounded-2xl px-4 flex items-center justify-center text-center">
        {hoveredDay ? (
          <div className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-350 leading-relaxed">
            <span className="text-emerald-500 font-extrabold mr-1">
              {hoveredDay.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'short' })}:
            </span>
            Mood: <span className="capitalize text-gray-900 dark:text-white">{hoveredDay.log.mood}</span> | 
            Energy: <span className="text-gray-900 dark:text-white">{hoveredDay.log.energyScore}%</span> | 
            Sleep: <span className="text-gray-900 dark:text-white">{hoveredDay.log.sleepHours}h</span> | 
            Water: <span className="text-gray-900 dark:text-white">{hoveredDay.log.waterIntake}ml</span> | 
            Steps: <span className="text-gray-900 dark:text-white">{hoveredDay.log.steps.toLocaleString()}</span>
            {hoveredDay.log.notes && (
              <span className="text-gray-400 italic font-medium ml-1.5">
                - "{hoveredDay.log.notes.length > 30 ? hoveredDay.log.notes.substring(0, 30) + '...' : hoveredDay.log.notes}"
              </span>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Hover over logged calendar dates to inspect metrics. Click any date to log/edit details.</span>
          </div>
        )}
      </div>

      {/* Log modal for editing cells */}
      {isModalOpen && (
        <LogModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveLog}
          logForDate={selectedCellLog}
          selectedDate={selectedCellDate}
        />
      )}
    </div>
  );
}
