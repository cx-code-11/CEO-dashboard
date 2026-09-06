import { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, ArrowUpRight, ArrowDownRight, UploadCloud } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import AddTransactionForm from '../../components/forms/AddTransactionForm';
import ImportStatementModal from '../../components/forms/ImportStatementModal';

const Finance = () => {
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('Income');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/finance');
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions?.filter(t => typeFilter === 'All' || t.type === typeFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <DollarSign className="mr-2 text-primary-500" /> Income & Expenses
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Track all standalone financial transactions.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
            <UploadCloud size={18} className="mr-2" /> Import Statement
          </button>
          <button onClick={() => { setTransactionType('Income'); setIsModalOpen(true); }} className="btn bg-green-500 text-white hover:bg-green-600">
            <Plus size={18} className="mr-2" /> Record Income
          </button>
          <button onClick={() => { setTransactionType('Expense'); setIsModalOpen(true); }} className="btn bg-red-500 text-white hover:bg-red-600">
            <Plus size={18} className="mr-2" /> Record Expense
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex gap-2 mb-6">
          {['All', 'Income', 'Expense'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                typeFilter === type 
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Title & Category</th>
                <th className="p-3 font-medium text-right">Amount</th>
                <th className="p-3 font-medium">Payment Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="p-4 text-center text-slate-500">Loading transactions...</td></tr>
              ) : !filteredTransactions || filteredTransactions.length === 0 ? (
                <tr><td colSpan="4" className="p-4 text-center text-slate-500">No transactions found.</td></tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {dayjs(tx.date).format('MMM D, YYYY')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          tx.type === 'Income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {tx.type === 'Income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{tx.title}</p>
                          <p className="text-xs text-slate-500">{tx.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`p-3 text-sm font-semibold text-right ${
                      tx.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'Income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded text-xs font-medium">
                        {tx.paymentMode}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Record ${transactionType}`} maxWidth="max-w-2xl">
        <AddTransactionForm 
          type={transactionType}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTransactions();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Bank Statement" maxWidth="max-w-md">
        <ImportStatementModal 
          onSuccess={(data) => {
            setIsImportModalOpen(false);
            alert(`Imported ${data.incomeCount} Incomes and ${data.expenseCount} Expenses successfully!`);
            fetchTransactions();
          }} 
          onCancel={() => setIsImportModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Finance;
