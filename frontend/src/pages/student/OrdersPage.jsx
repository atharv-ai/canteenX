import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentOrders } from '../../api/orders';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { ShoppingBag, ArrowRight, Clock, Building2, RotateCw, KeyRound, Receipt, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reorderingId, setReorderingId] = useState(null);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const { data } = await getStudentOrders();
        setOrders(data.results || data || []);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleReorder = async (order) => {
    if (!order.items || order.items.length === 0) return;
    setReorderingId(order.id);
    try {
      for (const item of order.items) {
        if (item.food_item) {
          await addItem(item.food_item, item.quantity);
        }
      }
      toast.success('Items added to your cart!');
      navigate('/cart');
    } catch (err) {
      toast.error('Failed to add some items to cart.');
    } finally {
      setReorderingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['placed', 'accepted', 'preparing', 'ready'].includes(order.status);
    if (filter === 'completed') return order.status === 'completed';
    if (filter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Your Orders</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track current food orders and view your previous dining history.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
          {[
            { key: 'all', label: `All Orders (${orders.length})` },
            {
              key: 'active',
              label: `Active (${orders.filter((o) => ['placed', 'accepted', 'preparing', 'ready'].includes(o.status)).length})`,
            },
            {
              key: 'completed',
              label: `Completed (${orders.filter((o) => o.status === 'completed').length})`,
            },
            {
              key: 'cancelled',
              label: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                filter === tab.key
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <LoadingSpinner text="Retrieving your orders..." />
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No {filter !== 'all' ? filter : ''} orders found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Explore the canteen menu to place your first fresh meal order!
            </p>
            <Link to="/menu" className="btn-primary inline-flex items-center gap-2 mt-5 text-xs font-bold py-2.5 px-5">
              Browse Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || order.items?.length || 0;
              const isLive = ['placed', 'accepted', 'preparing', 'ready'].includes(order.status);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                    isLive ? 'border-orange-200 bg-orange-50/20' : 'border-gray-100'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-black text-gray-900">
                        #{order.order_number}
                      </span>
                      <Badge variant={order.status}>
                        {order.status === 'placed' ? 'Placed (Pending Acceptance)' : (order.status_display || order.status)}
                      </Badge>
                      {order.pickup_pin && isLive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-300">
                          <KeyRound className="w-3 h-3 text-amber-700" />
                          {order.status === 'placed' ? 'PIN: Pending Acceptance' : `PIN: ${order.pickup_pin}`}
                        </span>
                      )}
                      {order.rating && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {order.rating}/5 Rated
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="font-bold">{order.canteen_name || 'Central Canteen'}</span>
                      <span className="text-gray-300">•</span>
                      <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                      {['accepted', 'preparing'].includes(order.status) && order.estimated_prep_minutes && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                            ~{order.estimated_prep_minutes} mins prep
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-1">
                      {order.items?.map((i) => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-0 border-gray-100">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-gray-400 font-medium block">Total Amount</span>
                      <span className="text-lg font-black text-gray-900">
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          disabled={reorderingId === order.id}
                          className="px-3.5 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Add all items from this order back to your cart"
                        >
                          <RotateCw className={`w-3.5 h-3.5 text-orange-500 ${reorderingId === order.id ? 'animate-spin' : ''}`} />
                          <span>{reorderingId === order.id ? 'Adding...' : 'Re-Order'}</span>
                        </button>
                      )}

                      <Link
                        to={`/orders/${order.id}`}
                        className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>{isLive ? 'Live Pass & Track' : 'View Pass & Receipt'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
