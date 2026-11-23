import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPassword } from '../../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // 'console' = no SMTP (dev mode), 'smtp' = real email sent, null = not submitted yet
  const [emailMode, setEmailMode] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() });
      const mode = res.data?.email_mode ?? 'smtp'; // default assume smtp if flag missing
      setEmailMode(mode);
      setSent(true);
      if (mode === 'console') {
        toast.success('Dev mode: Check your Django terminal for the reset link.');
      } else {
        toast.success('Reset link sent! Check your inbox (and spam folder).');
      }
    } catch (err) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        err.message ||
        'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isDevMode = emailMode === 'console';

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
            Forgot your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              password?
            </span>
          </h2>
          <p className="mt-4 text-gray-300 text-sm leading-relaxed">
            No worries! Enter your university email and we'll send you a secure link to reset your password in seconds.
          </p>
        </div>
        <p className="relative z-10 text-xs text-gray-500">
          © {new Date().getFullYear()} Medi-Caps University Food Management System.
        </p>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-6">
          {sent ? (
            /* ── Success State ── */
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDevMode ? 'bg-orange-100' : 'bg-green-100'}`}>
                  <CheckCircle2 className={`w-9 h-9 ${isDevMode ? 'text-orange-500' : 'text-green-600'}`} />
                </div>
              </div>

              <div>
                {isDevMode ? (
                  <>
                    <h1 className="text-2xl font-extrabold text-gray-900">Link generated!</h1>
                    <p className="text-sm text-gray-500 mt-2">
                      No email was sent — SMTP is not configured. Your reset link is waiting in the{' '}
                      <strong className="text-gray-700">Django terminal console</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-extrabold text-gray-900">Check your email!</h1>
                    <p className="text-sm text-gray-500 mt-2">
                      We've sent a password reset link to{' '}
                      <span className="font-semibold text-gray-700">{email}</span>.{' '}
                      It expires in <strong>1 hour</strong>. Check your spam folder if you don't see it.
                    </p>
                  </>
                )}
              </div>

              {/* Dev mode tip — only shown when SMTP is NOT configured */}
              {isDevMode && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 text-left space-y-1">
                  <p className="font-bold">🛠 Dev Mode — No SMTP Configured</p>
                  <p>
                    The reset link was printed to your{' '}
                    <strong>Django terminal / runserver console</strong>. Copy it from there and open it in
                    your browser to test.
                  </p>
                  <p className="text-orange-600 font-medium mt-1">
                    To send real emails: add your Gmail credentials to{' '}
                    <code className="bg-orange-100 px-1 rounded">.env</code> and restart the backend.
                  </p>
                </div>
              )}

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:underline"
              >
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div>
                <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">Password Recovery</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">Forgot Password</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your registered university email and we'll send a secure reset link.
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center text-xs text-gray-500">
                <p>
                  Remember your password?{' '}
                  <Link to="/login" className="text-orange-600 font-bold hover:underline">
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

