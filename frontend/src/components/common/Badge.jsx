export default function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-orange-100 text-orange-700 font-medium',
    success: 'bg-emerald-100 text-emerald-800 font-medium',
    warning: 'bg-amber-100 text-amber-800 font-medium',
    danger: 'bg-red-100 text-red-700 font-medium',
    info: 'bg-blue-100 text-blue-700 font-medium',
    placed: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
    accepted: 'bg-blue-100 text-blue-800 border border-blue-200 font-bold',
    preparing: 'bg-orange-100 text-orange-800 border border-orange-200 font-bold',
    ready: 'bg-purple-100 text-purple-800 border border-purple-200 font-bold',
    completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold',
    cancelled: 'bg-rose-100 text-rose-800 border border-rose-200 font-bold',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs rounded-full',
    md: 'px-2.5 py-1 text-xs rounded-full',
    lg: 'px-3 py-1.5 text-sm rounded-lg',
  };

  return (
    <span className={`inline-flex items-center font-medium ${variants[variant] || variants.default} ${sizes[size]}`}>
      {children}
    </span>
  );
}
