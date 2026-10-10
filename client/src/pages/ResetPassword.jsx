import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Code2, Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { INPUT_CLASSES, BUTTON_CLASSES } from '../utils/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { resetPassword } from '../api';

export default function ResetPassword() {
  usePageTitle('Set New Password');
  const { resettoken } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('form'); // form | success | invalid-token | expired-token

  useEffect(() => {
    if (!resettoken) {
      toast.error('Missing reset token');
      navigate('/login');
      return;
    }
  }, [resettoken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resettoken, form.password);
      setState('success');
    } catch (error) {
      const message =
        error.response?.data?.message || error.response?.data?.error || 'Failed to reset password';
      if (message.includes('Invalid or expired reset token')) {
        setState(message.includes('already used') ? 'invalid-token' : 'expired-token');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Code2 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
            <h1 className="text-3xl font-bold text-white">PrepAgent</h1>
            <p className="text-gray-400 mt-1">Your placement preparation companion</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-8 space-y-4 shadow-2xl border border-gray-800">
            <div className="flex items-center justify-center gap-3 text-green-400">
              <CheckCircle className="w-8 h-8" />
              <div className="text-left">
                <p className="text-xl font-semibold text-white">Password reset successful</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your password has been updated. You can now sign in on any device.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={BUTTON_CLASSES.primary + ' w-full justify-center'}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Code2 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-white">PrepAgent</h1>
          <p className="text-gray-400 mt-1">Your placement preparation companion</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 space-y-5 shadow-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Set New Password</h2>
          <div>
            <label className="text-gray-300 text-sm block mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={INPUT_CLASSES + ' pl-10'}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className={INPUT_CLASSES + ' pl-10'}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className={BUTTON_CLASSES.primary + ' w-full justify-center'}>
            {loading ? 'Resetting password...' : 'Reset Password'}
          </button>
          <button type="button" onClick={() => navigate('/login')} className={BUTTON_CLASSES.secondary + ' w-full justify-center'}>
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
