import { useState, useEffect } from 'react';
import { Wallet, Download, CheckCircle, FileText } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import GeneratePayrollForm from '../../components/forms/GeneratePayrollForm';

const Payroll = () => {
  const [payrolls, setPayrolls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const res = await api.get('/payroll');
      if (res.data.success) {
        setPayrolls(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payroll records', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (id) => {
    try {
      await api.put(`/payroll/${id}/status`, { status: 'Paid', paymentDate: new Date() });
      fetchPayroll();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Wallet className="mr-2 text-primary-500" /> Payroll Processing
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage employee salaries and payslips.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <FileText size={18} className="mr-2" /> Generate Payroll
        </button>
      </div>

      <div className="card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-3 font-medium">Employee</th>
                <th className="p-3 font-medium">Month</th>
                <th className="p-3 font-medium text-right">Net Salary</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">Loading payroll records...</td></tr>
              ) : !payrolls || payrolls.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">No payroll records found.</td></tr>
              ) : (
                payrolls.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{record.employee?.user?.name}</p>
                      <p className="text-xs text-slate-500">{record.employee?.user?.email}</p>
                    </td>
                    <td className="p-3 text-sm text-slate-800 dark:text-slate-200">
                      {dayjs(record.month).format('MMMM YYYY')}
                    </td>
                    <td className="p-3 text-sm font-semibold text-slate-800 dark:text-slate-200 text-right">
                      ₹{record.netSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        record.status === 'Paid' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        {record.status === 'Pending' && (
                          <button onClick={() => processPayment(record._id)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" title="Mark as Paid">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-primary-500 transition-colors" title="Download Payslip">
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Generate Payroll" maxWidth="max-w-xl">
        <GeneratePayrollForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchPayroll();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Payroll;
