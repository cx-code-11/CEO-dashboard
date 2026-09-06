import { useState } from 'react';
import api from '../../api/axios';

const AddLeadForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    contactPerson: '',
    email: '',
    phone: '',
    estimatedValue: '',
    source: 'Website',
    priority: 'Medium',
    status: 'New'
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
      const payload = {
        ...formData,
        estimatedValue: Number(formData.estimatedValue) || 0
      };
      
      const res = await api.post('/leads', payload);
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lead Title *</label>
          <input type="text" name="title" required value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. ERP Implementation" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Name *</label>
          <input type="text" name="company" required value={formData.company} onChange={handleChange} className="input-field" placeholder="Acme Corp" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Person *</label>
          <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} className="input-field" placeholder="Jane Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="jane@example.com" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+1 234 567 8900" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Value ($) *</label>
          <input type="number" name="estimatedValue" required value={formData.estimatedValue} onChange={handleChange} min="0" className="input-field" placeholder="15000" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Source</label>
          <select name="source" value={formData.source} onChange={handleChange} className="input-field">
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Event">Event</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} className="input-field">
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline Stage</label>
          <select name="status" value={formData.status} onChange={handleChange} className="input-field">
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Add Lead'}
        </button>
      </div>
    </form>
  );
};

export default AddLeadForm;
