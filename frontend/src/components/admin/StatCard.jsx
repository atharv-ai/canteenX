export default function StatCard({ title, value, icon: Icon, color = 'orange', subtitle }) {
  const colorMap = {
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${scheme.bg} ${scheme.text}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
