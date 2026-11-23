import { useState, useEffect, useRef } from 'react';
import { getAdminOrders, updateOrderStatus, verifyOrderPin } from '../../api/admin';
import Sidebar from '../../components/admin/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  ShoppingBag, Check, ChefHat, PackageCheck, X,
  Clock, RefreshCw, User, Phone, Banknote, CreditCard, AlertCircle,
  KeyRound, Volume2, VolumeX, Search, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Web Audio Synthesizer for Kitchen Chime
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const audioCtxRef = useRef(null);
  const knownOrderIdsRef = useRef(new Set());
  const isInitialLoad = useRef(true);

  // Counter PIN Verification
  const [pinInput, setPinInput] = useState('');
  const [pinChecking, setPinChecking] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Order Acceptance & Estimated Preparation Time Modal
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [orderToAccept, setOrderToAccept] = useState(null);
  const [selectedPrepMinutes, setSelectedPrepMinutes] = useState(15);
  const [customPrepInput, setCustomPrepInput] = useState('');

  const playKitchenChime = () => {
    if (!chimeEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Pleasant 2-tone melodic chime (D5 then A5)
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await getAdminOrders();
      const list = data.results || data || [];

      // Check for incoming new orders to ring kitchen chime
      if (!isInitialLoad.current && chimeEnabled) {
        const hasNewOrder = list.some(o => o.status === 'placed' && !knownOrderIdsRef.current.has(o.id));
        if (hasNewOrder) {
          playKitchenChime();
          toast.success('🔔 New student order arrived!', { duration: 4000 });
        }
      }
      isInitialLoad.current = false;
      list.forEach(o => knownOrderIdsRef.current.add(o.id));

      setOrders(list);
    } catch (err) {
      console.error('Failed to load canteen orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Fast polling for canteen staff to receive orders immediately
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [chimeEnabled]);

  const handleStatusChange = async (orderId, newStatus, reason = '', prepMinutes = null) => {
    setActionLoading(true);
    try {
      const payload = {
        status: newStatus,
        cancellation_reason: reason,
      };
      if (prepMinutes) {
        payload.estimated_prep_minutes = prepMinutes;
      }
      await updateOrderStatus(orderId, payload);
      if (newStatus === 'accepted') {
        toast.success(`Order accepted with ~${prepMinutes || 15} mins prep! Email sent to student.`, { icon: '📧' });
      } else if (newStatus === 'ready') {
        toast.success('Order marked ready! Pickup alert sent to student.', { icon: '🔔' });
      } else {
        toast.success(`Order marked as ${newStatus.replace('_', ' ')}!`);
      }
      await fetchOrders();
      if (acceptModalOpen) {
        setAcceptModalOpen(false);
        setOrderToAccept(null);
      }
      if (cancelModalOpen) {
        setCancelModalOpen(false);
        setCancellationReason('');
      }
      if (pinModalOpen && verifiedOrder?.id === orderId) {
        setPinModalOpen(false);
        setVerifiedOrder(null);
        setPinInput('');
      }
    } catch (err) {
      toast.error('Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  const openAcceptModal = (order) => {
    setOrderToAccept(order);
    setSelectedPrepMinutes(15);
    setCustomPrepInput('');
    setAcceptModalOpen(true);
  };

  const handleConfirmAccept = () => {
    if (!orderToAccept) return;
    const minutes = customPrepInput ? parseInt(customPrepInput, 10) : selectedPrepMinutes;
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
      toast.error('Please enter a valid preparation time between 1 and 180 minutes.');
      return;
    }
    handleStatusChange(orderToAccept.id, 'accepted', '', minutes);
  };

  const handleVerifyPin = async (e) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      toast.error('Please enter a 4-digit pickup PIN');
      return;
    }
    setPinChecking(true);
    try {
      const { data } = await verifyOrderPin({ pickup_pin: pinInput.trim() });
      setVerifiedOrder(data);
      setPinModalOpen(true);
      toast.success(`PIN verified for Order #${data.order_number}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No matching order found for this PIN');
    } finally {
      setPinChecking(false);
    }
  };

  const openCancelModal = (orderId) => {
    setSelectedOrderId(orderId);
    setCancellationReason('Kitchen item out of stock');
    setCancelModalOpen(true);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesTab = (() => {
      if (activeTab === 'all') return true;
      if (activeTab === 'placed') return o.status === 'placed';
      if (activeTab === 'accepted') return o.status === 'accepted';
      if (activeTab === 'preparing') return o.status === 'preparing';
      if (activeTab === 'ready') return o.status === 'ready';
      if (activeTab === 'completed') return o.status === 'completed';
      if (activeTab === 'cancelled') return o.status === 'cancelled';
      return true;
    })();

    if (!matchesTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = (o.order_number || '').toLowerCase().includes(q);
      const studentMatch = (o.student_name || '').toLowerCase().includes(q);
      const pinMatch = (o.pickup_pin || '').toLowerCase().includes(q);
      return numMatch || studentMatch || pinMatch;
    }

    return true;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Live Kitchen Orders
              <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-bold">KDS</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Process incoming orders, track preparation stages, and verify student pickup PINs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !chimeEnabled;
                setChimeEnabled(next);
                if (next) playKitchenChime();
                toast(next ? 'Kitchen chime active' : 'Kitchen chime muted', { icon: next ? '🔔' : '🔕' });
              }}
              className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold cursor-pointer transition ${
                chimeEnabled ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}
              title={chimeEnabled ? 'Kitchen chime active' : 'Kitchen chime muted'}
            >
              {chimeEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{chimeEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            <button
              onClick={fetchOrders}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Polling
            </span>
          </div>
        </div>

        {/* Counter Pickup PIN Quick-Verifier & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PIN Verifier Card */}
          <form
            onSubmit={handleVerifyPin}
            className="md:col-span-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5">
                  Counter PIN Verification
                  <span className="text-[10px] bg-white/30 px-2 py-0.5 rounded-md font-mono">DIGITAL PASS</span>
                </h3>
                <p className="text-xs text-orange-100">
                  Enter student's 4-digit PIN to verify meal token & hand over food instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                maxLength={6}
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-24 text-center text-sm font-mono font-black tracking-widest px-3 py-2 bg-white text-gray-900 rounded-xl border-0 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="submit"
                disabled={pinChecking}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer transition shadow-sm whitespace-nowrap disabled:opacity-50"
              >
                {pinChecking ? 'Checking...' : 'Verify PIN'}
              </button>
            </div>
          </form>

          {/* Search by Order # or Student */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center gap-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search order #, student, or PIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent border-0 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
          {[
            { key: 'all', label: `All (${orders.length})` },
            { key: 'placed', label: `New Placed (${orders.filter((o) => o.status === 'placed').length})`, alert: true },
            { key: 'accepted', label: `Accepted (${orders.filter((o) => o.status === 'accepted').length})` },
            { key: 'preparing', label: `Preparing (${orders.filter((o) => o.status === 'preparing').length})` },
            { key: 'ready', label: `Ready for Pickup (${orders.filter((o) => o.status === 'ready').length})` },
            { key: 'completed', label: `Completed (${orders.filter((o) => o.status === 'completed').length})` },
            { key: 'cancelled', label: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Orders Stream */}
        {loading ? (
          <LoadingSpinner text="Fetching kitchen queue..." />
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 my-8">
            <span className="text-4xl block mb-2">🧑‍🍳</span>
            <h3 className="text-base font-bold text-gray-900">No {activeTab !== 'all' ? activeTab : ''} orders currently</h3>
            <p className="text-xs text-gray-400 mt-1">Incoming student orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isNew = order.status === 'placed';

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-xs hover:shadow-md ${
                    isNew ? 'border-orange-300 ring-2 ring-orange-200 bg-orange-50/20' : 'border-gray-200'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-base font-black text-gray-900">
                        #{order.order_number}
                      </span>
                      <Badge variant={order.status} size="md">
                        {order.status_display || order.status}
                      </Badge>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1 text-gray-600">
                        {order.payment_method === 'cash' ? (
                          <Banknote className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                        )}
                        <span className="capitalize">{order.payment_method}</span>
                      </span>
                      <span className="text-lg font-black text-gray-900">
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Student & Dishes Middle Section */}
                  <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Student Info */}
                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                      <p className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">Student Info</p>
                      <p className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-orange-500" />
                        {order.student_name || 'Atharv Sharma'}
                      </p>
                      <p className="text-gray-500">ID: {order.student_enrollment || 'EN2024CS001'}</p>
                      {order.student_mobile && (
                        <p className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {order.student_mobile}
                        </p>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="md:col-span-2 space-y-2">
                      <p className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">Items to Prepare</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-gray-900">
                              <span className="w-5 h-5 inline-flex items-center justify-center bg-gray-900 text-white rounded-md text-[11px] font-black mr-2">
                                {item.quantity}
                              </span>
                              {item.item_name}
                            </span>
                            <span className="text-gray-500 font-mono font-medium">
                              ₹{parseFloat(item.subtotal).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.estimated_prep_minutes && (
                        <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Est. Prep: {order.estimated_prep_minutes} mins</span>
                          {order.estimated_ready_at && (
                            <span className="text-gray-500 font-normal">
                              (Ready by {new Date(order.estimated_ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          )}
                        </div>
                      )}

                      {order.special_instructions && (
                        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 p-2.5 rounded-xl mt-2">
                          <span className="font-bold">Instructions:</span> {order.special_instructions}
                        </p>
                      )}

                      {order.cancellation_reason && (
                        <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2 rounded-xl">
                          <span className="font-bold">Cancelled:</span> {order.cancellation_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons for Staff */}
                  <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2.5">
                    {order.status === 'placed' && (
                      <>
                        <button
                          onClick={() => openCancelModal(order.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Reject Order
                        </button>
                        <button
                          onClick={() => openAcceptModal(order)}
                          disabled={actionLoading}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Accept order and set preparation time"
                        >
                          <Check className="w-4 h-4" />
                          Accept & Set Prep Time
                        </button>
                      </>
                    )}

                    {order.status === 'accepted' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <ChefHat className="w-4 h-4" />
                        Start Cooking / Preparing
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <PackageCheck className="w-4 h-4" />
                        Ready for Pickup
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'completed')}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Handed Over / Completed
                      </button>
                    )}

                    {['completed', 'cancelled'].includes(order.status) && (
                      <span className="text-xs text-gray-400 font-bold italic">
                        No further action needed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Accept Order & Set Preparation Time Modal */}
        <Modal
          isOpen={acceptModalOpen}
          onClose={() => setAcceptModalOpen(false)}
          title={`Accept Order #${orderToAccept?.order_number || ''}`}
        >
          {orderToAccept && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-emerald-800">
                  Confirming order for <span className="underline">{orderToAccept.student_name}</span>
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Set the estimated kitchen preparation time. This will be sent in the student's confirmation email and displayed on their live token pass.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Estimated Prep Time (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setSelectedPrepMinutes(mins);
                        setCustomPrepInput('');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        !customPrepInput && selectedPrepMinutes === mins
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={customPrepInput}
                    onChange={(e) => setCustomPrepInput(e.target.value)}
                    placeholder="Or enter custom minutes (e.g. 25)..."
                    className="w-full input-field text-xs pr-16"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-gray-400">mins</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                <span>Estimated Ready Around:</span>
                <span className="font-mono font-bold text-gray-900">
                  {(() => {
                    const m = customPrepInput ? parseInt(customPrepInput, 10) || 15 : selectedPrepMinutes;
                    const d = new Date(Date.now() + m * 60000);
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  })()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAcceptModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAccept}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Confirm & Notify Student
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Reject/Cancel Reason Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Reject / Cancel Order"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Please enter the reason for cancellation. The student will receive a live notification.
            </p>
            <textarea
              rows={3}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Out of stock, kitchen closing soon, item unavailable..."
              className="w-full input-field text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(selectedOrderId, 'cancelled', cancellationReason)}
                disabled={!cancellationReason.trim()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </Modal>

        {/* Counter PIN Verified Order Modal */}
        <Modal
          isOpen={pinModalOpen}
          onClose={() => setPinModalOpen(false)}
          title="Campus Meal Pass Verified"
        >
          {verifiedOrder && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider block">
                    Student Pickup PIN Matched
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-900 tracking-wider">
                    #{verifiedOrder.order_number}
                  </span>
                </div>
                <Badge variant={verifiedOrder.status} size="md">
                  {verifiedOrder.status_display || verifiedOrder.status}
                </Badge>
              </div>

              {/* Student Details */}
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 text-xs space-y-1">
                <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-500" />
                  {verifiedOrder.student_name}
                </p>
                <p className="text-gray-500">Enrollment: {verifiedOrder.student_enrollment}</p>
                {verifiedOrder.student_mobile && (
                  <p className="text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {verifiedOrder.student_mobile}
                  </p>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Items in this order:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {verifiedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-gray-900">
                        <span className="w-5 h-5 inline-flex items-center justify-center bg-gray-900 text-white rounded-md text-[11px] font-black mr-2">
                          {item.quantity}
                        </span>
                        {item.item_name}
                      </span>
                      <span className="font-mono text-gray-600">₹{parseFloat(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Total Paid:</span>
                <span className="text-base font-black text-gray-900">
                  ₹{parseFloat(verifiedOrder.total_amount).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-100"
                >
                  Close
                </button>
                {verifiedOrder.status !== 'completed' && verifiedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(verifiedOrder.id, 'completed')}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Mark as Handed Over & Complete
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
