import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Briefcase, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

const mockChartData = [
  { name: 'Jan', revenue: 4000, expense: 2400 },
  { name: 'Feb', revenue: 3000, expense: 1398 },
  { name: 'Mar', revenue: 2000, expense: 9800 },
  { name: 'Apr', revenue: 2780, expense: 3908 },
  { name: 'May', revenue: 1890, expense: 4800 },
  { name: 'Jun', revenue: 2390, expense: 3800 },
  { name: 'Jul', revenue: 3490, expense: 4300 },
];

const StatCard = ({ title, value, icon: Icon, trend, isCurrency }) => (
  <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
          {isCurrency ? '₹' : ''}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </h3>
      </div>
      <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg">
        <Icon size={24} />
      </div>
    </div>
    
    {trend !== undefined && (
      <div className="mt-4 flex items-center text-sm">
        {trend >= 0 ? (
          <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
            <ArrowUpRight size={16} className="mr-1" />
            {trend}%
          </span>
        ) : (
          <span className="flex items-center text-red-600 dark:text-red-400 font-medium">
            <ArrowDownRight size={16} className="mr-1" />
            {Math.abs(trend)}%
          </span>
        )}
        <span className="text-slate-500 dark:text-slate-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [kpi, setKpi] = useState({
    revenue: { current: 0, growth: 0 },
    expenses: { current: 0, growth: 0 },
    profit: { current: 0, growth: 0 },
    receivables: 0,
    activeProjects: 0,
    employeeCount: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/dashboard/kpi');
        if (res.data.success) {
          setKpi(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch KPIs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">CEO Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your business performance in real-time.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm">Download Report</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue (Monthly)" 
          value={kpi.revenue.current} 
          icon={TrendingUp} 
          trend={kpi.revenue.growth} 
          isCurrency 
        />
        <StatCard 
          title="Total Expenses (Monthly)" 
          value={kpi.expenses.current} 
          icon={DollarSign} 
          trend={kpi.expenses.growth} 
          isCurrency 
        />
        <StatCard 
          title="Net Profit (Monthly)" 
          value={kpi.profit.current} 
          icon={TrendingUp} 
          trend={kpi.profit.growth} 
          isCurrency 
        />
        <StatCard 
          title="Outstanding Receivables" 
          value={kpi.receivables} 
          icon={FileText} 
          isCurrency 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Projects" value={kpi.activeProjects} icon={Briefcase} />
        <StatCard title="Total Employees" value={kpi.employeeCount} icon={Users} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Revenue vs Expenses</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card p-6 h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4 overflow-y-auto pr-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">Invoice #INV-2024-000{i} paid</p>
                  <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
