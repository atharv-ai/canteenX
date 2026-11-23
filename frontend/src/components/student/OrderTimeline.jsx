import { CheckCircle2, Clock, ChefHat, PackageCheck, Check, AlertCircle } from 'lucide-react';

const STEPS = [
  { key: 'placed', label: 'Order Placed', sublabel: 'Awaiting Acceptance', icon: Clock },
  { key: 'accepted', label: 'Order Accepted', sublabel: 'Confirmed by Owner', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', sublabel: 'In Kitchen', icon: ChefHat },
  { key: 'ready', label: 'Ready for Pickup', sublabel: 'Collect at Counter', icon: PackageCheck },
  { key: 'completed', label: 'Completed', sublabel: 'Order Handed Over', icon: Check },
];

export default function OrderTimeline({ status, cancellationReason }) {
  if (status === 'cancelled') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center my-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-rose-900">This Order was Cancelled</h4>
        {cancellationReason && (
          <p className="text-sm text-rose-600 mt-1 max-w-md mx-auto">
            Reason: <span className="font-medium">{cancellationReason}</span>
          </p>
        )}
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="py-6 px-2 sm:px-6">
      <div className="relative">
        {/* Background Connecting Bar */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-gray-200 -z-0">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative z-10 flex items-start justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center max-w-[80px] sm:max-w-[100px]">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-orange-500 text-white ring-4 ring-orange-100 scale-110 shadow-md'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-bold mt-2 leading-tight ${
                    isCurrent
                      ? 'text-orange-600'
                      : isCompleted
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[9px] text-gray-400 font-medium hidden sm:block mt-0.5">
                  {step.sublabel}
                </span>
                {isCurrent && (
                  <span className="text-[9px] text-orange-500 font-extrabold uppercase mt-0.5 tracking-wider animate-pulse">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
