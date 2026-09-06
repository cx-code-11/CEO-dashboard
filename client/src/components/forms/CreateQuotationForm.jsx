import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';

const CreateQuotationForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  
  const [formData, setFormData] = useState({
    client: '',
    title: '',
    validUntil: '',
    items: [
      { description: '', quantity: 1, rate: 0, taxRate: 18, total: 0 }
    ],
    subtotal: 0,
    totalTax: 0,
    total: 0,
    terms: '50% advance, 50% on delivery'
  });

  useEffect(() => {
    // Fetch clients to populate dropdown
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

  useEffect(() => {
    // Calculate totals whenever items change
    let subtotal = 0;
    let totalTax = 0;
    
    formData.items.forEach(item => {
      const itemSubtotal = item.quantity * item.rate;
      const itemTax = itemSubtotal * (item.taxRate / 100);
      subtotal += itemSubtotal;
      totalTax += itemTax;
    });

    setFormData(prev => ({
      ...prev,
      subtotal,
      totalTax,
      total: subtotal + totalTax
    }));
  }, [formData.items]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = Number(value) || value;
    newItems[index].total = newItems[index].quantity * newItems[index].rate * (1 + newItems[index].taxRate / 100);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, taxRate: 18, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/quotations', formData);
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Client *</label>
          <select name="client" required value={formData.client} onChange={handleInputChange} className="input-field">
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.companyName})</option>
            ))}
            {clients.length === 0 && <option value="" disabled>No clients found - Add one first</option>}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quotation Title *</label>
          <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="input-field" placeholder="e.g. Website Development" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valid Until *</label>
          <input type="date" name="validUntil" required value={formData.validUntil} onChange={handleInputChange} className="input-field" />
        </div>
      </div>

      <div className="pt-4 mt-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-slate-800 dark:text-white">Line Items</h3>
          <button type="button" onClick={addItem} className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center">
            <Plus size={14} className="mr-1" /> Add Item
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="flex gap-2 items-start border p-3 rounded-lg border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
              <div className="flex-1 space-y-1">
                <input type="text" required placeholder="Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="input-field py-1.5" />
              </div>
              <div className="w-20 space-y-1">
                <input type="number" required min="1" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="input-field py-1.5" />
              </div>
              <div className="w-28 space-y-1">
                <input type="number" required min="0" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} className="input-field py-1.5" />
              </div>
              <div className="w-20 space-y-1">
                <input type="number" required min="0" max="100" placeholder="Tax%" value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)} className="input-field py-1.5" />
              </div>
              <div className="pt-1.5">
                <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" disabled={formData.items.length <= 1}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal:</span>
            <span>₹{formData.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>GST:</span>
            <span>₹{formData.totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-800 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Total:</span>
            <span>₹{formData.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Terms & Conditions</label>
        <textarea name="terms" value={formData.terms} onChange={handleInputChange} className="input-field min-h-[60px]"></textarea>
      </div>

      <div className="pt-4 flex justify-end gap-2 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading || clients.length === 0}>
          {loading ? 'Creating...' : 'Create Quotation'}
        </button>
      </div>
    </form>
  );
};

export default CreateQuotationForm;
