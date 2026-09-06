import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import AddEmployeeForm from '../../components/forms/AddEmployeeForm';

const Employees = () => {
  const [employees, setEmployees] = null;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/employees?search=${searchTerm}`);
      if (res.data.success) setEmployees(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Users className="mr-2 text-primary-500" /> Employee Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your workforce, roles, and profiles.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Plus size={18} className="mr-2" /> Add Employee
        </button>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email or department..." 
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
                <th className="p-3 font-medium">Employee</th>
                <th className="p-3 font-medium">Role / Dept</th>
                <th className="p-3 font-medium">Joining Date</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">Loading employees...</td></tr>
              ) : !employees || employees.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">No employees found.</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                          {emp.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{emp.user?.name}</p>
                          <p className="text-xs text-slate-500">{emp.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-slate-800 dark:text-slate-200">{emp.user?.role}</p>
                      <p className="text-xs text-slate-500">{emp.user?.department}</p>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {dayjs(emp.joiningDate).format('MMM D, YYYY')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        emp.user?.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {emp.user?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-primary-500 transition-colors"><Edit2 size={16} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Employee" maxWidth="max-w-3xl">
        <AddEmployeeForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchEmployees();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Employees;
