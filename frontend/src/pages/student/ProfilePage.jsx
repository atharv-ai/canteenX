import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, changePassword } from '../../api/auth';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  User, Mail, Phone, Hash, Lock, LogOut,
  Save, CheckCircle2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');

  // Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadFresh() {
      try {
        setLoading(true);
        const { data } = await getProfile();
        setFullName(data.full_name || '');
        setMobile(data.mobile || '');
        updateUser(data);
      } catch (e) {
        console.error('Failed to fetch profile', e);
      } finally {
        setLoading(false);
      }
    }
    loadFresh();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await updateProfile({ full_name: fullName, mobile });
      updateUser(data);
      toast.success('Profile details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.mobile?.[0] || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setChangingPass(true);
    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.old_password?.[0] ||
        err.response?.data?.new_password?.[0] ||
        'Failed to change password. Please check your current password.';
      toast.error(msg);
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Student Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your university account, contact number, and security settings.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading profile details..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Card: Summary */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>

              <div>
                <h3 className="font-black text-lg text-gray-900">{user?.full_name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 uppercase tracking-wide">
                  Student Member
                </span>
              </div>

              <div className="w-full pt-4 border-t border-gray-100 space-y-2 text-xs text-left">
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="font-semibold">Enrollment:</span>
                  <span className="font-mono font-bold text-gray-900 ml-auto">
                    {user?.student_profile?.enrollment_number || 'EN2024CS001'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="font-semibold">Email:</span>
                  <span className="truncate text-gray-900 ml-auto">{user?.email}</span>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full mt-4 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Account
              </button>
            </div>

            {/* Right 2 Cols: Edit Details & Security */}
            <div className="md:col-span-2 space-y-6">
              {/* Personal Information Form */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                <h3 className="font-bold text-base text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <span>Personal Details</span>
                </h3>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Contact</label>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="9893012345"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Enrollment Number (Permanent)</label>
                      <input
                        type="text"
                        disabled
                        value={user?.student_profile?.enrollment_number || 'EN2024CS001'}
                        className="input-field text-sm bg-gray-100 text-gray-500 cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                  </button>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                <h3 className="font-bold text-base text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-500" />
                  <span>Update Password</span>
                </h3>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="input-field text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={changingPass}
                    className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {changingPass ? 'Updating Password...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
