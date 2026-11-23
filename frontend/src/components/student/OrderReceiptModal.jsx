import { Printer, X, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

export default function OrderReceiptModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-gray-900 shadow-2xl relative">
        {/* Close Button (hidden in print) */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 print:hidden">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Official Dining Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas */}
        <div className="pt-4 space-y-5 print:p-0">
          {/* Institution Header */}
          <div className="text-center border-b-2 border-dashed border-gray-200 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h2 className="font-black text-xl tracking-tight text-gray-900">
              MEDI-CAPS UNIVERSITY
            </h2>
            <p className="text-xs font-bold text-orange-600">CANTEENX CAMPUS DINING SERVICES</p>
            <p className="text-[10px] text-gray-500">AB Road, Pigdamber, Rau, Indore, MP 453331</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-gray-100 pb-3">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Order Reference</span>
              <span className="font-mono font-bold text-gray-900">#{order.order_number}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Date & Time</span>
              <span className="text-gray-700">
                {new Date(order.created_at).toLocaleString([], {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Student</span>
              <span className="font-bold text-gray-900">{order.student_name}</span>
              <p className="font-mono text-[10px] text-gray-500">{order.student_enrollment || 'EN2024CS001'}</p>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Pickup PIN</span>
              <span className="font-mono text-base font-black text-orange-600 tracking-wider">
                {order.pickup_pin || '4821'}
              </span>
            </div>
          </div>

          {/* Outlet Location */}
          <div className="bg-gray-50 p-2.5 rounded-xl text-xs flex justify-between items-center">
            <span className="font-bold text-gray-600">Counter:</span>
            <span className="font-extrabold text-gray-900">{order.canteen_name}</span>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 text-gray-400 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-gray-900 font-bold">{item.item_name}</td>
                    <td className="py-2 text-center font-bold text-gray-700">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-600">₹{parseFloat(item.item_price).toFixed(2)}</td>
                    <td className="py-2 text-right font-extrabold text-gray-900">
                      ₹{parseFloat(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-dashed border-gray-200 pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-bold text-gray-900">₹{parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Campus Food Subsidy / Tax:</span>
              <span className="font-bold text-emerald-600">₹0.00 (Waived)</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-100 text-gray-900">
              <span>Grand Total Paid:</span>
              <span className="text-orange-600 text-base">₹{parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment & Footer */}
          <div className="border-t border-gray-100 pt-3 text-center text-[10px] text-gray-400 space-y-1">
            <p className="font-bold text-gray-600 capitalize">
              Payment Method: {order.payment_method === 'cash' ? 'Cash at Counter' : 'Online Payment'} • Status: {order.payment_status}
            </p>
            <p>Thank you for dining at Medi-Caps Central Food Court!</p>
            <p className="font-mono text-[9px]">Computer-generated electronic receipt • Valid on campus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
