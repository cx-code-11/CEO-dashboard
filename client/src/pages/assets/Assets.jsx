import { useState, useEffect } from 'react';
import { Laptop, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import AddAssetForm from '../../components/forms/AddAssetForm';

const Assets = () => {
  const [assets, setAssets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      if (res.data.success) {
        setAssets(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assets', error);
      // Fallback empty state for demo if endpoint doesn't exist
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/assets?search=${searchTerm}`);
      if (res.data.success) setAssets(res.data.data);
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
            <Laptop className="mr-2 text-primary-500" /> Asset Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Track hardware, software, and company property.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Plus size={18} className="mr-2" /> Add Asset
        </button>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search assets by name or ID..." 
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
                <th className="p-3 font-medium">Asset Details</th>
                <th className="p-3 font-medium">Serial No.</th>
                <th className="p-3 font-medium">Assigned To</th>
                <th className="p-3 font-medium">Purchase Date</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">Loading assets...</td></tr>
              ) : !assets || assets.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">No assets found.</td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{asset.name}</p>
                      <p className="text-xs text-slate-500">{asset.type}</p>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {asset.serialNumber || 'N/A'}
                    </td>
                    <td className="p-3">
                      {asset.assignedTo ? (
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{asset.assignedTo.name}</span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {asset.purchaseDate ? dayjs(asset.purchaseDate).format('MMM D, YYYY') : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`flex items-center w-max px-2 py-1 text-xs rounded-full font-medium ${
                        asset.status === 'Available' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : asset.status === 'Assigned' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {asset.status === 'Available' ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Asset" maxWidth="max-w-3xl">
        <AddAssetForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchAssets();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Assets;
