import { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const Attendance = () => {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Not Checked In'); // Local status

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance');
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/checkin');
      setStatus('Checked In');
      fetchAttendance();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/checkout');
      setStatus('Checked Out');
      fetchAttendance();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Clock className="mr-2 text-primary-500" /> Daily Attendance
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Track employee check-ins and check-outs.</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-dark-card p-2 rounded-lg border border-slate-200 dark:border-dark-border shadow-sm">
          <button onClick={handleCheckIn} className="btn bg-green-500 text-white hover:bg-green-600">
            Check In
          </button>
          <button onClick={handleCheckOut} className="btn bg-slate-500 text-white hover:bg-slate-600">
            Check Out
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-medium">
          <CalendarIcon size={18} />
          <span>Recent Logs</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Employee</th>
                <th className="p-3 font-medium">Check In</th>
                <th className="p-3 font-medium">Check Out</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">Loading attendance...</td></tr>
              ) : !records || records.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">No records found.</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 text-sm text-slate-800 dark:text-slate-200">
                      {dayjs(record.date).format('MMM D, YYYY')}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{record.employee?.user?.name}</p>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {record.checkInTime ? dayjs(record.checkInTime).format('hh:mm A') : '-'}
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {record.checkOutTime ? dayjs(record.checkOutTime).format('hh:mm A') : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`flex items-center w-max px-2 py-1 text-xs rounded-full font-medium ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : record.status === 'Absent' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {record.status === 'Present' ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
