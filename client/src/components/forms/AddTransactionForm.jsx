import { useState } from 'react';
import api from '../../api/axios';

const AddTransactionForm = ({ type = 'Income', onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: type === 'Income' ? 'Sales' : 'Office Supplies',
    paymentMode: 'Bank Transfer',
    transactionId: '',
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
        amount: Number(formData.amount) || 0
      };
      
      const endpoint = type === 'Income' ? '/income' : '/expenses';
      
      const res = await api.post(endpoint, payload);
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
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title / Description *</label>
          <input type="text" name="title" required value={formData.title} onChange={handleChange} className="input-field" placeholder={`e.g. ${type === 'Income' ? 'Consulting Fee' : 'Internet Bill'}`} />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹) *</label>
          <input type="number" name="amount" required min="1" value={formData.amount} onChange={handleChange} className="input-field" placeholder="1000" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date *</label>
          <input type="date" name="date" required value={formData.date} onChange={handleChange} className="input-field" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
          {type === 'Income' ? (
            <select name="category" required value={formData.category} onChange={handleChange} className="input-field">
              <option value="Sales">Sales</option>
              <option value="Services">Services</option>
              <option value="Interest">Interest</option>
              <option value="Refund">Refund</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <select name="category" required value={formData.category} onChange={handleChange} className="input-field">
              <option value="Salary">Salary</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Marketing">Marketing</option>
              <option value="Software">Software</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Mode</label>
          <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="input-field">
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit Card">Credit Card</option>
          </select>
        </div>
        
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Transaction ID / Reference (Optional)</label>
          <input type="text" name="transactionId" value={formData.transactionId} onChange={handleChange} className="input-field" placeholder="TXN123456789" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes (Optional)</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field min-h-[60px]"></textarea>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className={type === 'Income' ? 'btn bg-green-500 hover:bg-green-600 text-white' : 'btn bg-red-500 hover:bg-red-600 text-white'} disabled={loading}>
          {loading ? 'Saving...' : `Record ${type}`}
        </button>
      </div>
    </form>
  );
};

export default AddTransactionForm;
