import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { INPUT_CLASSES, BUTTON_CLASSES } from '../utils/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { forgotPassword } from '../api';

export default function ForgotPassword() {
  usePageTitle('Reset Password');
  const [form, setForm] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await forgotPassword(form.email);
      setSent(true);
      // SECURITY: the server deliberately never returns the reset token - the
      // requester has not proved they own the mailbox, so handing it back would
      // be an account-takeover primitive. We therefore show only the server's
      // neutral confirmation and send the user to their mail client.
      setMessage(data.message || 'If an account exists for that address, a password reset link has been issued.');
      toast.success('Reset link requested');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Code2 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
            <h1 className="text-3xl font-bold text-white">PrepAgent</h1>
            <p className="text-gray-400 mt-1">Your placement preparation companion</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-8 space-y-4 shadow-2xl border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
            <p className="text-gray-300 text-sm">{message}</p>
            <p className="text-gray-500 text-xs">
              For your security we never display the reset link here. Open the email sent to{' '}
              <span className="text-gray-300">{form.email}</span> and follow the link to set a new password.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={BUTTON_CLASSES.secondary + ' w-full justify-center'}
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
          <h2 className="text-xl font-semibold text-white mb-6">Forgot Password?</h2>
          <p className="text-gray-300 text-sm">Enter your email and we'll send you a reset link.</p>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={INPUT_CLASSES + ' pl-10'}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className={BUTTON_CLASSES.primary + ' w-full justify-center'}>
            {loading ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
          <button type="button" onClick={() => navigate('/login')} className={BUTTON_CLASSES.secondary + ' w-full justify-center'}>
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
