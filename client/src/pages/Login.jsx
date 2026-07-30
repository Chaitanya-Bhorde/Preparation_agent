import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { INPUT_CLASSES, BUTTON_CLASSES } from '../utils/ui';
import { usePageTitle } from '../hooks/usePageTitle';
export default function Login() {
  usePageTitle('Sign In');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Code2 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-white">PrepAgent</h1>
          <p className="text-gray-400 mt-1">Your placement preparation companion</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 space-y-5 shadow-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={INPUT_CLASSES}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={INPUT_CLASSES}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={BUTTON_CLASSES.primary}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-gray-400 text-sm text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}