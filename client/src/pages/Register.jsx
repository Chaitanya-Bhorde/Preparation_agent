import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { INPUT_CLASSES, BUTTON_CLASSES } from '../utils/ui';
import { usePageTitle } from '../hooks/usePageTitle';
export default function Register() {
  usePageTitle('Register');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to PrepAgent!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
          <p className="text-gray-400 mt-1">Start your placement journey</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 space-y-4 shadow-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Create Account</h2>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={INPUT_CLASSES + ' pl-10'} placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={INPUT_CLASSES + ' pl-10'} placeholder="your@email.com" />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={INPUT_CLASSES + ' pl-10'} placeholder="••••••••" minLength={6} />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className={INPUT_CLASSES + ' pl-10'} placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className={BUTTON_CLASSES.primary + ' w-full justify-center'}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-gray-400 text-sm text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}