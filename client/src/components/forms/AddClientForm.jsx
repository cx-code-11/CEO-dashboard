import { useState } from 'react';
import api from '../../api/axios';

const AddClientForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    industry: 'Technology',
    address: '',
    source: 'Website'
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
      const res = await api.post('/clients', formData);
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Name *</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input-field" placeholder="John Smith" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Name *</label>
          <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className="input-field" placeholder="Acme Corp" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
          <input type="email" name="email" required value={formData.email} onChange={handleChange} className="input-field" placeholder="john@example.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+1 234 567 8900" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Industry</label>
          <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="input-field" placeholder="e.g. Technology" />
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
        
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Address</label>
          <textarea name="address" value={formData.address} onChange={handleChange} className="input-field min-h-[80px]" placeholder="123 Business Rd, City, Country"></textarea>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Add Client'}
        </button>
      </div>
    </form>
  );
};

export default AddClientForm;
