import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'canteen_admin') {
        toast.success(`Welcome to Canteen Portal, ${user.full_name}!`);
        navigate('/admin');
      } else if (user.role === 'super_admin') {
        toast.success('Welcome Super Administrator!');
        navigate('/superadmin');
      } else {
        await logout();
        setError('Access denied: Only Canteen Administrators and Super Admins can access this portal.');
        toast.error('Unauthorized portal access.');
      }
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Invalid admin credentials. Please verify your email and password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillAdmin = (adminEmail, adminPass) => {
    setEmail(adminEmail);
    setPassword(adminPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto pt-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student Login
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/20 mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white">Canteen Staff & Admin</h1>
            <p className="text-xs text-gray-400 mt-1">
              Authorized operations management console for Medi-Caps University
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-950/80 border border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Staff Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="canteen@medicaps.ac.in"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {submitting ? 'Verifying Credentials...' : 'Access Admin Panel'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center mb-3">
              One-Click Staff Accounts
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillAdmin('canteen@medicaps.ac.in', 'Canteen@123')}
                className="w-full p-2.5 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-xl text-left text-xs transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-orange-400 block">Canteen Admin</span>
                  <span className="text-gray-400">canteen@medicaps.ac.in</span>
                </div>
                <span className="text-[10px] bg-orange-950 text-orange-400 border border-orange-800 px-2 py-0.5 rounded font-mono">
                  Fill
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillAdmin('admin@medicaps.ac.in', 'Admin@123')}
                className="w-full p-2.5 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-xl text-left text-xs transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-indigo-400 block">Super Admin</span>
                  <span className="text-gray-400">admin@medicaps.ac.in</span>
                </div>
                <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                  Fill
                </span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 pt-4 border-t border-gray-800">
            Need a new canteen manager account?{' '}
            <Link to="/admin/register" className="text-orange-400 font-bold hover:underline">
              Register Canteen Staff
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-8">
        Medi-Caps University Campus Services • Security Encrypted Access
      </p>
    </div>
  );
}
