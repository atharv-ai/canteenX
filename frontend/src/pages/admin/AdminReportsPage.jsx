import { useState, useEffect } from 'react';
import { getReports, getAnalytics } from '../../api/admin';
import Sidebar from '../../components/admin/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  BarChart3, IndianRupee, ShoppingBag, CheckCircle2,
  XCircle, Filter, Calendar, CreditCard, Banknote
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [repRes, analRes] = await Promise.all([
        getReports(params),
        getAnalytics({ days: 30 }),
      ]);
      setReports(repRes.data);
      setAnalytics(analRes.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const paymentData = (reports?.payment_breakdown || []).map((p) => ({
    name: p.payment_method === 'cash' ? 'Cash at Counter' : 'Online Payment',
    value: p.count,
    amount: p.total,
  }));

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Sales & Financial Reports
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Comprehensive revenue statements, order fulfillment analysis, and breakdown.
            </p>
          </div>
        </div>

        {/* Date Filter Box */}
        <form
          onSubmit={handleFilterSubmit}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-wrap items-center gap-3 text-xs"
        >
          <div className="flex items-center gap-1.5 font-bold text-gray-700">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>Date Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800"
            />
          </div>

          <button
            type="submit"
            className="btn-primary py-1.5 px-4 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply Filter
          </button>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setTimeout(fetchReports, 50);
              }}
              className="text-xs text-orange-600 font-bold hover:underline ml-2 cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>

        {loading ? (
          <LoadingSpinner text="Generating sales report..." />
        ) : (
          <div className="space-y-6">
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  ₹{parseFloat(reports?.total_revenue || 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">From fulfilled orders</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {reports?.total_orders || 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Across selected range</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">Completed</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">
                  {reports?.completed_orders || 0}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-bold">Fulfilled</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">Cancelled</p>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {reports?.cancelled_orders || 0}
                </p>
                <p className="text-[11px] text-rose-500 mt-0.5">Rejected or cancelled</p>
              </div>
            </div>

            {/* Visual Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Method Breakdown Pie */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Payment Method Distribution</h3>
                <p className="text-xs text-gray-400 mb-4">Ratio of cash at counter vs online transactions</p>

                <div className="h-64">
                  {paymentData.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 pt-20">No payment data recorded yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {paymentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Best-Selling Dishes Table */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Top Selling Items</h3>
                <p className="text-xs text-gray-400 mb-4">Highest volume menu dishes</p>

                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {(analytics?.top_items || []).length === 0 ? (
                    <p className="text-center text-xs text-gray-400 pt-16">No sales recorded yet.</p>
                  ) : (
                    analytics.top_items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-400 w-4">#{idx + 1}</span>
                          <span className="font-bold text-gray-800">{item.item_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 mr-3">{item.total_qty} sold</span>
                          <span className="font-mono text-emerald-600 font-extrabold">
                            ₹{parseFloat(item.total_rev || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
