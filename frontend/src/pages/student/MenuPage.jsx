import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFoodItems, getCategories, getCanteens } from '../../api/menu';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import FoodCard from '../../components/student/FoodCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Search, SlidersHorizontal, Check, RefreshCw, X } from 'lucide-react';

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCanteen, setSelectedCanteen] = useState(searchParams.get('canteen') || '');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Fetch categories and canteens once
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [catsRes, canteensRes] = await Promise.all([
          getCategories(),
          getCanteens(),
        ]);
        setCategories(catsRes.data.results || catsRes.data || []);
        setCanteens(canteensRes.data.results || canteensRes.data || []);
      } catch (e) {
        console.error('Failed to load metadata', e);
      }
    }
    loadMetadata();
  }, []);

  // Fetch filtered items
  useEffect(() => {
    async function loadItems() {
      try {
        setLoading(true);
        const params = {};
        if (search) params.search = search;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedCanteen) params.canteen = selectedCanteen;
        if (isVegOnly) params.is_veg = 'true';
        if (maxPrice) params.max_price = maxPrice;

        if (sortBy === 'price_asc') params.ordering = 'price';
        else if (sortBy === 'price_desc') params.ordering = '-price';
        else if (sortBy === 'name') params.ordering = 'name';
        else params.ordering = '-total_orders';

        const { data } = await getFoodItems(params);
        setItems(data.results || data || []);
      } catch (e) {
        console.error('Failed to load food items', e);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadItems, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedCanteen, isVegOnly, maxPrice, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedCanteen('');
    setIsVegOnly(false);
    setMaxPrice('');
    setSortBy('popular');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Medi-Caps Canteen Menu
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Select dishes from the central kitchen and add to your tray.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className="lg:hidden p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-orange-500" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Search & Main Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes by name or ingredients..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Veg Toggle */}
          <button
            onClick={() => setIsVegOnly(!isVegOnly)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 w-full md:w-auto justify-center ${
              isVegOnly
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="w-3.5 h-3.5 border-2 border-emerald-600 rounded-xs flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            <span>Pure Veg Only</span>
            {isVegOnly && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          {/* Sort By Dropdown */}
          <div className="w-full md:w-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Categories Tab Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedCategory === ''
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                String(selectedCategory) === String(cat.id)
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Additional Filters: Canteen and Max Price */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
          <span className="font-bold text-gray-500">Filter By:</span>

          {/* Canteen Filter */}
          <select
            value={selectedCanteen}
            onChange={(e) => setSelectedCanteen(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            <option value="">All Canteens</option>
            {canteens.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Max Price Filter */}
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            <option value="">Any Price</option>
            <option value="50">Under ₹50</option>
            <option value="80">Under ₹80</option>
            <option value="120">Under ₹120</option>
            <option value="150">Under ₹150</option>
          </select>

          {(selectedCategory || selectedCanteen || isVegOnly || maxPrice || search) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-orange-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset All
            </button>
          )}
        </div>

        {/* Food Items Grid */}
        {loading ? (
          <LoadingSpinner text="Loading delicious food items..." />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 my-8">
            <span className="text-5xl block mb-3">🔍</span>
            <h3 className="text-lg font-bold text-gray-900">No dishes match your filters</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Try adjusting your search keywords, clear category filters, or reset price options.
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary mt-4 py-2 px-5 text-xs font-bold cursor-pointer"
            >
              Show All Dishes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
