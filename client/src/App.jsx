import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Employees from './pages/hr/Employees';
import Attendance from './pages/hr/Attendance';
import Leaves from './pages/hr/Leaves';
import Payroll from './pages/hr/Payroll';

// CRM Pages
import Clients from './pages/crm/Clients';
import Leads from './pages/crm/Leads';
import Quotations from './pages/crm/Quotations';

// Finance & Projects Pages
import Invoices from './pages/finance/Invoices';
import Finance from './pages/finance/Finance';
import Projects from './pages/finance/Projects';
import Tasks from './pages/finance/Tasks';

// Assets & Documents Pages
import Assets from './pages/assets/Assets';
import Documents from './pages/assets/Documents';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* HR Routes */}
        <Route path="hr/employees" element={<Employees />} />
        <Route path="hr/attendance" element={<Attendance />} />
        <Route path="hr/leaves" element={<Leaves />} />
        <Route path="hr/payroll" element={<Payroll />} />

        {/* CRM Routes */}
        <Route path="crm/clients" element={<Clients />} />
        <Route path="crm/leads" element={<Leads />} />
        <Route path="quotations" element={<Quotations />} />

        {/* Finance & Projects Routes */}
        <Route path="invoices" element={<Invoices />} />
        <Route path="finance" element={<Finance />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />

        {/* Assets & Docs Routes */}
        <Route path="assets" element={<Assets />} />
        <Route path="documents" element={<Documents />} />

        {/* Reports & Settings Placeholder */}
        <Route path="settings" element={<div className="p-8 dark:text-white">Settings Page - Coming Soon</div>} />
        
        <Route path="*" element={<div className="p-8 text-center text-red-500 font-bold text-xl mt-20">404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
