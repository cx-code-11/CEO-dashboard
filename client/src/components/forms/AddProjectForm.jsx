import { useState, useEffect } from 'react';
import api from '../../api/axios';

const AddProjectForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    startDate: '',
    deadline: '',
    budget: '',
    status: 'Planning',
    description: ''
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/clients?limit=100');
        if (res.data.success) {
          setClients(res.data.data);
          if (res.data.data.length > 0) {
            setFormData(prev => ({ ...prev, client: res.data.data[0]._id }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget) || 0
      };
      
      const res = await api.post('/projects', payload);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Name *</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input-field" placeholder="e.g. ERP Implementation" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Client *</label>
          <select name="client" required value={formData.client} onChange={handleChange} className="input-field">
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.companyName})</option>
            ))}
            {clients.length === 0 && <option value="" disabled>No clients found</option>}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date *</label>
          <input type="date" name="startDate" required value={formData.startDate} onChange={handleChange} className="input-field" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deadline *</label>
          <input type="date" name="deadline" required value={formData.deadline} onChange={handleChange} className="input-field" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Budget (₹) *</label>
          <input type="number" name="budget" required min="0" value={formData.budget} onChange={handleChange} className="input-field" placeholder="500000" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="input-field">
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description / Notes</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="input-field min-h-[80px]"></textarea>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading || clients.length === 0}>
          {loading ? 'Saving...' : 'Add Project'}
        </button>
      </div>
    </form>
  );
};

export default AddProjectForm;
