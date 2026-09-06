import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('ceo@ciphermutex.com');
  const [password, setPassword] = useState('password123');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-slate-200 dark:border-dark-border">
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl tracking-tighter shadow-lg shadow-primary-500/30">
              CEO
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">CEO-CX</h2>
          <p className="text-slate-500 dark:text-slate-400">ERP & CEO Dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="label-text">Email Address</label>
              <input
                type="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ceo@ciphermutex.com"
              />
            </div>
            <div>
              <label className="label-text">Password</label>
              <input
                type="password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-2.5 text-base"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
