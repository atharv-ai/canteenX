import { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageCircle, X, Send, Bot, Clock, Plus, Check, ShoppingBag, Utensils } from 'lucide-react';
import { askAIBuddy } from '../../api/menu';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AIBuddyWidget() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedItems, setAddedItems] = useState({});
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Namaste! I am your **CanteenX AI Buddy**. Tell me what you're craving, your budget, or how much break time you have!",
      dishes: [],
      suggestedQueries: [
        'I have ₹80 & 10 minutes ⏱️',
        'High-protein lunch under ₹150 💪',
        'Quick snacks for 15-min break 🥪',
        'Cold drinks & coffee under ₹50 🥤'
      ]
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Only show for students or guest visitors, not for canteen admins
  if (user && user.role !== 'student') {
    return null;
  }

  const handleSend = async (textToSend) => {
    const prompt = (textToSend || query).trim();
    if (!prompt || loading) return;

    setQuery('');
    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text: prompt }]);
    setLoading(true);

    try {
      const { data } = await askAIBuddy({ query: prompt });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply || "Here's what I found for you:",
          dishes: data.dishes || [],
          suggestedQueries: data.suggested_queries || []
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "I couldn't reach the kitchen AI server right now. Try browsing our menu directly!",
          dishes: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (dish) => {
    try {
      await addItem(dish.id, 1);
      setAddedItems((prev) => ({ ...prev, [dish.id]: true }));
      setTimeout(() => {
        setAddedItems((prev) => ({ ...prev, [dish.id]: false }));
      }, 2000);
    } catch {
      toast.error('Please log in as a student to add items to cart.');
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-bold px-4 py-3 rounded-full shadow-xl shadow-orange-500/30 hover:scale-105 transition-all duration-200 cursor-pointer group"
          aria-label="Open AI Buddy"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <Sparkles className="w-5 h-5 text-amber-100 group-hover:rotate-12 transition-transform" />
          <span className="text-sm tracking-wide">Chef AI</span>
        </button>
      )}

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                👨‍🍳
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight">CanteenX AI Buddy</h3>
                  <span className="text-[10px] bg-white/25 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">
                    Smart
                  </span>
                </div>
                <p className="text-[11px] text-orange-100 font-medium">Diet & Budget Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-orange-600 text-white rounded-br-xs font-medium'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Recommended Dish Cards inside AI response */}
                {msg.dishes && msg.dishes.length > 0 && (
                  <div className="w-full mt-3 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                      Recommended Matches ({msg.dishes.length})
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.dishes.map((dish) => (
                        <div
                          key={dish.id}
                          className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center justify-between gap-3 hover:border-orange-200 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {dish.image ? (
                              <img
                                src={dish.image}
                                alt={dish.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                <Utensils className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    dish.is_veg ? 'bg-emerald-500' : 'bg-red-500'
                                  }`}
                                />
                                <h4 className="font-bold text-xs text-gray-900 truncate">
                                  {dish.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                                <span className="font-extrabold text-orange-600">₹{parseFloat(dish.price).toFixed(0)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  ~{dish.preparation_time}m
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddToCart(dish)}
                            className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs ${
                              addedItems[dish.id]
                                ? 'bg-emerald-600 text-white'
                                : 'bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white border border-orange-200'
                            }`}
                          >
                            {addedItems[dish.id] ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt Suggestion Chips */}
                {msg.suggestedQueries && msg.suggestedQueries.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {msg.suggestedQueries.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSend(chip)}
                        className="text-[11px] bg-white border border-orange-200 hover:border-orange-500 hover:bg-orange-50 text-gray-700 font-medium px-2.5 py-1 rounded-full transition cursor-pointer shadow-2xs"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic bg-white p-3 rounded-2xl border border-gray-100 w-fit">
                <Bot className="w-4 h-4 animate-spin text-orange-500" />
                <span>Chef AI is searching counter items & nutrition...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. ₹80 & 10 mins, high protein, cold drink..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition cursor-pointer shadow-md shadow-orange-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
