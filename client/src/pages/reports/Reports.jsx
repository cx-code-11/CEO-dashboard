import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { FileText, TrendingUp, Briefcase } from 'lucide-react';
import api from '../../api/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

export default function Reports() {
  const [financeData, setFinanceData] = useState([]);
  const [clientRevenue, setClientRevenue] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [financeRes, clientRes, expenseRes] = await Promise.all([
        api.get('/reports/finance?type=monthly'),
        api.get('/reports/client-revenue'),
        api.get('/reports/expense-categories')
      ]);

      if (financeRes.data.success) setFinanceData(financeRes.data.data);
      if (clientRes.data.success) setClientRevenue(clientRes.data.data);
      if (expenseRes.data.success) setExpenseCategories(expenseRes.data.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`;

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="text-primary-500" />
            Analytics & Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive view of company performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Trends */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20} />
            Income vs Expenses (Monthly)
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financeData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" className="text-xs" stroke="#888888" />
                <YAxis className="text-xs" stroke="#888888" tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={3} />
                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#0ea5e9" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clients by Revenue */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Briefcase className="text-blue-500" size={20} />
            Top Clients by Revenue
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientRevenue} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis type="number" className="text-xs" stroke="#888888" tickFormatter={(value) => `₹${value/1000}k`} />
                <YAxis dataKey="companyName" type="category" className="text-xs" stroke="#888888" width={100} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Expense Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="_id"
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
