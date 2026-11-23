import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerStudent } from '../../api/auth';
import { getCanteens } from '../../api/menu';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck, ArrowRight, User, Mail, Lock, Phone,
  Building2, AlertCircle, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    canteen_id: '',
    password: '',
    password2: '',
  });
  const [canteens, setCanteens] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCanteens() {
      try {
        const { data } = await getCanteens();
        const list = data.results || data || [];
        setCanteens(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, canteen_id: String(list[0].id) }));
        }
      } catch (err) {
        console.error('Failed to load canteens', err);
      }
    }
    loadCanteens();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.password2) {
      setErrors({ password2: ['Passwords do not match.'] });
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.canteen_id) {
      toast.error('Please select an authorized campus canteen.');
      return;
    }

    setSubmitting(true);
    try {
      await registerStudent({
        ...formData,
        role: 'canteen_admin',
        canteen_id: parseInt(formData.canteen_id, 10),
      });
      toast.success('Canteen administrator account created! Logging in...');
      await login(formData.email, formData.password);
      navigate('/admin');
    } catch (err) {
      if (err.response?.data) {
        const respErrors = err.response.data;
        setErrors(respErrors);
        let errorText = 'Registration failed.';
        for (const [key, val] of Object.entries(respErrors)) {
          const msg = Array.isArray(val) ? val[0] : val;
          errorText = `${key.replace('_', ' ')}: ${msg}`;
          break;
        }
        toast.error(errorText);
      } else {
        toast.error(err.message || 'Cannot connect to server.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col justify-between p-6">
      <div className="max-w-xl w-full mx-auto pt-4">
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Login
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/20 mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white">Canteen Staff Onboarding</h1>
            <p className="text-xs text-gray-400 mt-1">
              Register as a verified Canteen Administrator for Medi-Caps University
            </p>
          </div>

          {errors.non_field_errors && (
            <div className="mb-4 p-3.5 bg-red-950/80 border border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.non_field_errors[0]}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-400 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                />
              </div>
              {errors.full_name && <p className="text-[11px] text-red-400 mt-1">{errors.full_name[0]}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-400 mb-1">Staff Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="manager@medicaps.ac.in"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email[0]}</p>}
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">Assigned Canteen *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <select
                    name="canteen_id"
                    required
                    value={formData.canteen_id}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-orange-500 transition text-sm cursor-pointer"
                  >
                    <option value="">Select Canteen</option>
                    {canteens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.canteen_id && <p className="text-[11px] text-red-400 mt-1">{errors.canteen_id[0]}</p>}
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-400 mb-1">Mobile Contact</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9826012345"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                />
              </div>
              {errors.mobile && <p className="text-[11px] text-red-400 mt-1">{errors.mobile[0]}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-400 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                  />
                </div>
                {errors.password && <p className="text-[11px] text-red-400 mt-1">{errors.password[0]}</p>}
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    name="password2"
                    required
                    value={formData.password2}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                  />
                </div>
                {errors.password2 && <p className="text-[11px] text-red-400 mt-1">{errors.password2[0]}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50 text-sm"
            >
              {submitting ? 'Registering Staff Account...' : 'Complete Staff Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an admin account?{' '}
            <Link to="/admin/login" className="text-orange-400 font-bold hover:underline">
              Sign In to Admin Portal
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-6">
        Medi-Caps University Campus Services • Authorized Canteen Access
      </p>
    </div>
  );
}
