import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ChevronRight, Home, Loader2, Search, ShoppingBag, Star, Sparkles } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  rating: number;
  reviewCount: number;
}

const NewArrivals = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ফায়ারবেস থেকে সর্বশেষ আপলোড করা ১৬টি প্রোডাক্ট নিয়ে আসা
  useEffect(() => {
    const fetchNewArrivals = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'products'), 
          orderBy('createdAt', 'desc'), 
          limit(16) // সর্বশেষ ১৬টি প্রোডাক্ট দেখাবে
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedProducts: Product[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
        });
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  return (
    <>
      <Helmet>
        <title>New Arrivals | LoomoRA</title>
        <meta name="description" content="Discover the newest premium fashion collections at LoomoRA." />
      </Helmet>

      <div className="bg-white min-h-screen pb-20">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="bg-[#0F172A] pt-20 pb-16 px-4 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="max-w-7xl mx-auto text-center relative z-10 animate-[fadeInUp_0.8s_ease-out]">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-bold tracking-[0.2em] uppercase text-sm">
                Just Dropped
              </span>
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              New Arrivals
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8 font-medium">
              Be the first to explore our latest seasonal drops. Fresh styles, premium fabrics, and modern aesthetics designed for you.
            </p>
            
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center text-sm text-gray-400">
              <Link to="/" className="hover:text-white flex items-center transition-colors"><Home className="w-4 h-4" /></Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-600" />
              <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-600" />
              <span className="text-white font-medium">New Arrivals</span>
            </nav>
          </div>
        </div>

        {/* ================= PRODUCTS GRID ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Latest Additions</h2>
            <span className="text-sm font-medium text-gray-500">{products.length} Items</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500 font-medium">Loading new styles...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 px-4 min-h-[40vh] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-gray-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No New Arrivals Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                We are preparing something amazing. Please check back in a few days for our new collection drop!
              </p>
              <Link to="/shop" className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg active:scale-95">
                Explore Current Collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`} className="group block">
                  
                  {/* Product Image Container */}
                  <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
                    {product.images && product.images.length > 0 ? (
                      <>
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Hover Image (if 2nd image exists) */}
                        {product.images[1] && (
                          <img 
                            src={product.images[1]} 
                            alt={`${product.name} alternate`} 
                            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                        New
                      </span>
                      {product.discountPrice && product.discountPrice > 0 ? (
                        <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                          Sale
                        </span>
                      ) : null}
                    </div>
                    
                    {/* Hover Button */}
                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden md:block">
                      <button className="w-full bg-white/95 backdrop-blur-sm text-gray-900 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Quick View
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {product.category}
                    </p>
                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-gray-700">{product.rating || '5.0'}</span>
                      <span className="text-xs text-gray-400 font-medium">({product.reviewCount || 0})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      {product.discountPrice && product.discountPrice > 0 ? (
                        <>
                          <span className="text-lg font-black text-blue-600">${product.discountPrice.toFixed(2)}</span>
                          <span className="text-sm text-gray-400 font-bold line-through">${product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-lg font-black text-gray-900">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default NewArrivals;