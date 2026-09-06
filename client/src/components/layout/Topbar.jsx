import { Menu, Sun, Moon, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Topbar = ({ sidebarOpen, setSidebarOpen, darkMode, toggleTheme }) => {
  const { user } = useAuthStore();

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
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white hidden sm:block">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </h1>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
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
