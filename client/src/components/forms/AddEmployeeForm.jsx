import { useState } from 'react';
import api from '../../api/axios';

const AddEmployeeForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // User fields
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Employee',
    department: '',
    
    // Employee fields
    designation: '',
    joiningDate: '',
    employmentType: 'Full-time',
    salary: ''
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
      // 1. Create User
      const userRes = await api.post('/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        department: formData.department
      });

      if (!userRes.data.success) {
        throw new Error(userRes.data.message || 'Failed to create user');
      }

      const userId = userRes.data.data._id;

      // 2. Create Employee Profile
      const empRes = await api.post('/employees', {
        userId,
        designation: formData.designation,
        department: formData.department,
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        salary: { basic: Number(formData.salary) }
      });

      if (empRes.data.success) {
        onSuccess(empRes.data.data);
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input-field" placeholder="John Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
          <input type="email" name="email" required value={formData.email} onChange={handleChange} className="input-field" placeholder="john@example.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password *</label>
          <input type="password" name="password" required value={formData.password} onChange={handleChange} className="input-field" placeholder="Temp password" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+91 9876543210" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role *</label>
          <select name="role" required value={formData.role} onChange={handleChange} className="input-field">
            <option value="Employee">Employee</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Finance Manager">Finance Manager</option>
            <option value="Sales Executive">Sales Executive</option>
            <option value="Project Manager">Project Manager</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department *</label>
          <input type="text" name="department" required value={formData.department} onChange={handleChange} className="input-field" placeholder="e.g. Engineering" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Designation *</label>
          <input type="text" name="designation" required value={formData.designation} onChange={handleChange} className="input-field" placeholder="e.g. Software Engineer" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Joining Date *</label>
          <input type="date" name="joiningDate" required value={formData.joiningDate} onChange={handleChange} className="input-field" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employment Type</label>
          <select name="employmentType" required value={formData.employmentType} onChange={handleChange} className="input-field">
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Salary (Monthly ₹) *</label>
          <input type="number" name="salary" required min="0" value={formData.salary} onChange={handleChange} className="input-field" placeholder="50000" />
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Employee'}
        </button>
      </div>
    </form>
  );
};

export default AddEmployeeForm;
