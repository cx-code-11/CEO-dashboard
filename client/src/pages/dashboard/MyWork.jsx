import { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Plus, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

export default function MyWork() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReminder, setNewReminder] = useState('');
  
  // Quick fix: Add support for dragging in tasks/calendar events if requested later.
  // For now, this is strictly the Reminders feature.

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reminders');
      if (res.data.success) {
        setReminders(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.trim()) return;

    try {
      const res = await api.post('/reminders', { text: newReminder });
      if (res.data.success) {
        setReminders([res.data.data, ...reminders]);
        setNewReminder('');
      }
    } catch (error) {
      console.error('Failed to add reminder:', error);
    }
  };

  const toggleCompleted = async (id, currentStatus) => {
    try {
      // Optimistic update
      setReminders(reminders.map(r => r._id === id ? { ...r, isCompleted: !currentStatus } : r));
      
      await api.put(`/reminders/${id}`, { isCompleted: !currentStatus });
    } catch (error) {
      console.error('Failed to update reminder:', error);
      // Revert on error
      fetchReminders();
    }
  };

  const deleteReminder = async (id) => {
    try {
      setReminders(reminders.filter(r => r._id !== id));
      await api.delete(`/reminders/${id}`);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      fetchReminders();
    }
  };

  const activeReminders = reminders.filter(r => !r.isCompleted);
  const completedReminders = reminders.filter(r => r.isCompleted);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Target className="text-primary-500" size={32} />
          My Work
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
          What are you focusing on today?
        </p>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleAddReminder} className="relative shadow-sm group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Plus className="text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
        </div>
        <input
          type="text"
          value={newReminder}
          onChange={(e) => setNewReminder(e.target.value)}
          placeholder="Add a new reminder and press Enter..."
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-primary-500 focus:ring-0 rounded-xl text-slate-800 dark:text-white text-lg placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]"
        />
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Reminders List */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center justify-between">
                Active Focus
                <span className="px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">
                  {activeReminders.length}
                </span>
              </h2>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : activeReminders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center">
                  <CheckCircle2 size={48} className="mb-4 opacity-20" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                activeReminders.map(reminder => (
                  <div key={reminder._id} className="group flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <button 
                      onClick={() => toggleCompleted(reminder._id, reminder.isCompleted)}
                      className="mt-0.5 text-slate-300 hover:text-emerald-500 dark:text-slate-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Circle size={22} strokeWidth={2} />
                    </button>
                    <div className="flex-1">
                      <p className="text-slate-700 dark:text-slate-200 text-[15px] leading-snug">{reminder.text}</p>
                      <span className="text-xs text-slate-400 mt-2 block">
                        Added {dayjs(reminder.createdAt).fromNow()}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteReminder(reminder._id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Section */}
          {completedReminders.length > 0 && (
            <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700/50">
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Completed ({completedReminders.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {completedReminders.slice(0, 5).map(reminder => (
                  <div key={reminder._id} className="group flex items-center gap-4 p-4 opacity-60 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleCompleted(reminder._id, reminder.isCompleted)}
                      className="text-emerald-500"
                    >
                      <CheckCircle2 size={20} className="fill-emerald-50" />
                    </button>
                    <p className="flex-1 text-slate-500 line-through text-sm">{reminder.text}</p>
                    <button 
                      onClick={() => deleteReminder(reminder._id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel (For future expansion like Calendar / My Tasks) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-md">
            <div className="flex items-center gap-2 mb-4 opacity-90">
              <CalendarIcon size={18} />
              <span className="font-medium text-sm">Today's Date</span>
            </div>
            <div className="text-3xl font-bold mb-1">{dayjs().format('dddd')}</div>
            <div className="text-primary-100">{dayjs().format('MMMM D, YYYY')}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Clock size={18} className="text-amber-500" />
              Quick Tips
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                Use this space for rapid brain-dumps.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                Items here are private to you.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                For team collaboration, use the main Tasks board.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
