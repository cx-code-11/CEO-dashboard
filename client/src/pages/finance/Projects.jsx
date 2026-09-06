import { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Calendar, Users, MoreVertical } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import AddProjectForm from '../../components/forms/AddProjectForm';

const Projects = () => {
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/projects?search=${searchTerm}`);
      if (res.data.success) setProjects(res.data.data);
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
            <Briefcase className="mr-2 text-primary-500" /> Projects
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage client deliverables, budgets, and timelines.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Plus size={18} className="mr-2" /> New Project
        </button>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading projects...</div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-10 text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            No projects found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-primary-500 transition-colors bg-white dark:bg-dark-card group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800 dark:text-white truncate max-w-[200px]" title={project.title}>
                    {project.title}
                  </h3>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{project.description}</p>
                
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center"><Calendar size={14} className="mr-1.5" /> Deadline</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{dayjs(project.deadline).format('MMM D, YYYY')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center"><Users size={14} className="mr-1.5" /> Client</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{project.client?.companyName || 'Internal'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Budget</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">₹{project.budget?.toLocaleString('en-IN') || 0}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    project.status === 'Completed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : project.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {project.status}
                  </span>
                  
                  {/* Progress Bar Mockup */}
                  <div className="flex items-center gap-2 w-24">
                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500" style={{ width: project.status === 'Completed' ? '100%' : project.status === 'In Progress' ? '45%' : '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Project" maxWidth="max-w-3xl">
        <AddProjectForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchProjects();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Projects;
