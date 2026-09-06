import { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Download, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import CreateInvoiceForm from '../../components/forms/CreateInvoiceForm';

const Invoices = () => {
  const [invoices, setInvoices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/invoices?search=${searchTerm}`);
      if (res.data.success) setInvoices(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id) => {
    try {
      await api.put(`/invoices/${id}/status`, { status: 'Paid' });
      fetchInvoices();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Receipt className="mr-2 text-primary-500" /> Invoices
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage billing, payments, and generate GST invoices.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Plus size={18} className="mr-2" /> Create Invoice
        </button>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search invoices by ID or Client..." 
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
                <th className="p-3 font-medium">Invoice ID</th>
                <th className="p-3 font-medium">Client</th>
                <th className="p-3 font-medium">Dates</th>
                <th className="p-3 font-medium text-right">Amount</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="p-4 text-center text-slate-500">Loading invoices...</td></tr>
              ) : !invoices || invoices.length === 0 ? (
                <tr><td colSpan="6" className="p-4 text-center text-slate-500">No invoices found.</td></tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {invoice.invoiceNo}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {invoice.client?.companyName || invoice.client?.name || 'Unknown'}
                      </p>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      <div>Issued: {dayjs(invoice.issueDate).format('MMM D, YYYY')}</div>
                      <div className="text-xs text-red-500 mt-0.5">Due: {dayjs(invoice.dueDate).format('MMM D, YYYY')}</div>
                    </td>
                    <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-200 text-right">
                      ₹{invoice.total?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="p-3">
                      <span className={`flex items-center w-max px-2 py-1 text-xs rounded-full font-medium ${
                        invoice.status === 'Paid' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : invoice.status === 'Unpaid' 
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : invoice.status === 'Overdue'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {invoice.status === 'Paid' ? <CheckCircle size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.status !== 'Paid' && (
                          <button onClick={() => markAsPaid(invoice._id)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" title="Mark as Paid">
                            <CheckCircle size={18} />
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Invoice" maxWidth="max-w-4xl">
        <CreateInvoiceForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchInvoices();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Invoices;
