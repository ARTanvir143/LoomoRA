import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';

const Wishlist = () => {
  const { items, removeItem, clearWishlist } = useWishlistStore();

  return (
    <>
      <Helmet>
        <title>My Wishlist | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-red-500" /> My Wishlist
              </h1>
              <p className="text-gray-500 mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'} saved for later.
              </p>
            </div>
            
            {items.length > 0 && (
              <button 
                onClick={clearWishlist}
                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors flex items-center bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Clear Wishlist
              </button>
            )}
          </div>

          {/* Conditional Rendering based on Wishlist Items */}
          {items.length === 0 ? (
            /* ================= EMPTY STATE ================= */
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[50vh] animate-[fadeInUp_0.5s_ease-out]">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Save items you love to your wishlist. Review them anytime and easily move them to your cart.
              </p>
              <Link 
                to="/shop" 
                className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center shadow-lg active:scale-95"
              >
                Discover Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          ) : (
            /* ================= WISHLIST GRID ================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden group relative transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgb(0,0,0,0.08)]">
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Product Image */}
                  <Link to={`/product/${item.slug}`} className="block aspect-[3/4] bg-gray-50 relative overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Add to Cart Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                        <ShoppingBag className="w-4 h-4" /> View Options
                      </div>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-5">
                    <Link to={`/product/${item.slug}`}>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </>
  );
};

export default Wishlist;