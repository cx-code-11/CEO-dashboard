import { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import dayjs from 'dayjs';
import useAuthStore from '../../store/authStore';

const Topbar = ({ sidebarOpen, setSidebarOpen, darkMode, toggleTheme }) => {
  const { user } = useAuthStore();
  const [time, setTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border z-10 sticky top-0 transition-colors">
      <div className="flex items-center">
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 mr-4 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white leading-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Digital Clock */}
        <div className="hidden lg:flex flex-col items-end justify-center px-3 py-1 bg-slate-900 dark:bg-[#0f111a] rounded-lg border border-slate-700/50 shadow-inner mr-2">
          <span className="text-[10px] uppercase tracking-widest text-primary-400/80 font-semibold mb-[-2px]">
            {time.format('MMM D, YYYY')}
          </span>
          <span className="font-mono text-sm tracking-wider text-cyan-400 font-bold">
            {time.format('HH:mm:ss')}
          </span>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark-card"></span>
        </button>

        <div className="flex items-center pl-2 md:pl-4 border-l border-slate-200 dark:border-dark-border">
          <div className="hidden md:block text-right mr-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name || 'Loading...'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'Role'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 dark:hover:ring-offset-dark-bg transition-all">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
