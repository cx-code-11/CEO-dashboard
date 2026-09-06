import { useState } from 'react';
import { Upload } from 'lucide-react';
import api from '../../api/axios';

const ImportStatementModal = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('file', file);

      const res = await api.post('/finance/import-statement', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        onSuccess(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm">{error}</div>}
      
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm">
        <p className="font-semibold mb-1">Supported Format:</p>
        <p>Upload a standard CSV file from your bank. Ensure it contains at least:</p>
        <ul className="list-disc ml-5 mt-1">
          <li><strong>Date</strong></li>
          <li><strong>Description / Particulars</strong></li>
          <li><strong>Amount & Type</strong> OR <strong>Credit / Debit</strong></li>
        </ul>
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Bank Statement (CSV) *</label>
        <input 
          type="file" 
          accept=".csv"
          required 
          onChange={(e) => setFile(e.target.files[0])} 
          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400 border border-slate-200 dark:border-slate-700 rounded-md p-2"
        />
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading || !file}>
          {loading ? 'Importing...' : 'Import Statement'}
        </button>
      </div>
    </form>
  );
};

export default ImportStatementModal;
