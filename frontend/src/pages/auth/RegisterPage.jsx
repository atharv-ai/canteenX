import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { registerStudent, verifyOtp, resendOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import {
  UtensilsCrossed, ArrowRight, User, Mail, Lock, Phone,
  Hash, AlertCircle, ShieldCheck, RefreshCw, ArrowLeft, KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  // If navigated here with unverified email state from login
  const initialEmail = location.state?.email || '';
  const initialStep = location.state?.step || 'form';

  const [step, setStep] = useState(initialStep); // 'form' | 'otp'
  const [registeredEmail, setRegisteredEmail] = useState(initialEmail);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: initialEmail,
    enrollment_number: '',
    mobile: '',
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(initialStep === 'otp' ? 60 : 0);

  // Resend Timer Countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.password2) {
      setErrors({ password2: ['Passwords do not match.'] });
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerStudent({
        ...formData,
        role: 'student',
      });

      const email = formData.email.trim().toLowerCase();
      setRegisteredEmail(email);

      if (res.data?.otp_required) {
        setStep('otp');
        setCooldown(60);
        toast.success('Registration successful! Please check your email for the 6-digit code.', { duration: 5000 });
      } else {
        // Fallback for immediate token issuance (e.g. non-students)
        if (res.data?.access) {
          setAuthSession(res.data);
          toast.success('Registration successful!');
          navigate('/');
        }
      }
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
        toast.error(err.message || 'Cannot connect to backend server. Please verify backend is running.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      toast.error('Code must be 6 digits');
      return;
    }

    setOtpError('');
    setVerifying(true);
    try {
      const { data } = await verifyOtp({
        email: registeredEmail,
        otp: cleanOtp,
      });

      setAuthSession(data);
      toast.success(data.message || 'Email verified successfully! Welcome to CanteenX.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Invalid or expired OTP. Please try again.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setOtpError('');
    try {
      const { data } = await resendOtp({ email: registeredEmail });
      setCooldown(60);
      toast.success(data.message || 'A new verification code has been sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to resend verification code.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
              Canteen<span className="text-orange-500">X</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">
            {step === 'otp' ? 'Verify Your Email' : 'Student Registration'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'otp'
              ? `Enter the 6-digit code sent to ${registeredEmail}`
              : 'Create an account to order food across Medi-Caps University canteens'}
          </p>
        </div>

        {step === 'otp' ? (
          /* ── OTP Verification Step ── */
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Check Your Gmail Inbox</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                We sent a 6-digit verification code to{' '}
                <strong className="text-orange-950 font-bold">{registeredEmail}</strong>.
                It is valid for 10 minutes.
              </p>
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 text-center uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <div className="relative max-w-xs mx-auto">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 px-10 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || otpCode.length !== 6}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
              >
                {verifying ? 'Verifying Code...' : 'Verify & Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change Email
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || resending}
                onClick={handleResendOtp}
                className={`font-bold flex items-center gap-1.5 transition ${
                  cooldown > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-orange-600 hover:text-orange-700 cursor-pointer'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        ) : (
          /* ── Registration Form Step ── */
          <>
            {errors.non_field_errors && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.non_field_errors[0]}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Atharv Sharma"
                    className="input-field pl-10"
                  />
                </div>
                {errors.full_name && <p className="text-[11px] text-red-500 mt-1">{errors.full_name[0]}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">University Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="en2024@medicaps.ac.in"
                      className="input-field pl-10"
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email[0]}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enrollment Number</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="enrollment_number"
                      required
                      value={formData.enrollment_number}
                      onChange={handleChange}
                      placeholder="EN2024CS099"
                      className="input-field pl-10 uppercase"
                    />
                  </div>
                  {errors.enrollment_number && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.enrollment_number[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="9893012345"
                    className="input-field pl-10"
                  />
                </div>
                {errors.mobile && <p className="text-[11px] text-red-500 mt-1">{errors.mobile[0]}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Create Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 chars"
                      className="input-field pl-10"
                    />
                  </div>
                  {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password[0]}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      name="password2"
                      required
                      value={formData.password2}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="input-field pl-10"
                    />
                  </div>
                  {errors.password2 && <p className="text-[11px] text-red-500 mt-1">{errors.password2[0]}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold mt-4 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Sending Verification Code...' : 'Register & Send OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 font-bold hover:underline">
                Sign In Here
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
