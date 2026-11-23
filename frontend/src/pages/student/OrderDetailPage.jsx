import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderDetail, rateOrder } from '../../api/orders';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import OrderTimeline from '../../components/student/OrderTimeline';
import DigitalPickupToken from '../../components/student/DigitalPickupToken';
import OrderReceiptModal from '../../components/student/OrderReceiptModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import {
  ArrowLeft, Building2, Clock, Banknote, CreditCard,
  AlertTriangle, Receipt, Star, Send, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Rating State
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchOrder = async () => {
    try {
      const { data } = await getOrderDetail(id);
      setOrder(data);
      if (data.rating) setSelectedRating(data.rating);
      if (data.review) setReviewText(data.review);
    } catch (err) {
      console.error('Failed to load order', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.post(`/api/orders/${id}/cancel/`, { reason: 'Cancelled by student' });
      toast.success('Order cancelled successfully.');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      await rateOrder(id, {
        rating: selectedRating,
        review: reviewText,
      });
      toast.success('Thank you for rating your food experience!');
      fetchOrder();
    } catch (err) {
      toast.error('Failed to save rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Navbar />
        <LoadingSpinner text="Loading order details..." />
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-gray-500 font-bold">Order not found.</p>
          <Link to="/orders" className="btn-primary mt-4 inline-block text-xs font-bold">
            Back to Orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Top Back Link & Receipt Action */}
        <div className="flex items-center justify-between">
          <Link
            to="/orders"
            className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Orders</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReceiptModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:border-orange-500 hover:text-orange-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded-md">
              Live updates active
            </span>
          </div>
        </div>

        {/* Digital Pickup Token with QR Code & PIN */}
        <DigitalPickupToken order={order} />

        {/* Order Card Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-orange-950 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                Medi-Caps Campus Order
              </p>
              <h1 className="text-2xl font-black mt-1">#{order.order_number}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {new Date(order.created_at).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
              <Badge variant={order.status} size="lg">
                {order.status === 'placed' ? 'Order Placed • Awaiting Acceptance' : (order.status_display || order.status)}
              </Badge>
              <span className="text-xs text-gray-300">
                {order.canteen_name || 'Central Canteen'}
              </span>
            </div>
          </div>

          {/* Live Order Timeline */}
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Order Progress
            </h3>
            <OrderTimeline
              status={order.status}
              cancellationReason={order.cancellation_reason}
            />
          </div>

          {/* Order Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Canteen Pickup Location Box */}
            <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider">Pickup Counter</h4>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{order.canteen_name || 'Central Canteen'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Show your 4-digit PIN <span className="font-mono font-bold text-orange-600 text-sm">[{order.pickup_pin || '4821'}]</span> at the counter when called.
                </p>
              </div>
            </div>

            {/* Itemized Order List */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-500" />
                <span>Itemized Receipt</span>
              </h3>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                {order.items?.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-800 font-bold text-xs flex items-center justify-center">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-gray-900">{item.item_name}</span>
                    </div>
                    <span className="font-extrabold text-gray-900">
                      ₹{parseFloat(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            {order.special_instructions && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <span className="font-bold text-gray-700">Special Instructions:</span>
                <p className="text-gray-600 mt-0.5 italic">{order.special_instructions}</p>
              </div>
            )}

            {/* Payment & Bill Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Information</h4>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  {order.payment_method === 'cash' ? (
                    <Banknote className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                  )}
                  <span>
                    {order.payment_method === 'cash' ? 'Cash at Counter' : 'Online Payment'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 capitalize">
                  Status: <span className="font-bold text-gray-700">{order.payment_status}</span>
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-gray-900">₹{parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Campus Subsidy / Tax:</span>
                  <span className="font-bold text-emerald-600">₹0.00</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Amount:</span>
                  <span className="text-orange-600 text-base font-black">
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Option (Only if placed) */}
            {order.status === 'placed' && (
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}

            {/* Post-Order Food Rating Card (Cherry on the top!) */}
            {order.status === 'completed' && (
              <div className="pt-6 border-t border-gray-100">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h4 className="font-black text-sm text-gray-900">Rate Your Food Experience</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-4">
                    How was the taste and freshness of your meal from {order.canteen_name}?
                  </p>

                  <form onSubmit={handleRatingSubmit} className="space-y-3">
                    {/* Star Selector */}
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setSelectedRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= (hoverRating || selectedRating)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-800 ml-2">
                        {selectedRating === 5 ? 'Excellent! 🌟' : selectedRating === 4 ? 'Very Good 👍' : selectedRating === 3 ? 'Good' : 'Average'}
                      </span>
                    </div>

                    <textarea
                      rows={2}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share quick thoughts on taste, crunch, or kitchen speed (optional)..."
                      className="w-full bg-white border border-orange-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                    />

                    <button
                      type="submit"
                      disabled={submittingRating}
                      className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingRating ? 'Saving Feedback...' : 'Submit Rating'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Official Receipt Print Modal */}
      <OrderReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        order={order}
      />

      <Footer />
    </div>
  );
}
