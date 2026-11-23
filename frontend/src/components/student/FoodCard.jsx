import { Plus, Minus, Clock, Flame, Store } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function FoodCard({ item }) {
  const { addItem, updateItem, getItemQuantity, getCartItemId } = useCart();
  const quantity = getItemQuantity(item.id);
  const cartItemId = getCartItemId(item.id);

  const handleIncrement = () => {
    if (quantity === 0) {
      addItem(item.id, 1);
    } else if (cartItemId) {
      updateItem(cartItemId, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0 && cartItemId) {
      updateItem(cartItemId, quantity - 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Image / Header Container */}
        <div className="relative h-44 bg-gradient-to-tr from-amber-50 to-orange-100 overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-orange-400 p-4">
              <span className="text-4xl select-none">🍲</span>
              <span className="text-xs text-orange-400/80 font-medium mt-1">Fresh from Kitchen</span>
            </div>
          )}

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg shadow-xs">
            <div
              className={`w-3.5 h-3.5 border-2 rounded-xs flex items-center justify-center ${
                item.is_veg ? 'border-emerald-600' : 'border-rose-600'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
            </div>
          </div>

          {/* Featured Badge */}
          {item.is_featured && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Flame className="w-3 h-3 fill-white" />
              Popular
            </div>
          )}

          {/* Prep Time */}
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-orange-300" />
            <span>{item.preparation_time || 10} min</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-orange-600 transition-colors">
              {item.name}
            </h3>
          </div>
          {(item.canteen_name || item.canteen?.name) && (
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-orange-600">
              <Store className="w-3.5 h-3.5 shrink-0 text-orange-500" />
              <span className="truncate">{item.canteen_name || item.canteen?.name}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
            {item.description || 'Prepared fresh with quality ingredients in Medi-Caps Central Kitchen.'}
          </p>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
        <div>
          <span className="text-xs text-gray-400 font-medium">Price</span>
          <p className="text-lg font-extrabold text-gray-900">
            ₹{parseFloat(item.price).toFixed(2)}
          </p>
        </div>

        {/* Add / Quantity Control */}
        <div>
          {quantity === 0 ? (
            <button
              onClick={handleIncrement}
              className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 hover:border-orange-500 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-orange-500 text-white rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={handleDecrement}
                className="px-2.5 py-1.5 hover:bg-orange-600 transition cursor-pointer"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 text-xs font-bold select-none">{quantity}</span>
              <button
                onClick={handleIncrement}
                className="px-2.5 py-1.5 hover:bg-orange-600 transition cursor-pointer"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
