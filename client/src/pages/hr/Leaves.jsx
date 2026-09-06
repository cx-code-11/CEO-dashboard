import { useState, useEffect } from 'react';
import { CalendarDays, Check, X, FileText } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import RequestLeaveForm from '../../components/forms/RequestLeaveForm';

const Leaves = () => {
  const [leaves, setLeaves] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves');
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaves', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      fetchLeaves();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <CalendarDays className="mr-2 text-primary-500" /> Leave Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Review and approve employee leave requests.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <FileText size={18} className="mr-2" /> Request Leave
        </button>
      </div>

      <div className="card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-3 font-medium">Employee</th>
                <th className="p-3 font-medium">Leave Type</th>
                <th className="p-3 font-medium">Duration</th>
                <th className="p-3 font-medium">Reason</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="p-4 text-center text-slate-500">Loading leave requests...</td></tr>
              ) : !leaves || leaves.length === 0 ? (
                <tr><td colSpan="6" className="p-4 text-center text-slate-500">No leave requests found.</td></tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{leave.employee?.user?.name}</p>
                    </td>
                    <td className="p-3 text-sm text-slate-800 dark:text-slate-200">
                      {leave.leaveType}
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {dayjs(leave.startDate).format('MMM D')} - {dayjs(leave.endDate).format('MMM D')}
                      <div className="text-xs mt-0.5 text-slate-500">{leave.totalDays} Days</div>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {leave.reason}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        leave.status === 'Approved' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : leave.status === 'Rejected' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {leave.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(leave._id, 'Approved')} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" title="Approve">
                            <Check size={18} />
                          </button>
                          <button onClick={() => updateStatus(leave._id, 'Rejected')} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Reject">
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Request Leave" maxWidth="max-w-xl">
        <RequestLeaveForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchLeaves();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Leaves;
