import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Download, CheckCircle, FileCheck } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import CreateQuotationForm from '../../components/forms/CreateQuotationForm';

const Quotations = () => {
  const [quotations, setQuotations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/quotations');
      if (res.data.success) {
        setQuotations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch quotations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/quotations?search=${searchTerm}`);
      if (res.data.success) setQuotations(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsAccepted = async (id) => {
    try {
      await api.put(`/quotations/${id}/status`, { status: 'Accepted' });
      fetchQuotations();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <FileText className="mr-2 text-primary-500" /> Quotations
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and generate quotes for leads and clients.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Plus size={18} className="mr-2" /> Create Quotation
        </button>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search quotes by ID or Client..." 
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-3 font-medium">Quote ID</th>
                <th className="p-3 font-medium">Client / Lead</th>
                <th className="p-3 font-medium">Issue Date</th>
                <th className="p-3 font-medium text-right">Total Value</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="p-4 text-center text-slate-500">Loading quotations...</td></tr>
              ) : !quotations || quotations.length === 0 ? (
                <tr><td colSpan="6" className="p-4 text-center text-slate-500">No quotations found.</td></tr>
              ) : (
                quotations.map((quote) => (
                  <tr key={quote._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {quote.quoteNo}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {quote.client?.companyName || quote.client?.name || quote.lead?.companyName || 'Unknown'}
                      </p>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {dayjs(quote.issueDate).format('MMM D, YYYY')}
                    </td>
                    <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-200 text-right">
                      ₹{quote.total?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        quote.status === 'Accepted' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : quote.status === 'Sent' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : quote.status === 'Rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        {quote.status !== 'Accepted' && quote.status !== 'Invoiced' && (
                          <button onClick={() => markAsAccepted(quote._id)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" title="Mark as Accepted">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {quote.status === 'Accepted' && (
                          <button className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors" title="Convert to Invoice">
                            <FileCheck size={18} />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-primary-500 transition-colors" title="Download PDF">
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Quotation" maxWidth="max-w-4xl">
        <CreateQuotationForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchQuotations();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Quotations;
