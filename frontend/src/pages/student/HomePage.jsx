import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCanteens, getCategories, getFoodItems } from '../../api/menu';
import { getStudentOrders } from '../../api/orders';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import FoodCard from '../../components/student/FoodCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import {
  Search, ArrowRight, Sparkles, Building2,
  Clock, Flame, ShoppingBag, Tag
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [canteensRes, catsRes, featuredRes, popularRes, ordersRes] = await Promise.allSettled([
          getCanteens(),
          getCategories(),
          getFoodItems({ is_featured: 'true' }),
          getFoodItems({ ordering: '-total_orders' }),
          getStudentOrders(),
        ]);

        if (canteensRes.status === 'fulfilled') {
          setCanteens(canteensRes.value.data.results || canteensRes.value.data || []);
        }
        if (catsRes.status === 'fulfilled') {
          setCategories(catsRes.value.data.results || catsRes.value.data || []);
        }
        if (featuredRes.status === 'fulfilled') {
          setFeaturedItems((featuredRes.value.data.results || featuredRes.value.data || []).slice(0, 4));
        }
        if (popularRes.status === 'fulfilled') {
          setPopularItems((popularRes.value.data.results || popularRes.value.data || []).slice(0, 8));
        }
        if (ordersRes.status === 'fulfilled') {
          setRecentOrders((ordersRes.value.data.results || ordersRes.value.data || []).slice(0, 2));
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-gray-950 via-gray-900 to-orange-950 rounded-3xl p-6 sm:p-10 text-white overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-orange-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Food Ordering • Medi-Caps University</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {getGreeting()},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                {user?.full_name?.split(' ')[0] || 'Student'}!
              </span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              What are you craving today? Order authentic Indori snacks, wholesome thalis, or cold coffee right from your phone.
            </p>

            {/* Live Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes (e.g. Poha, Dosa, Thali, Chai)..."
                  className="w-full bg-white text-gray-900 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-md font-medium placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="btn-primary py-3 px-5 rounded-2xl text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
              >
                <span>Find Food</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Active / Recent Orders Banner */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Your Recent Order</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-extrabold text-sm text-gray-900">
                    Order #{recentOrders[0].order_number}
                  </span>
                  <Badge variant={recentOrders[0].status}>
                    {recentOrders[0].status_display || recentOrders[0].status}
                  </Badge>
                </div>
              </div>
            </div>

            <Link
              to={`/orders/${recentOrders[0].id}`}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Track Live Status</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Category Navigation Pills */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Browse Categories</h2>
            <Link to="/menu" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/menu?category=${cat.id}`}
                className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-orange-300 shadow-xs hover:shadow-md transition text-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Tag className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>

        {/* Available Campus Canteens */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Campus Canteens</h2>
            <span className="text-xs text-gray-400 font-medium">{canteens.length} Food Courts Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canteens.map((canteen) => (
              <div
                key={canteen.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-800 text-orange-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-gray-900 truncate">{canteen.name}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      Open
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{canteen.description}</p>
                  <p className="text-[11px] text-gray-400 mt-2 font-medium truncate">📍 {canteen.location}</p>
                  <div className="mt-3">
                    <Link
                      to={`/menu?canteen=${canteen.id}`}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      Browse Canteen Menu <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Campus Specials */}
        {featuredItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Today's Featured Specials</h2>
              </div>
              <Link to="/menu" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
                Explore Menu <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredItems.map((item) => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Popular Campus Picks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Most Popular Dishes</h2>
            <Link to="/menu" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
              See All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner text="Fetching fresh menu items..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularItems.map((item) => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
