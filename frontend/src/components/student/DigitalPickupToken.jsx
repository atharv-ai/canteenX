import { QrCode, ShieldCheck, Clock, MapPin, Sparkles, ChefHat, CheckCircle2 } from 'lucide-react';

export default function DigitalPickupToken({ order }) {
  if (!order) return null;

  const pin = order.pickup_pin || '4821';
  const isPlaced = order.status === 'placed';
  const isAccepted = order.status === 'accepted';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'ready';
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 text-white rounded-3xl p-6 sm:p-8 border border-orange-500/30 shadow-2xl relative overflow-hidden my-4">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-950/80 border border-orange-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Digital Meal Pass • Medi-Caps University
            </span>
          </div>
          <h3 className="text-xl font-black mt-2 text-white">Campus Food Token</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {isPlaced
              ? `Order received by ${order.canteen_name || 'canteen'}. Awaiting owner acceptance & email confirmation.`
              : 'Show this token or 4-digit PIN at the counter to claim your food.'}
          </p>
        </div>

        {/* Status Pill */}
        <div className="self-start sm:self-auto">
          {isCancelled ? (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
              Order Cancelled
            </span>
          ) : isCompleted ? (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Picked Up & Fulfilled
            </span>
          ) : isReady ? (
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-purple-500 text-white shadow-lg shadow-purple-500/30 animate-bounce flex items-center gap-1.5">
              🔔 READY FOR PICKUP NOW!
            </span>
          ) : isPreparing ? (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
              <ChefHat className="w-4 h-4" /> Cooking in Progress
            </span>
          ) : isAccepted ? (
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Confirmed & Accepted by Owner
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500/30 text-amber-300 border border-amber-400/50 flex items-center gap-1.5 animate-pulse">
              <Clock className="w-4 h-4" /> ⏳ Awaiting Canteen Acceptance
            </span>
          )}
        </div>
      </div>

      {/* Awaiting Acceptance Banner */}
      {isPlaced && (
        <div className="relative z-10 mt-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl p-3.5 text-xs text-amber-200 flex items-center gap-2.5">
          <span className="text-lg">⏳</span>
          <p className="leading-relaxed">
            <strong>Order Placed • Waiting for Owner Acceptance:</strong> Canteen staff is currently reviewing the kitchen capacity. As soon as the canteen accepts your order, you will receive an official confirmation email at <span className="underline font-bold">{order.student_email || 'your college email'}</span>.
          </p>
        </div>
      )}

      {/* Estimated Prep Time Banner for Active Orders */}
      {(isAccepted || isPreparing) && order.estimated_prep_minutes && (
        <div className="relative z-10 mt-4 bg-orange-950/70 border border-orange-500/50 rounded-2xl p-3.5 text-xs text-orange-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⏱️</span>
            <div>
              <p className="font-bold text-white text-sm">
                Estimated Prep Time: ~{order.estimated_prep_minutes} minutes
              </p>
              <p className="text-[11px] text-orange-300 mt-0.5">
                The kitchen is preparing your dishes fresh.
              </p>
            </div>
          </div>
          {order.estimated_ready_at && (
            <div className="bg-orange-900/80 border border-orange-500/40 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-amber-200">
              Ready around ~{new Date(order.estimated_ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      )}

      {/* Main Token Body */}
      <div className="relative z-10 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left: 4-Digit Pickup PIN */}
        <div className={`rounded-2xl p-5 text-center flex flex-col justify-center items-center ${
          isPlaced ? 'bg-amber-950/40 border border-amber-500/30' : 'bg-gray-900/90 border border-gray-800'
        }`}>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {isPlaced ? 'Pickup PIN (Pending)' : 'Counter Pickup PIN'}
          </span>
          <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 tracking-widest my-2 font-mono">
            {pin}
          </div>
          <span className="text-[10px] text-gray-400">
            {isPlaced ? 'Activates on canteen acceptance' : 'Call out this PIN to counter staff'}
          </span>
        </div>

        {/* Center: Simulated QR Code */}
        <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-md">
          {/* SVG QR Code Pattern */}
          <svg className="w-32 h-32 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
            <rect x="0" y="0" width="30" height="30" rx="3" />
            <rect x="5" y="5" width="20" height="20" fill="white" />
            <rect x="10" y="10" width="10" height="10" />

            <rect x="70" y="0" width="30" height="30" rx="3" />
            <rect x="75" y="5" width="20" height="20" fill="white" />
            <rect x="80" y="10" width="10" height="10" />

            <rect x="0" y="70" width="30" height="30" rx="3" />
            <rect x="5" y="75" width="20" height="20" fill="white" />
            <rect x="10" y="80" width="10" height="10" />

            {/* Pattern dots */}
            <rect x="40" y="10" width="10" height="10" />
            <rect x="50" y="20" width="10" height="10" />
            <rect x="40" y="40" width="20" height="20" />
            <rect x="70" y="40" width="10" height="10" />
            <rect x="80" y="50" width="10" height="10" />
            <rect x="10" y="40" width="10" height="10" />
            <rect x="20" y="50" width="10" height="10" />
            <rect x="40" y="70" width="10" height="10" />
            <rect x="60" y="70" width="10" height="10" />
            <rect x="50" y="80" width="10" height="10" />
            <rect x="70" y="80" width="20" height="10" />
          </svg>
          <span className="text-[10px] font-mono font-bold text-gray-700 mt-2">
            #{order.order_number}
          </span>
          <span className="text-[9px] text-gray-400">Scan at Counter Scanner</span>
        </div>

        {/* Right: Counter & Student Meta */}
        <div className="space-y-3 text-xs">
          <div className="bg-gray-900/60 border border-gray-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Pickup Counter</span>
            <p className="font-extrabold text-sm text-white flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-4 h-4 text-orange-400" />
              {order.canteen_name || 'Central Canteen'}
            </p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 p-3.5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Student ID</span>
              <span className="font-mono font-bold text-gray-200">{order.student_enrollment || 'EN2024CS001'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Total Items</span>
              <span className="font-bold text-orange-400">{order.items?.length || 1} Dish(es)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
