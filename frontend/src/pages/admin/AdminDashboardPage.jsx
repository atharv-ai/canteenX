import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getAnalytics } from '../../api/admin';
import Sidebar from '../../components/admin/Sidebar';
import StatCard from '../../components/admin/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ShoppingBag, Clock, ChefHat, CheckCircle2,
  IndianRupee, UtensilsCrossed, ArrowRight, TrendingUp, Flame
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashRes, analRes] = await Promise.all([
          getDashboardStats(),
          getAnalytics({ days: 7 }),
        ]);
        setStats(dashRes.data);
        setAnalytics(analRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <LoadingSpinner text="Loading real-time canteen metrics..." />
        </div>
      </div>
    );
  }

  const timelineData = analytics?.timeline || [];
  const topItems = stats?.popular_items || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Canteen Live Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Real-time campus order stream, kitchen volume, and financial performance.
            </p>
          </div>

          <Link
            to="/admin/orders"
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Manage Live Kitchen Orders</span>
          </Link>
        </div>

        {/* 6 Real Database Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Orders"
            value={stats?.today_orders_count || 0}
            icon={ShoppingBag}
            color="orange"
            subtitle={`${stats?.completed_today || 0} completed`}
          />
          <StatCard
            title="Pending Orders"
            value={stats?.pending_orders || 0}
            icon={Clock}
            color="blue"
            subtitle="Requires immediate kitchen action"
          />
          <StatCard
            title="In Preparation"
            value={stats?.preparing_orders || 0}
            icon={ChefHat}
            color="amber"
            subtitle="Currently cooking in kitchen"
          />
          <StatCard
            title="Today's Sales"
            value={`₹${parseFloat(stats?.revenue_today || 0).toFixed(2)}`}
            icon={IndianRupee}
            color="emerald"
            subtitle={`Month: ₹${parseFloat(stats?.revenue_month || 0).toFixed(2)}`}
          />
        </div>

        {/* Secondary Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Ready for Pickup</p>
              <p className="text-xl font-black text-purple-700 mt-0.5">{stats?.ready_orders || 0}</p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              ✓
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Active Menu Items</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">
                {stats?.active_items_count || 0} / {stats?.total_items_count || 0}
              </p>
            </div>
            <UtensilsCrossed className="w-6 h-6 text-gray-400" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Monthly Total Sales</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">
                ₹{parseFloat(stats?.revenue_month || 0).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900">7-Day Sales Revenue (₹)</h3>
                <p className="text-[11px] text-gray-400">Total daily earnings from completed orders</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Live Data
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#888' }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    formatter={(val) => [`₹${val}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Volume Chart */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900">7-Day Order Volume</h3>
                <p className="text-[11px] text-gray-400">Number of campus orders processed per day</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Volume
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#888' }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    formatter={(val) => [val, 'Orders']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="orders" fill="#1e293b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Most Popular Dishes */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <h3 className="text-base font-bold text-gray-900">Best-Selling Menu Dishes</h3>
            </div>
            <Link to="/admin/food" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
              Manage Food Items <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {topItems.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No dishes sold yet today.</p>
            ) : (
              topItems.map((item, index) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-400">₹{parseFloat(item.price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                      {item.total_orders} orders placed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
