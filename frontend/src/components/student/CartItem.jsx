import { Plus, Minus, Trash2 } from 'lucide-react';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const food = item.food_item_detail || {};

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Veg Dot */}
        <div className="w-3.5 h-3.5 border-2 border-emerald-600 rounded-xs flex items-center justify-center shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-900 truncate">{food.name || 'Food Item'}</h4>
          <p className="text-xs text-gray-400 mt-0.5">₹{parseFloat(food.price || 0).toFixed(2)} each</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Quantity Controls */}
        <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition cursor-pointer"
            title="Decrease"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-3 text-xs font-bold text-gray-800">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition cursor-pointer"
            title="Increase"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right w-16">
          <span className="text-sm font-extrabold text-gray-900">
            ₹{parseFloat(item.subtotal || 0).toFixed(2)}
          </span>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
