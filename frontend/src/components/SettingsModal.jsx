import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Settings, User, Trophy, Coffee, Droplets, Footprints, AlertCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, updateProfile, token } = useAuth();
  const [name, setName] = useState('');
  const [waterGoal, setWaterGoal] = useState(2500);
  const [stepsGoal, setStepsGoal] = useState(10000);
  const [sleepGoal, setSleepGoal] = useState(8);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setWaterGoal(user.preferences?.waterGoal ?? 2500);
      setStepsGoal(user.preferences?.stepsGoal ?? 10000);
      setSleepGoal(user.preferences?.sleepGoal ?? 8);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile(name, {
        waterGoal: Number(waterGoal),
        stepsGoal: Number(stepsGoal),
        sleepGoal: Number(sleepGoal),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Aura Preferences</h2>
              <p className="text-[10px] text-gray-500">Customize your daily health goals</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-660 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-bold text-center">
              ✓ Preferences updated successfully!
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" /> Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input text-sm py-2 px-3"
              placeholder="Your Name"
            />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 my-4 pt-3">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-500" /> Daily Goals
            </h3>
            
            <div className="space-y-3">
              {/* Sleep Goal */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-indigo-500" /> Sleep (hours)
                </label>
                <input
                  type="number"
                  required
                  min="4"
                  max="16"
                  step="0.5"
                  value={sleepGoal}
                  onChange={(e) => setSleepGoal(e.target.value)}
                  className="input text-sm py-1.5 px-2.5 max-w-[100px] text-right"
                />
              </div>

              {/* Water Goal */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Hydration (ml)
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  max="10000"
                  step="250"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(e.target.value)}
                  className="input text-sm py-1.5 px-2.5 max-w-[100px] text-right"
                />
              </div>

              {/* Steps Goal */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Footprints className="w-3.5 h-3.5 text-emerald-500" /> Movement (steps)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  max="50000"
                  step="500"
                  value={stepsGoal}
                  onChange={(e) => setStepsGoal(e.target.value)}
                  className="input text-sm py-1.5 px-2.5 max-w-[100px] text-right"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 text-xs"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-2 text-xs"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
