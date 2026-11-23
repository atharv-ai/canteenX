import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { UtensilsCrossed, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPasswordConfirm } from '../../api/auth';

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (newPassword !== confirmPassword) {
      setErrors({ confirm_password: ['Passwords do not match.'] });
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordConfirm({
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
      toast.success('Password reset successful! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const data = err.response?.data || {};
      if (typeof data === 'object' && !Array.isArray(data)) {
        setErrors(data);
        const firstMsg =
          data.token?.[0] ||
          data.new_password?.[0] ||
          data.confirm_password?.[0] ||
          data.detail ||
          'Reset failed. Please try again.';
        toast.error(firstMsg);
      } else {
        const msg = err.message || 'Reset failed. Please try again.';
        setErrors({ token: [msg] });
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
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
            Set a new <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              password.
            </span>
          </h2>
          <p className="mt-4 text-gray-300 text-sm leading-relaxed">
            Choose a strong password — at least 8 characters, mixing letters and numbers.
            This link is one-time use only.
          </p>
        </div>
        <p className="relative z-10 text-xs text-gray-500">
          © {new Date().getFullYear()} Medi-Caps University Food Management System.
        </p>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-6">
          {success ? (
            /* ── Success State ── */
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Password Reset!</h1>
                <p className="text-sm text-gray-500 mt-2">
                  Your password has been updated successfully. Redirecting to Sign In…
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:underline"
              >
                Go to Sign In →
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div>
                <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">Password Recovery</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">Reset Password</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter and confirm your new password below.
                </p>
              </div>

              {/* Token-level error (invalid / expired link) */}
              {errors.token && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Link invalid or expired</p>
                    <p>{errors.token[0]}</p>
                    <Link to="/forgot-password" className="underline font-semibold mt-1 inline-block">
                      Request a new reset link →
                    </Link>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="input-field pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.new_password && (
                    <ul className="mt-1.5 space-y-0.5">
                      {errors.new_password.map((msg, i) => (
                        <li key={i} className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="input-field pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {errors.confirm_password[0]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Resetting…' : 'Reset Password'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center text-xs text-gray-500">
                <p>
                  <Link to="/forgot-password" className="text-orange-600 font-semibold hover:underline">
                    Request a new link
                  </Link>
                  {' · '}
                  <Link to="/login" className="text-gray-700 font-semibold hover:underline">
                    Back to Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
