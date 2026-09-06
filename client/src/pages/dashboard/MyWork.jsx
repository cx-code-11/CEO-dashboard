import { useState, useEffect } from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

export default function MyWork() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReminder, setNewReminder] = useState('');

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
    if (e.key === 'Enter') {
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

  const activeReminders = reminders.filter(r => !r.isCompleted);
  const completedReminders = reminders.filter(r => r.isCompleted);

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-[#f5f5f7] p-8 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto space-y-3">
        
        {/* Loading State */}
        {loading && <div className="text-[#86868b] text-lg px-2">Loading...</div>}
        
        {/* Active Reminders */}
        {activeReminders.map(reminder => (
          <div key={reminder._id} className="flex items-center gap-4 group">
            <button 
              onClick={() => toggleCompleted(reminder._id, reminder.isCompleted)}
              className="mt-0.5 text-[#5c5c5e] hover:text-[#007aff] transition-colors flex-shrink-0"
            >
              <Circle size={26} strokeWidth={1.5} />
            </button>
            <div className="flex-1 text-[19px] tracking-wide py-1 text-[#f5f5f7]">
              {reminder.text}
            </div>
          </div>
        ))}

        {/* Input for new reminder */}
        <div className="flex items-center gap-4 pt-1">
          <div className="mt-0.5 text-[#5c5c5e] flex-shrink-0">
            <Circle size={26} strokeWidth={1.5} />
          </div>
          <input
            type="text"
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            onKeyDown={handleAddReminder}
            placeholder=" "
            className="flex-1 bg-transparent border-none outline-none text-[19px] tracking-wide py-1 text-[#f5f5f7] placeholder-[#5c5c5e] focus:ring-0 p-0"
          />
        </div>

        {/* Completed Reminders (show at bottom) */}
        {completedReminders.length > 0 && (
          <div className="pt-8 space-y-3">
            {completedReminders.map(reminder => (
              <div key={reminder._id} className="flex items-center gap-4 group opacity-50 hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => toggleCompleted(reminder._id, reminder.isCompleted)}
                  className="mt-0.5 text-[#007aff] flex-shrink-0"
                >
                  <CheckCircle2 size={26} strokeWidth={1.5} className="fill-[#007aff] text-[#1c1c1e]" />
                </button>
                <div className="flex-1 text-[19px] tracking-wide py-1 text-[#f5f5f7] line-through">
                  {reminder.text}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
