import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCartStore } from '../../store/cartStore';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  // Zustand স্টোর থেকে কার্টের ডাটা এবং ফাংশনগুলো নিয়ে আসা হচ্ছে
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore();

  // শিপিং লজিক (উদাহরণস্বরূপ: ২০০ ডলারের ওপরে কিনলে ফ্রি শিপিং, নাহলে ১৫ ডলার)
  const shippingCost = totalPrice > 200 || totalPrice === 0 ? 0 : 15.00;
  const grandTotal = totalPrice + shippingCost;

  return (
    <>
      <Helmet>
        <title>Shopping Cart | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shopping Cart</h1>
            <p className="text-gray-500 mt-1">You have {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart.</p>
          </div>

          {items.length === 0 ? (
            /* ================= EMPTY CART STATE ================= */
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Looks like you haven't added anything to your cart yet. Discover our latest collections and find something you love.
              </p>
              <Link 
                to="/shop" 
                className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center"
              >
                Continue Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          ) : (
            /* ================= CART WITH ITEMS ================= */
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left Side: Cart Items List */}
              <div className="w-full lg:w-2/3 space-y-4">
                {items.map((item, index) => (
                  <div key={`${item.id}-${item.size}-${item.color}-${index}`} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                    
                    {/* Product Image */}
                    <Link to={`/product/${item.id}`} className="w-32 h-40 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 block">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 w-full flex flex-col justify-between h-full space-y-4 sm:space-y-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link to={`/product/${item.id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                            {item.name}
                          </Link>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-2">
                            {item.color && (
                              <span className="flex items-center gap-1 capitalize">
                                <span className="w-3 h-3 rounded-full border border-gray-300 inline-block" style={{ backgroundColor: item.color }}></span>
                                {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="uppercase border-l border-gray-200 pl-3">Size: <span className="font-semibold text-gray-700">{item.size}</span></span>
                            )}
                          </div>
                          <p className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</p>
                        </div>
                        
                        {/* Remove Button (Desktop) */}
                        <button 
                          onClick={() => removeItem(item.id, item.size, item.color)}
                          className="hidden sm:flex text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-gray-100 sm:border-none sm:pt-0">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                            className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-semibold text-gray-900 text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                            className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-50"
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove Button (Mobile) */}
                        <button 
                          onClick={() => removeItem(item.id, item.size, item.color)}
                          className="sm:hidden text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>

                        <div className="hidden sm:block text-right">
                          <p className="text-sm text-gray-500 mb-0.5">Total</p>
                          <p className="text-lg font-bold text-blue-600">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Link to="/shop" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mt-4">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Continue Shopping
                </Link>
              </div>

              {/* Right Side: Order Summary */}
              <div className="w-full lg:w-1/3">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sticky top-28">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({totalItems} items)</span>
                      <span className="font-medium text-gray-900">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Estimate</span>
                      <span className="font-medium text-gray-900">{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    {shippingCost > 0 && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded text-center">
                        Add ${(200 - totalPrice).toFixed(2)} more to your cart to get FREE shipping!
                      </p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">${grandTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1">Inclusive of all taxes</p>
                  </div>

                  <button 
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(37,99,235,0.2)]"
                  >
                    Proceed to Checkout <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span>Secure Checkout Guarantee</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;