import { useState, useEffect } from 'react';
import { Target, Plus, Search, Calendar, User } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import AddLeadForm from '../../components/forms/AddLeadForm';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

const Leads = () => {
  const [leads, setLeads] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      if (res.data.success) {
        setLeads(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leads', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (id, stage) => {
    try {
      await api.put(`/leads/${id}`, { status: stage });
      fetchLeads();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Target className="mr-2 text-primary-500" /> Lead Pipeline
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage potential client opportunities.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="input-field pl-10 py-1.5 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary py-1.5">
            <Plus size={18} className="mr-2" /> Add Lead
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">Loading pipeline...</div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {STAGES.map(stage => {
              const stageLeads = leads?.filter(l => l.status === stage && 
                (l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 l.companyName.toLowerCase().includes(searchTerm.toLowerCase()))) || [];
              
              return (
                <div key={stage} className="w-80 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl flex flex-col border border-slate-200 dark:border-slate-800 h-full">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-100 dark:bg-slate-800 rounded-t-xl shrink-0">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300">{stage}</h3>
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs py-0.5 px-2 rounded-full font-medium">
                      {stageLeads.length}
                    </span>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {stageLeads.map(lead => (
                      <div key={lead._id} className="card p-3 cursor-grab hover:border-primary-400 transition-colors bg-white dark:bg-dark-card shadow-sm border border-slate-200 dark:border-dark-border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">{lead.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{lead.companyName}</p>
                        
                        <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
                          <div className="flex items-center">
                            <User size={12} className="mr-1" />
                            {lead.assignedTo?.name?.split(' ')[0] || 'Unassigned'}
                          </div>
                          <div className="flex items-center font-medium text-slate-700 dark:text-slate-300">
                            ₹{lead.expectedValue?.toLocaleString('en-IN') || 0}
                          </div>
                        </div>

                        {/* Quick Action to move stages (since DND is not implemented yet) */}
                        <div className="mt-2 flex gap-1 justify-end">
                          <select 
                            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 outline-none"
                            value={lead.status}
                            onChange={(e) => updateStage(lead._id, e.target.value)}
                          >
                            {STAGES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="h-20 flex items-center justify-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        Drop leads here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Lead" maxWidth="max-w-3xl">
        <AddLeadForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchLeads();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Leads;
