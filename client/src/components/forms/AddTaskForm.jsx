import { useState, useEffect } from 'react';
import api from '../../api/axios';

const AddTaskForm = ({ onSuccess, onCancel, preSelectedProject = '' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: preSelectedProject,
    assignedTo: '',
    dueDate: '',
    priority: 'Medium',
    status: 'To Do'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, empRes] = await Promise.all([
          api.get('/projects?limit=100'),
          api.get('/employees?limit=100')
        ]);
        
        if (projRes.data.success) {
          setProjects(projRes.data.data);
          if (!preSelectedProject && projRes.data.data.length > 0) {
            setFormData(prev => ({ ...prev, project: projRes.data.data[0]._id }));
          }
        }
        
        if (empRes.data.success) {
          const empList = empRes.data.data;
          setEmployees(empList);
          if (empList.length > 0) {
            setFormData(prev => ({ ...prev, assignedTo: empList[0].user._id }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [preSelectedProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/tasks', formData);
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Task Title *</label>
          <input type="text" name="title" required value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Design Homepage" />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project</label>
          <select name="project" value={formData.project} onChange={handleChange} className="input-field">
            <option value="">No Project (General Task)</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assign To *</label>
          <select name="assignedTo" required value={formData.assignedTo} onChange={handleChange} className="input-field">
            {employees.map(e => (
              <option key={e.user?._id} value={e.user?._id}>{e.user?.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Due Date *</label>
          <input type="date" name="dueDate" required value={formData.dueDate} onChange={handleChange} className="input-field" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} className="input-field">
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="input-field min-h-[100px]"></textarea>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Add Task'}
        </button>
      </div>
    </form>
  );
};

export default AddTaskForm;
