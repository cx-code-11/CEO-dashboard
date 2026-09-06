import { useState } from 'react';
import api from '../../api/axios';

const UploadDocumentForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Policy',
    accessRoles: ['CEO', 'HR Manager', 'Finance Manager', 'Project Manager', 'Sales Executive', 'Employee']
  });
  const [file, setFile] = useState(null);

  const rolesList = ['CEO', 'HR Manager', 'Finance Manager', 'Project Manager', 'Sales Executive', 'Employee'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (role) => {
    setFormData(prev => {
      const current = prev.accessRoles;
      if (current.includes(role)) {
        return { ...prev, accessRoles: current.filter(r => r !== role) };
      } else {
        return { ...prev, accessRoles: [...current, role] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('accessRoles', formData.accessRoles.join(','));
      data.append('file', file);

      const res = await api.post('/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

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
      
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Document Title *</label>
          <input type="text" name="title" required value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Employee Handbook 2024" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
          <select name="category" required value={formData.category} onChange={handleChange} className="input-field">
            <option value="Policy">Policy</option>
            <option value="Contract">Contract</option>
            <option value="Invoice">Invoice</option>
            <option value="Identity">Identity</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select File *</label>
          <input 
            type="file" 
            required 
            onChange={(e) => setFile(e.target.files[0])} 
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400 border border-slate-200 dark:border-slate-700 rounded-md p-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Access Roles</label>
          <p className="text-xs text-slate-500 mb-2">Select which roles can view this document:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {rolesList.map(role => (
              <label key={role} className="flex items-center space-x-2 text-sm cursor-pointer p-2 border rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <input 
                  type="checkbox" 
                  checked={formData.accessRoles.includes(role)} 
                  onChange={() => handleRoleToggle(role)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-slate-700 dark:text-slate-300">{role}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </form>
  );
};

export default UploadDocumentForm;
