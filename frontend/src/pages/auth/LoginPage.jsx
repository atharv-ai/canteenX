import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      toast.success(`Welcome back, ${loggedUser.full_name}!`);
      if (loggedUser.role === 'canteen_admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'super_admin') {
        navigate('/superadmin');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.email_unverified) {
        toast.error('Email not verified. Please verify your 6-digit code.', { duration: 4000 });
        navigate('/register', { state: { email: err.response.data.email || email, step: 'otp' } });
        return;
      }
      const msg = err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        (err.response?.data ? JSON.stringify(err.response.data) : null) ||
        err.message ||
        'Invalid email or password. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight">
                Canteen<span className="text-orange-500">X</span>
              </span>
              <p className="text-xs text-orange-200/80 font-medium">Medi-Caps University, Indore</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            Skip the Queue, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Savor the Flavor.
            </span>
          </h2>
          <p className="mt-4 text-gray-300 text-sm leading-relaxed">
            Order fresh meals from university canteens, track food prep in real-time, and pick up without standing in long lines.
          </p>

          <div className="mt-8 flex gap-6 text-xs text-gray-400">
            <div>
              <p className="text-xl font-bold text-white">20+</p>
              <p>Campus Dishes</p>
            </div>
            <div className="border-l border-gray-800 pl-6">
              <p className="text-xl font-bold text-white">0 Min</p>
              <p>Waiting in Line</p>
            </div>
            <div className="border-l border-gray-800 pl-6">
              <p className="text-xl font-bold text-white">100%</p>
              <p>Hygienic</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-gray-500">
          © {new Date().getFullYear()} Medi-Caps University Food Management System.
        </p>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-6">
          <div>
            <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">Student Portal</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">Sign In to CanteenX</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter your credentials or choose a quick demo login below.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">University Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@medicaps.ac.in"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-orange-600 hover:underline font-semibold">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-500 mb-2.5 text-center">Quick Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('student@medicaps.ac.in', 'Student@123')}
                className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl font-medium border border-orange-200 transition text-left cursor-pointer"
              >
                <span className="font-bold block text-orange-900">Student Demo</span>
                student@medicaps.ac.in
              </button>
              <button
                type="button"
                onClick={() => fillDemo('canteen@medicaps.ac.in', 'Canteen@123')}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium border border-gray-200 transition text-left cursor-pointer"
              >
                <span className="font-bold block text-gray-900">Canteen Admin</span>
                canteen@medicaps.ac.in
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>
              Don't have an account yet?{' '}
              <Link to="/register" className="text-orange-600 font-bold hover:underline">
                Register as Student
              </Link>
            </p>
            <p>
              Are you canteen staff?{' '}
              <Link to="/admin/login" className="text-gray-700 font-semibold hover:underline">
                Canteen Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
