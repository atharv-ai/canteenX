import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed,
  Tags, BarChart3, LogOut, ArrowLeft, Building2
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const canteenName =
    user?.canteen_admin_profile?.canteen_name || 'Medi-Caps Central Canteen';

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Live Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Food Menu Items', path: '/admin/food', icon: UtensilsCrossed },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Sales & Reports', path: '/admin/reports', icon: BarChart3 },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-gray-950 text-gray-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-gray-900 shadow-xl">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Canteen<span className="text-orange-500">X</span>
              </span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Canteen Admin</p>
            </div>
          </div>

          {/* Assigned Canteen Pill */}
          <div className="mt-4 p-2.5 bg-gray-900 rounded-xl border border-gray-800 flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-200 truncate">{canteenName}</p>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              <span className="text-[10px] text-emerald-400 font-medium">Accepting Orders</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Sign out */}
      <div className="p-4 border-t border-gray-900 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-900 rounded-lg transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Switch to Student View
        </Link>

        <div className="p-3 bg-gray-900 rounded-xl flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
