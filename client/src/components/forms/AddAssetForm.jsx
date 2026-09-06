import { useState } from 'react';
import api from '../../api/axios';

const AddAssetForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    assetTag: '',
    serialNo: '',
    type: 'Hardware',
    purchaseDate: '',
    purchaseCost: '',
    warrantyExpiry: '',
    vendor: '',
    status: 'Available',
    notes: ''
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
        purchaseCost: Number(formData.purchaseCost) || 0
      };
      
      const res = await api.post('/assets', payload);
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Asset Name *</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input-field" placeholder="MacBook Pro M2" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="input-field">
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Furniture">Furniture</option>
            <option value="Vehicle">Vehicle</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Asset Tag *</label>
          <input type="text" name="assetTag" required value={formData.assetTag} onChange={handleChange} className="input-field" placeholder="AST-001" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Serial Number</label>
          <input type="text" name="serialNo" value={formData.serialNo} onChange={handleChange} className="input-field" placeholder="SN123456789" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Date</label>
          <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="input-field" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Cost (₹)</label>
          <input type="number" name="purchaseCost" min="0" value={formData.purchaseCost} onChange={handleChange} className="input-field" placeholder="100000" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Warranty Expiry</label>
          <input type="date" name="warrantyExpiry" value={formData.warrantyExpiry} onChange={handleChange} className="input-field" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vendor</label>
          <input type="text" name="vendor" value={formData.vendor} onChange={handleChange} className="input-field" placeholder="Apple Store" />
        </div>
        
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="input-field">
            <option value="Available">Available</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
            <option value="Lost/Stolen">Lost/Stolen</option>
          </select>
        </div>
        
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes / Details</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field min-h-[60px]"></textarea>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Add Asset'}
        </button>
      </div>
    </form>
  );
};

export default AddAssetForm;
