import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getSuperAdminStats, getSuperAdminUsers, toggleUserStatus,
  createCanteenAdmin, getSuperAdminCanteens, createCanteen
} from '../../api/admin';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import {
  Shield, Users, Building2, ShoppingBag, IndianRupee,
  Plus, Check, X, ArrowLeft, LogOut, Search, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'canteens'
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals
  const [canteenAdminModalOpen, setCanteenAdminModalOpen] = useState(false);
  const [newCanteenModalOpen, setNewCanteenModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Canteen Admin Form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminCanteenId, setAdminCanteenId] = useState('');

  // New Canteen Form
  const [canteenName, setCanteenName] = useState('');
  const [canteenLocation, setCanteenLocation] = useState('');
  const [canteenDescription, setCanteenDescription] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, canteensRes] = await Promise.all([
        getSuperAdminStats(),
        getSuperAdminUsers(),
        getSuperAdminCanteens(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.results || usersRes.data || []);
      setCanteens(canteensRes.data.results || canteensRes.data || []);
    } catch (err) {
      console.error('Failed to load superadmin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleToggleUser = async (u) => {
    try {
      await toggleUserStatus(u.id);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, is_active: !item.is_active } : item))
      );
      toast.success(`User ${u.full_name} is now ${!u.is_active ? 'Active' : 'Deactivated'}`);
    } catch {
      toast.error('Failed to toggle user status.');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCanteenAdmin({
        email: adminEmail,
        full_name: adminName,
        password: adminPassword,
        mobile: adminMobile,
        canteen_id: adminCanteenId,
      });
      toast.success('Canteen administrator account created successfully!');
      setCanteenAdminModalOpen(false);
      setAdminEmail('');
      setAdminName('');
      setAdminPassword('');
      setAdminMobile('');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.email?.[0] || err.response?.data?.error || 'Failed to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCanteen = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCanteen({
        name: canteenName,
        location: canteenLocation,
        description: canteenDescription,
        is_active: true,
      });
      toast.success('New canteen added to university network!');
      setNewCanteenModalOpen(false);
      setCanteenName('');
      setCanteenLocation('');
      setCanteenDescription('');
      await loadAll();
    } catch (err) {
      toast.error('Failed to create canteen.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.student_profile?.enrollment_number?.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Top Header */}
      <header className="border-b border-gray-900 bg-gray-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">
                Canteen<span className="text-orange-500">X</span> Super Admin
              </span>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                Medi-Caps University Indore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/admin/food"
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Manage Food Dishes</span>
            </Link>

            <Link
              to="/"
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Campus View</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            {[
              { key: 'overview', label: 'System Overview' },
              { key: 'users', label: `Users & Roles (${users.length})` },
              { key: 'canteens', label: `Canteens (${canteens.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewCanteenModalOpen(true)}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Canteen
            </button>
            <button
              onClick={() => {
                setAdminCanteenId(canteens[0]?.id || '');
                setCanteenAdminModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Canteen Admin
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading system analytics..." />
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* 5 Macro Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">
                      ₹{parseFloat(stats?.total_revenue || 0).toFixed(2)}
                    </p>
                    <span className="text-[10px] text-gray-500">System-wide sales</span>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {stats?.total_orders || 0}
                    </p>
                    <span className="text-[10px] text-gray-500">Processed across campus</span>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Students</p>
                    <p className="text-2xl font-black text-indigo-400 mt-1">
                      {stats?.total_students || 0}
                    </p>
                    <span className="text-[10px] text-gray-500">Registered student users</span>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Canteen Admins</p>
                    <p className="text-2xl font-black text-orange-400 mt-1">
                      {stats?.total_canteen_admins || 0}
                    </p>
                    <span className="text-[10px] text-gray-500">Authorized staff</span>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Campus Canteens</p>
                    <p className="text-2xl font-black text-purple-400 mt-1">
                      {stats?.total_canteens || 0}
                    </p>
                    <span className="text-[10px] text-gray-500">Food outlets</span>
                  </div>
                </div>

                {/* Canteens Revenue Breakdown */}
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                  <h3 className="font-extrabold text-base text-white mb-4">Canteen Network Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(stats?.canteens || []).map((c) => (
                      <div
                        key={c.id}
                        className="p-5 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{c.name}</h4>
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">📍 {c.location}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Orders: <span className="text-white font-bold">{c.total_orders}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Sales</span>
                          <span className="text-lg font-black text-emerald-400">
                            ₹{parseFloat(c.revenue || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Search & Filter */}
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="Search by name, email, or enrollment..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 cursor-pointer"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="canteen_admin">Canteen Admins</option>
                    <option value="super_admin">Super Admins</option>
                  </select>
                </div>

                {/* Users Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800 font-bold">
                      <tr>
                        <th className="px-6 py-3.5">User</th>
                        <th className="px-4 py-3.5">Role</th>
                        <th className="px-4 py-3.5">Enrollment / Canteen</th>
                        <th className="px-4 py-3.5">Mobile</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-800/40 transition">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-white block">{u.full_name}</span>
                              <span className="text-[11px] text-gray-400 font-mono">{u.email}</span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === 'super_admin'
                                  ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                  : u.role === 'canteen_admin'
                                  ? 'bg-orange-950 text-orange-400 border border-orange-800'
                                  : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                              }`}
                            >
                              {u.role?.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-gray-400 font-mono">
                            {u.student_profile?.enrollment_number ||
                              u.canteen_admin_profile?.canteen_name ||
                              'N/A'}
                          </td>

                          <td className="px-4 py-4 text-gray-400 font-mono">
                            {u.mobile || '—'}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.is_active
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-red-950 text-red-400 border border-red-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.is_active ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              {u.is_active ? 'Active' : 'Suspended'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            {u.role !== 'super_admin' && (
                              <button
                                onClick={() => handleToggleUser(u)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  u.is_active
                                    ? 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-800'
                                    : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800'
                                }`}
                              >
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CANTEENS TAB */}
            {activeTab === 'canteens' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {canteens.map((c) => (
                  <div
                    key={c.id}
                    className="p-6 bg-gray-900 border border-gray-800 rounded-3xl space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-base text-white">{c.name}</h4>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">
                            Operational
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">{c.description}</p>
                    <p className="text-xs text-gray-300 font-medium">📍 {c.location}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal: Create Canteen Admin */}
        <Modal
          isOpen={canteenAdminModalOpen}
          onClose={() => setCanteenAdminModalOpen(false)}
          title="Create Canteen Administrator"
        >
          <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs text-gray-900">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Manager Name"
                className="input-field text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Staff Email *</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="manager@medicaps.ac.in"
                className="input-field text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Assign Canteen *</label>
              <select
                required
                value={adminCanteenId}
                onChange={(e) => setAdminCanteenId(e.target.value)}
                className="input-field text-xs cursor-pointer text-gray-900"
              >
                <option value="">Select Canteen</option>
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="input-field text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contact Mobile</label>
                <input
                  type="tel"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  placeholder="9826012345"
                  className="input-field text-xs text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCanteenAdminModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2 px-5 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Create Canteen */}
        <Modal
          isOpen={newCanteenModalOpen}
          onClose={() => setNewCanteenModalOpen(false)}
          title="Add New Campus Canteen"
        >
          <form onSubmit={handleCreateCanteen} className="space-y-4 text-xs text-gray-900">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Canteen / Cafeteria Name *</label>
              <input
                type="text"
                required
                value={canteenName}
                onChange={(e) => setCanteenName(e.target.value)}
                placeholder="e.g. Science Block Canteen"
                className="input-field text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Campus Location *</label>
              <input
                type="text"
                required
                value={canteenLocation}
                onChange={(e) => setCanteenLocation(e.target.value)}
                placeholder="e.g. Science Block Ground Floor, Medi-Caps Campus"
                className="input-field text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={canteenDescription}
                onChange={(e) => setCanteenDescription(e.target.value)}
                placeholder="Specialty meals, seating capacity, departments served..."
                className="input-field text-xs text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setNewCanteenModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2 px-5 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Canteen'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
