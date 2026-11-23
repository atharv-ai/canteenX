import { useState, useEffect } from 'react';
import {
  getCategoriesAdmin, createCategory, updateCategory, deleteCategory
} from '../../api/admin';
import Sidebar from '../../components/admin/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { Plus, Edit, Trash2, Tags, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoriesAdmin();
      setCategories(data.results || data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setOrder(categories.length + 1);
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setOrder(cat.order || 0);
    setModalOpen(true);
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success('Category removed successfully.');
    } catch {
      toast.error('Failed to delete category.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name, description, order: parseInt(order, 10) || 0 };
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success('Category updated!');
      } else {
        await createCategory(payload);
        toast.success('Category created!');
      }
      setModalOpen(false);
      await fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Food Categories
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Organize food items into breakfast, lunch, snacks, beverages, and desserts.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading food categories..." />
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 my-8">
            <span className="text-4xl block mb-2">🏷️</span>
            <h3 className="text-base font-bold text-gray-900">No categories created yet</h3>
            <p className="text-xs text-gray-400 mt-1">Create categories to organize your canteen food menu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                      <Tag className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Order #{cat.order || 0}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingCategory ? 'Edit Category' : 'Create Category'}
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Indori Breakfast"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Display Order Priority</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="1, 2, 3..."
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief category info..."
                className="input-field text-xs"
              />
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
                {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
