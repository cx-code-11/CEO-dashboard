import { useState } from 'react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const GeneratePayrollForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    month: dayjs().month() + 1,
    year: dayjs().year()
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/payroll/generate', formData);
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
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        This will generate payroll records for all active employees for the selected month and year based on their attendance and salary structures.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Month *</label>
          <select name="month" required value={formData.month} onChange={handleChange} className="input-field">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{dayjs().month(m - 1).format('MMMM')}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year *</label>
          <input type="number" name="year" required value={formData.year} onChange={handleChange} min="2020" max="2100" className="input-field" />
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Payroll'}
        </button>
      </div>
    </form>
  );
};

export default GeneratePayrollForm;
