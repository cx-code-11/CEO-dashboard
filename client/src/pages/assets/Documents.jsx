import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Search, FileText, Download, Trash2, Image, File, Upload } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import Modal from '../../components/ui/Modal';
import UploadDocumentForm from '../../components/forms/UploadDocumentForm';

const Documents = () => {
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents', error);
      // Fallback for demo
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    if (type?.includes('image')) return <Image className="text-blue-500" />;
    if (type?.includes('pdf')) return <FileText className="text-red-500" />;
    return <File className="text-slate-500" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <FolderOpen className="mr-2 text-primary-500" /> Document Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Securely store and share company policies, contracts, and files.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          <Upload size={18} className="mr-2" /> Upload Document
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-2 max-w-md mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading documents...</div>
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 text-slate-400">
              <FolderOpen size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">No Documents Found</h3>
            <p className="text-slate-500 text-sm">Upload your first file to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => (
              <div key={doc._id} className="group relative border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-primary-500 transition-colors bg-white dark:bg-dark-card flex flex-col items-center text-center">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-primary-500 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                    <Download size={14} />
                  </button>
                  <button className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="w-16 h-16 flex items-center justify-center mb-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  {getIcon(doc.fileType)}
                </div>
                
                <h4 className="text-sm font-medium text-slate-800 dark:text-white truncate w-full" title={doc.name}>
                  {doc.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {dayjs(doc.uploadDate).format('MMM D, YYYY')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Upload Document" maxWidth="max-w-xl">
        <UploadDocumentForm 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchDocuments();
          }} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default Documents;
