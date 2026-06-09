import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Smile, Star, Coffee, Footprints, Brain, Navigation, Apple, MessageSquare, AlertCircle } from 'lucide-react';

export default function LogModal({ isOpen, onClose, onSave, todayLog, logForDate, selectedDate }) {
  const [energyScore, setEnergyScore] = useState(50);
  const [mood, setMood] = useState('good');
  const [sleepHours, setSleepHours] = useState(7);
  const [waterIntake, setWaterIntake] = useState(0);
  const [steps, setSteps] = useState(0);
  const [habits, setHabits] = useState({
    meditated: false,
    walked: false,
    ateHealthy: false,
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const logToUse = logForDate || todayLog;

  // Load existing log if available
  useEffect(() => {
    if (logToUse && !logToUse.message) {
      setEnergyScore(logToUse.energyScore ?? 50);
      setMood(logToUse.mood ?? 'good');
      setSleepHours(logToUse.sleepHours ?? 7);
      setWaterIntake(logToUse.waterIntake ?? 0);
      setSteps(logToUse.steps ?? 0);
      setHabits({
        meditated: logToUse.habits?.meditated ?? false,
        walked: logToUse.habits?.walked ?? false,
        ateHealthy: logToUse.habits?.ateHealthy ?? false,
      });
      setNotes(logToUse.notes ?? '');
    } else {
      // Defaults
      setEnergyScore(50);
      setMood('good');
      setSleepHours(7);
      setWaterIntake(0);
      setSteps(0);
      setHabits({
        meditated: false,
        walked: false,
        ateHealthy: false,
      });
      setNotes('');
    }
  }, [logToUse, isOpen]);

  if (!isOpen) return null;

  const moods = [
    { value: 'great', emoji: '😃', label: 'Great' },
    { value: 'good', emoji: '🙂', label: 'Good' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'low', emoji: '🙁', label: 'Low' },
    { value: 'exhausted', emoji: '😩', label: 'Exhausted' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/health/log', {
        date: selectedDate ? selectedDate.toISOString() : undefined,
        energyScore: Number(energyScore),
        mood,
        sleepHours: Number(sleepHours),
        waterIntake: Number(waterIntake),
        steps: Number(steps),
        habits,
        notes
      });
      
      onSave(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit health log');
    } finally {
      setLoading(false);
    }
  };

  const handleHabitToggle = (habitKey) => {
    setHabits(prev => ({
      ...prev,
      [habitKey]: !prev[habitKey]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedDate 
                ? `Log Health Metrics - ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : 'Log Daily Health Metrics'}
            </h2>
            <p className="text-xs text-gray-500">Capture your habits and vital scores</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Mood Tracker */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
              <Smile className="w-4 h-4 text-emerald-500" />
              How were you feeling on this day?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {moods.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200 ${
                    mood === m.value
                      ? 'border-emerald-500 bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold scale-[1.03] ring-1 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span className="text-2xl mb-1">{m.emoji}</span>
                  <span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Score (0-100) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-500" />
                Energy Levels
              </label>
              <span className="text-sm font-bold text-emerald-500">{energyScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={energyScore}
              onChange={(e) => setEnergyScore(e.target.value)}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Depleted</span>
              <span>Average</span>
              <span>Fully Charged</span>
            </div>
          </div>

          {/* Sleep and Hydration Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sleep Hours */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-150 dark:border-gray-800/60 rounded-xl">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                <Coffee className="w-4 h-4 text-emerald-500" />
                Sleep Duration (hours)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="input py-1.5 px-3 max-w-[120px]"
                />
                <span className="text-xs text-gray-400">hours slept last night</span>
              </div>
            </div>

            {/* Water Intake */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-150 dark:border-gray-800/60 rounded-xl">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                <Footprints className="w-4 h-4 text-emerald-500" />
                Water Intake (ml)
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(e.target.value)}
                    className="input py-1.5 px-3 max-w-[120px]"
                  />
                  <span className="text-xs text-gray-400">milliliters consumed</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWaterIntake(prev => Number(prev) + 250)}
                    className="px-2 py-1 text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                  >
                    +250ml (Cup)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaterIntake(prev => Number(prev) + 500)}
                    className="px-2 py-1 text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                  >
                    +500ml (Bottle)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaterIntake(0)}
                    className="px-2 py-1 text-[10px] font-semibold bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Steps & Habits Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Steps Count */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-150 dark:border-gray-800/60 rounded-xl">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4 text-emerald-500" />
                Movement (Steps)
              </label>
              <input
                type="number"
                min="0"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="input py-1.5 px-3 max-w-[150px]"
                placeholder="e.g. 8000"
              />
              <span className="text-xs text-gray-400 block mt-1.5">Goal is 10,000 steps</span>
            </div>

            {/* Habits Checkboxes */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-150 dark:border-gray-800/60 rounded-xl space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-emerald-500" />
                Daily Habits
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleHabitToggle('meditated')}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all ${
                    habits.meditated
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  Meditated for 10+ mins
                </button>

                <button
                  type="button"
                  onClick={() => handleHabitToggle('walked')}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all ${
                    habits.walked
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  Walked / Exercised
                </button>

                <button
                  type="button"
                  onClick={() => handleHabitToggle('ateHealthy')}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all ${
                    habits.ateHealthy
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  Ate Healthy Meals
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Journal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[80px]"
              maxLength="500"
              placeholder="Write down any thoughts, goals, or symptoms..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-850">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2.5"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-2.5 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? 'Saving Logs...' : 'Save Health Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
