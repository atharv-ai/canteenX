import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  UtensilsCrossed, ShoppingBag, Bell, User, LogOut,
  Menu as MenuIcon, X, LayoutDashboard, Shield
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isStudent, isAdmin, isSuperAdmin } = useAuth();
  const { itemCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-gray-900">
                  Canteen<span className="text-orange-500">X</span>
                </span>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">MU</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">Medi-Caps University</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {isStudent && (
                <>
                  <Link
                    to="/"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/menu"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/menu') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Food Menu
                  </Link>
                  <Link
                    to="/orders"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/orders') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Orders
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-orange-600 bg-orange-50 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Canteen Dashboard
                </Link>
              )}

              {isSuperAdmin && (
                <Link
                  to="/superadmin"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4" />
                  Super Admin
                </Link>
              )}
            </nav>
          )}

          {/* Right Action Icons */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Cart Button (for students) */}
              {isStudent && (
                <Link
                  to="/cart"
                  className="relative p-2.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                  title="Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative p-2.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute 1 top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-sm text-gray-400">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) markAsRead(n.id);
                              if (n.related_order) navigate(isAdmin ? '/admin/orders' : `/orders/${n.related_order}`);
                              setNotificationsOpen(false);
                            }}
                            className={`p-3.5 hover:bg-gray-50 transition cursor-pointer ${!n.is_read ? 'bg-orange-50/40' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1"></span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1.5 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white font-bold text-xs flex items-center justify-center">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[120px]">{user.full_name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{user.role?.replace('_', ' ')}</p>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900">{user.full_name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">
                        {user.role?.replace('_', ' ')}
                      </span>
                    </div>

                    {isStudent && (
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        My Profile & Settings
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-orange-600 hover:bg-orange-50 transition font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Canteen Admin Panel
                      </Link>
                    )}

                    {isSuperAdmin && (
                      <Link
                        to="/superadmin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-indigo-600 hover:bg-indigo-50 transition font-medium"
                      >
                        <Shield className="w-4 h-4" />
                        Super Admin Panel
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition cursor-pointer font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900">
                Log In
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-1">
          {isStudent && (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Home
              </Link>
              <Link
                to="/menu"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Food Menu
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                My Orders
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Profile & Settings
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-orange-600 bg-orange-50"
            >
              Canteen Dashboard
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              to="/superadmin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50"
            >
              Super Admin Panel
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
