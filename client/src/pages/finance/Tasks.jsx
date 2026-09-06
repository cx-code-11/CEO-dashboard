import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Search, Calendar, User } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import AddTaskForm from '../../components/forms/AddTaskForm';

const STAGES = ['To Do', 'In Progress', 'Review', 'Done'];

const Tasks = () => {
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedTasks = STAGES.reduce((acc, stage) => {
    acc[stage] = tasks?.filter(t => t.status === stage) || [];
    return acc;
  }, {});

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (task && task.status !== newStatus) {
      const originalTasks = [...tasks];
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      
      try {
        await api.put(`/tasks/${taskId}`, { status: newStatus });
      } catch (error) {
        console.error('Failed to update task status', error);
        setTasks(originalTasks);
      }
    }
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'Medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <CheckSquare className="mr-2 text-primary-500" /> Tasks
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and track daily tasks and project deliverables.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary py-1.5">
            <Plus size={18} className="mr-2" /> Add Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">Loading tasks...</div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {STAGES.map(stage => (
              <div 
                key={stage} 
                className="w-80 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col border border-slate-200 dark:border-slate-700 h-full"
                onDrop={(e) => handleDrop(e, stage)}
                onDragOver={allowDrop}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white">{stage}</h3>
                  <span className="bg-white dark:bg-slate-800 text-slate-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                    {groupedTasks[stage].length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {groupedTasks[stage].filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map(task => (
                    <div 
                      key={task._id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-primary-500 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.project && (
                          <span className="text-[10px] bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 px-2 py-0.5 rounded uppercase font-semibold truncate max-w-[100px]" title={task.project.name}>
                            {task.project.name}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-slate-800 dark:text-white mb-2 line-clamp-2">{task.title}</h4>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-xs text-slate-500 gap-1" title="Due Date">
                          <Calendar size={14} />
                          <span className={dayjs(task.dueDate).isBefore(dayjs(), 'day') && task.status !== 'Done' ? 'text-red-500 font-medium' : ''}>
                            {dayjs(task.dueDate).format('MMM D')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md" title={`Assigned to ${task.assignedTo?.name}`}>
                          <User size={12} />
                          <span>{task.assignedTo?.name?.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {groupedTasks[stage].length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-sm text-slate-400">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Task" maxWidth="max-w-3xl">
        <AddTaskForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchTasks();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Tasks;
