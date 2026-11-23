import { UtensilsCrossed, Heart, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                Canteen<span className="text-orange-500">X</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Smart Campus Food Ordering & Canteen Management System designed exclusively for Medi-Caps University, Indore.
            </p>
            <div className="flex items-center gap-2 text-xs text-orange-400 font-medium">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Indore, Madhya Pradesh, India</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-orange-400 transition">Campus Food Courts</Link></li>
              <li><Link to="/menu" className="hover:text-orange-400 transition">Today's Menu & Specials</Link></li>
              <li><Link to="/orders" className="hover:text-orange-400 transition">Track Active Order</Link></li>
              <li><Link to="/profile" className="hover:text-orange-400 transition">Student Account</Link></li>
            </ul>
          </div>

          {/* Canteen Hours */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Service Hours</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Mon – Sat: 8:30 AM – 7:30 PM</span>
              </li>
              <li>Breakfast: 8:30 AM – 11:30 AM</li>
              <li>Lunch: 12:00 PM – 3:30 PM</li>
              <li>Evening Snacks: 4:00 PM – 7:30 PM</li>
            </ul>
          </div>

          {/* System & Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Administration</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/admin/login" className="hover:text-orange-400 transition">Canteen Staff Portal</Link></li>
              <li><Link to="/admin/login" className="hover:text-orange-400 transition">Super Admin Console</Link></li>
              <li className="flex items-center gap-2 text-emerald-400 text-xs mt-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Hygienic & Certified Food Partners</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CanteenX. Medi-Caps University, Indore. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Medi-Caps University Students
          </p>
        </div>
      </div>
    </footer>
  );
}
