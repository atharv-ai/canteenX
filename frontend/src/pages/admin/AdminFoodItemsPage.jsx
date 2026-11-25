import { useState, useEffect } from 'react';
import {
  getFoodItemsAdmin, createFoodItem, updateFoodItem,
  patchFoodItem, deleteFoodItem, getCategoriesAdmin
} from '../../api/admin';
import Sidebar from '../../components/admin/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Plus, Edit, Trash2, Search, UtensilsCrossed,
  Clock, Flame, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFoodItemsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    preparation_time: 15,
    is_veg: true,
    is_available: true,
    is_featured: false,
    stock_quantity: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catsRes] = await Promise.all([
        getFoodItemsAdmin(),
        getCategoriesAdmin(),
      ]);
      setItems(itemsRes.data.results || itemsRes.data || []);
      setCategories(catsRes.data.results || catsRes.data || []);
    } catch (err) {
      console.error('Failed to load menu items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: categories[0]?.id || '',
      price: '',
      description: '',
      preparation_time: 12,
      is_veg: true,
      is_available: true,
      is_featured: false,
      stock_quantity: 50,
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || '',
      price: item.price,
      description: item.description || '',
      preparation_time: item.preparation_time || 15,
      is_veg: item.is_veg,
      is_available: item.is_available,
      is_featured: item.is_featured,
      stock_quantity: item.stock_quantity ?? '',
    });
    setModalOpen(true);
  };

  const handleToggleAvailability = async (item) => {
    try {
      await patchFoodItem(item.id, { is_available: !item.is_available });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !item.is_available } : i))
      );
      toast.success(`${item.name} is now ${!item.is_available ? 'Available' : 'Unavailable'}`);
    } catch {
      toast.error('Failed to update availability.');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from the menu?`)) return;
    try {
      await deleteFoodItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Food item deleted successfully.');
    } catch {
      toast.error('Failed to delete item.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach((k) => {
        if (formData[k] !== '' && formData[k] !== null) {
          dataToSend.append(k, formData[k]);
        }
      });

      if (editingItem) {
        await updateFoodItem(editingItem.id, dataToSend);
        toast.success('Food item updated successfully!');
      } else {
        await createFoodItem(dataToSend);
        toast.success('Food item created successfully!');
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Failed to save food item.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Food Menu Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manage dishes, prices, availability, and kitchen inventory for your canteen.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search food item..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="text-xs font-bold text-gray-400">
            Total Items: <span className="text-gray-900">{filteredItems.length}</span>
          </div>
        </div>

        {/* Food Items Table */}
        {loading ? (
          <LoadingSpinner text="Fetching menu items..." />
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 my-8">
            <span className="text-4xl block mb-2">🍽️</span>
            <h3 className="text-base font-bold text-gray-900">No food items found</h3>
            <p className="text-xs text-gray-400 mt-1">Click "Add New Dish" to add items to your canteen menu.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5">Dish</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Diet</th>
                    <th className="px-4 py-3.5">Prep Time</th>
                    <th className="px-4 py-3.5">Total Orders</th>
                    <th className="px-4 py-3.5">Available</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0">
                            🍲
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-gray-900 block">{item.name}</span>
                            {item.is_featured && (
                              <span className="text-[10px] font-bold text-orange-600 inline-flex items-center gap-1">
                                <Flame className="w-2.5 h-2.5 fill-orange-500" /> Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-600 font-medium">
                        {item.category_name || 'General'}
                      </td>

                      <td className="px-4 py-4 font-mono font-extrabold text-sm text-gray-900">
                        ₹{parseFloat(item.price).toFixed(2)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            item.is_veg
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          {item.is_veg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {item.preparation_time || 15} min
                        </span>
                      </td>

                      <td className="px-4 py-4 font-bold text-gray-700">
                        {item.total_orders || 0}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.is_available ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              item.is_available ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? 'Edit Food Item' : 'Add New Dish'}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Dish Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Masala Dosa"
                className="input-field text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field text-xs cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                    No categories found. Please add categories in the Categories tab first.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 75.00"
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Preparation Time (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="Unlimited if blank"
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ingredients, taste, serving details..."
                className="input-field text-xs"
              />
            </div>

            {/* Checkbox Toggles */}
            <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_veg}
                  onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                  className="accent-emerald-600 rounded"
                />
                <span className="font-bold text-gray-700">Vegetarian</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="accent-emerald-600 rounded"
                />
                <span className="font-bold text-gray-700">Available</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="accent-orange-500 rounded"
                />
                <span className="font-bold text-gray-700">Featured</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2 px-5 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving Dish...' : editingItem ? 'Save Changes' : 'Create Dish'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
