import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { createOrder, createRazorpayOrder, verifyRazorpayPayment } from '../../api/orders';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import CartItem from '../../components/student/CartItem';
import {
  ShoppingBag, ArrowRight, ShieldCheck, CreditCard,
  Banknote, ArrowLeft, Trash2, Building2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, updateItem, removeItem, emptyCart, fetchCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const items = cart?.items || [];
  const subtotal = parseFloat(cart?.total || 0);
  const tax = subtotal * 0.0; // 0% university tax subsidy
  const total = subtotal + tax;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    setError('');
    setIsPlacingOrder(true);

    try {
      if (paymentMethod === 'online') {
        // 1. Initialize Razorpay payment order
        const { data: rzpData } = await createRazorpayOrder({
          special_instructions: specialInstructions,
        });

        const scriptLoaded = await loadRazorpayScript();

        // If mock key or script blocked, handle simulated test checkout
        if (!scriptLoaded || rzpData.is_mock || !window.Razorpay) {
          const verifyRes = await verifyRazorpayPayment({
            order_id: rzpData.order_id,
            razorpay_order_id: rzpData.razorpay_order_id,
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_signature: 'mock_signature_valid',
          });
          await fetchCart();
          toast.success(`Online Payment Verified! Order #${verifyRes.data.order_number} confirmed.`);
          navigate(`/orders/${verifyRes.data.id}`);
          return;
        }

        // Standard Razorpay Checkout Modal
        const options = {
          key: rzpData.key_id,
          amount: rzpData.amount,
          currency: rzpData.currency || 'INR',
          name: 'CanteenX Medi-Caps',
          description: `Order #${rzpData.order_number} (${rzpData.canteen_name})`,
          order_id: rzpData.razorpay_order_id,
          prefill: {
            name: rzpData.student_name,
            email: rzpData.student_email,
            contact: rzpData.student_phone,
          },
          theme: {
            color: '#ea580c',
          },
          handler: async function (response) {
            try {
              setIsPlacingOrder(true);
              const verifyRes = await verifyRazorpayPayment({
                order_id: rzpData.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await fetchCart();
              toast.success(`Payment Successful! Order #${verifyRes.data.order_number} confirmed.`);
              navigate(`/orders/${verifyRes.data.id}`);
            } catch (verErr) {
              const errMsg = verErr.response?.data?.error || 'Payment verification failed.';
              toast.error(errMsg);
            } finally {
              setIsPlacingOrder(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsPlacingOrder(false);
              toast('Payment cancelled.', { icon: 'ℹ️' });
            },
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.open();
      } else {
        // Cash payment at counter
        const payload = {
          payment_method: 'cash',
          special_instructions: specialInstructions,
        };
        const { data } = await createOrder(payload);
        await fetchCart();
        toast.success(`Order #${data.order_number} placed successfully!`);
        navigate(`/orders/${data.id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to process order. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      if (paymentMethod === 'cash') {
        setIsPlacingOrder(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Your Food Tray</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review selected items and choose your pickup & payment method.
            </p>
          </div>
          <Link
            to="/menu"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Add More Items</span>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 max-w-lg mx-auto shadow-sm my-10">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your cart is empty</h3>
            <p className="text-xs text-gray-500 mt-1">
              Explore today's specials and add delicious meals to your tray.
            </p>
            <Link
              to="/menu"
              className="btn-primary inline-flex items-center gap-2 mt-6 py-2.5 px-6 text-sm font-bold"
            >
              Browse Food Menu
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Canteen Header */}
              {cart?.canteen_name && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Ordering From</p>
                      <h4 className="text-sm font-bold text-gray-900">{cart.canteen_name}</h4>
                    </div>
                  </div>
                  <button
                    onClick={emptyCart}
                    className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Cart
                  </button>
                </div>
              )}

              {/* Items List */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
                <h3 className="font-bold text-base text-gray-900 mb-4 pb-3 border-b border-gray-100">
                  Tray Items ({items.length})
                </h3>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateItem}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Special Kitchen Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Less spicy, extra sev, no onions, pack separately..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                />
              </div>
            </div>

            {/* Right Col: Bill & Checkout */}
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-gray-900 pb-3 border-b border-gray-100">
                  Payment Method
                </h3>

                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-orange-500 bg-orange-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">Cash at Counter</span>
                        <span className="text-[11px] text-gray-500">Pay when picking up food</span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="accent-orange-500"
                    />
                  </label>

                  <label
                    onClick={() => setPaymentMethod('online')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition cursor-pointer ${
                      paymentMethod === 'online'
                        ? 'border-orange-500 bg-orange-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">Online Payment (UPI / Card)</span>
                        <span className="text-[11px] text-gray-500">Configurable campus gateway</span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="accent-orange-500"
                    />
                  </label>
                </div>
              </div>

              {/* Bill Details */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-gray-900 pb-3 border-b border-gray-100">
                  Bill Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>University Food Subsidy / Tax</span>
                    <span className="font-bold text-emerald-600">₹0.00 (Waived)</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="font-extrabold text-sm text-gray-900">Total Payable</span>
                    <span className="font-black text-xl text-orange-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 font-bold text-sm cursor-pointer disabled:opacity-50 shadow-lg shadow-orange-500/20"
                >
                  {isPlacingOrder ? 'Processing Order...' : 'Confirm & Place Order'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Direct Kitchen Integration • Medi-Caps University</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
