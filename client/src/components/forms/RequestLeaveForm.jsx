import { useState } from 'react';
import api from '../../api/axios';

const RequestLeaveForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    leaveType: 'Sick',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/leaves', formData);
      if (res.data.success) {
        onSuccess(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm">{error}</div>}
      
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Leave Type *</label>
          <select name="leaveType" required value={formData.leaveType} onChange={handleChange} className="input-field">
            <option value="Sick">Sick Leave</option>
            <option value="Casual">Casual Leave</option>
            <option value="Annual">Annual Leave</option>
            <option value="Unpaid">Unpaid Leave</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date *</label>
            <input type="date" name="startDate" required value={formData.startDate} onChange={handleChange} className="input-field" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Date *</label>
            <input type="date" name="endDate" required value={formData.endDate} onChange={handleChange} className="input-field" />
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason *</label>
          <textarea name="reason" required value={formData.reason} onChange={handleChange} className="input-field min-h-[100px]" placeholder="Explain why you need this leave..."></textarea>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Request Leave'}
        </button>
      </div>
    </form>
  );
};

export default RequestLeaveForm;
