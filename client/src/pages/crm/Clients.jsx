import { useState, useEffect } from 'react';
import { Building2, Search, Plus, Mail, Phone, MoreVertical } from 'lucide-react';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import AddClientForm from '../../components/forms/AddClientForm';
import api from '../../api/axios';

const Clients = () => {
  const [clients, setClients] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/clients?search=${searchTerm}`);
      if (res.data.success) setClients(res.data.data);
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
            <Building2 className="mr-2 text-primary-500" /> Client Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage client relationships and contact details.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Plus size={18} className="mr-2" /> Add Client
        </button>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, company, or email..." 
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading clients...</div>
        ) : !clients || clients.length === 0 ? (
          <div className="text-center py-10 text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            No clients found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div key={client._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-dark-card group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold text-xl uppercase">
                      {client.companyName ? client.companyName.charAt(0) : client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white truncate max-w-[150px]" title={client.companyName || client.name}>
                        {client.companyName || client.name}
                      </h3>
                      <p className="text-sm text-slate-500">{client.name}</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Mail size={16} className="mr-2 text-slate-400" />
                    <a href={`mailto:${client.email}`} className="hover:text-primary-500 truncate">{client.email}</a>
                  </div>
                  {client.phone && (
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <Phone size={16} className="mr-2 text-slate-400" />
                      <a href={`tel:${client.phone}`} className="hover:text-primary-500">{client.phone}</a>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    client.status === 'Active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {client.status}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    ₹{client.totalRevenue?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Client" maxWidth="max-w-3xl">
        <AddClientForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchClients();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Clients;
