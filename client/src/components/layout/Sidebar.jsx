import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Briefcase, 
  DollarSign, FileStack, FolderOpen, PieChart, 
  Settings, LogOut, ChevronLeft, Building2, UserPlus, 
  Wallet, Monitor, CheckSquare
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const role = user?.role || 'Employee';

  const menuGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['CEO', 'HR Manager', 'Finance Manager', 'Sales Executive', 'Project Manager', 'Employee'] },
        { name: 'Reports', icon: PieChart, path: '/reports', roles: ['CEO', 'Finance Manager'] },
      ]
    },
    {
      title: 'PEOPLE & HR',
      items: [
        { name: 'Employees', icon: Users, path: '/hr/employees', roles: ['CEO', 'HR Manager'] },
        { name: 'Attendance', icon: UserPlus, path: '/hr/attendance', roles: ['CEO', 'HR Manager', 'Employee'] },
        { name: 'Leaves', icon: FileStack, path: '/hr/leaves', roles: ['CEO', 'HR Manager', 'Employee'] },
        { name: 'Payroll', icon: Wallet, path: '/hr/payroll', roles: ['CEO', 'HR Manager', 'Finance Manager'] },
      ]
    },
    {
      title: 'SALES & CRM',
      items: [
        { name: 'Leads', icon: Building2, path: '/crm/leads', roles: ['CEO', 'Sales Executive'] },
        { name: 'Clients', icon: Users, path: '/crm/clients', roles: ['CEO', 'Sales Executive'] },
        { name: 'Quotations', icon: FileText, path: '/quotations', roles: ['CEO', 'Sales Executive', 'Finance Manager'] },
      ]
    },
    {
      title: 'FINANCE & PROJECTS',
      items: [
        { name: 'Invoices', icon: FileText, path: '/invoices', roles: ['CEO', 'Sales Executive', 'Finance Manager'] },
        { name: 'Income & Expenses', icon: DollarSign, path: '/finance', roles: ['CEO', 'Finance Manager'] },
        { name: 'Projects', icon: Briefcase, path: '/projects', roles: ['CEO', 'Project Manager', 'Employee'] },
        { name: 'Tasks', icon: CheckSquare, path: '/tasks', roles: ['CEO', 'Project Manager', 'Employee', 'HR Manager', 'Sales Executive', 'Finance Manager'] },
      ]
    },
    {
      title: 'ASSETS & DOCS',
      items: [
        { name: 'Assets', icon: Monitor, path: '/assets', roles: ['CEO', 'HR Manager'] },
        { name: 'Documents', icon: FolderOpen, path: '/documents', roles: ['CEO', 'HR Manager', 'Finance Manager', 'Project Manager', 'Sales Executive', 'Employee'] },
      ]
    }
  ];

  return (
    <aside className={`flex flex-col h-screen transition-all duration-300 ease-in-out bg-slate-900 text-white z-20 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800">
        {isOpen && (
          <div className="flex items-center space-x-2 font-bold text-xl tracking-tight text-primary-400">
            <span className="bg-primary-500 text-slate-900 rounded-md p-1 leading-none">CEO</span>
            <span>CX</span>
          </div>
        )}
        {!isOpen && (
          <div className="w-full flex justify-center text-primary-400 font-bold bg-primary-500/20 rounded p-1">
            CEO
          </div>
        )}
        {isOpen && (
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {menuGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="mb-6">
              {isOpen && (
                <div className="px-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              <ul className="space-y-1">
                {visibleItems.map((item, i) => (
                  <li key={i}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center px-6 py-2.5 transition-colors ${
                          isActive
                            ? 'bg-primary-500/10 text-primary-400 border-r-2 border-primary-500'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                      title={!isOpen ? item.name : undefined}
                    >
                      <item.icon size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
                      {isOpen && <span className="font-medium text-sm">{item.name}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-2 py-2 transition-colors rounded-lg ${
              isActive ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:bg-slate-800'
            }`
          }
        >
          <Settings size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
          {isOpen && <span className="font-medium text-sm">Settings</span>}
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center w-full px-2 py-2 mt-2 transition-colors rounded-lg text-slate-300 hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
          {isOpen && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
