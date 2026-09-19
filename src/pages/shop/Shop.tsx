import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  Search, SlidersHorizontal, ChevronDown, Loader2, Star, 
  ShoppingBag, ChevronLeft, ChevronRight, Filter, X, Check
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sizes: string[];
  colors: string[];
  images: string[];
  rating: number;
  reviewCount: number;
}

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkTo: string;
  position: string;
  isActive: boolean;
}

const Shop = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ================= FILTERS & SORTING STATES =================
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(location.state?.categoryId || 'all');
  const [sortBy, setSortBy] = useState('newest');

  // Advanced Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(1000);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  const categories = [
    { id: 'all', name: 'All Collection' },
    { id: 'men', name: 'Men' },
    { id: 'women', name: 'Women' },
    { id: 'kids', name: 'Kids' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'shoes', name: 'Shoes' },
  ];

  // Fetch Data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const prodQ = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const prodSnap = await getDocs(prodQ);
        const productsData = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);

        const bannerQ = query(collection(db, 'banners'), where('isActive', '==', true), orderBy('createdAt', 'desc'));
        const bannerSnap = await getDocs(bannerQ);
        const bannersData = bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
        setBanners(bannersData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extract Dynamic Filter Options from existing products
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => p.sizes?.forEach(s => sizes.add(s.toUpperCase())));
    return Array.from(sizes);
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => p.colors?.forEach(c => colors.add(c.toLowerCase())));
    return Array.from(colors);
  }, [products]);

  const highestPrice = useMemo(() => {
    let max = 100;
    products.forEach(p => {
      const pPrice = p.discountPrice || p.price;
      if (pPrice > max) max = pPrice;
    });
    return Math.ceil(max);
  }, [products]);

  // Set initial max price when products load
  useEffect(() => {
    if (highestPrice > 0 && maxPriceFilter === 1000) {
      setMaxPriceFilter(highestPrice);
    }
  }, [highestPrice]);

  const topBanners = banners.filter(b => b.position === 'hero' || b.position === 'flash');
  const inlineBanners = banners.filter(b => b.position === 'category');

  // Auto Slider Logic
  useEffect(() => {
    if (topBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [topBanners.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % topBanners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + topBanners.length) % topBanners.length);

  // ================= MAIN FILTER & SORT LOGIC =================
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Search
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // 2. Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 3. Price Filter
    result = result.filter(p => (p.discountPrice || p.price) <= maxPriceFilter);

    // 4. Size Filter
    if (selectedSizes.length > 0) {
      result = result.filter(p => p.sizes && p.sizes.some(s => selectedSizes.includes(s.toUpperCase())));
    }

    // 5. Color Filter
    if (selectedColors.length > 0) {
      result = result.filter(p => p.colors && p.colors.some(c => selectedColors.includes(c.toLowerCase())));
    }

    // 6. Sort
    switch (sortBy) {
      case 'price-low': result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price)); break;
      case 'price-high': result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price)); break;
      case 'name-a-z': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return result;
  }, [products, searchTerm, selectedCategory, maxPriceFilter, selectedSizes, selectedColors, sortBy]);

  const handleBannerClick = (linkTo: string) => {
    if (!linkTo) return;
    if (linkTo.startsWith('/')) {
      navigate(linkTo);
    } else {
      if (categories.some(c => c.id === linkTo)) {
        setSelectedCategory(linkTo);
      } else {
        setSearchTerm(linkTo);
        setSelectedCategory('all');
      }
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const clearAllFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setMaxPriceFilter(highestPrice);
    setSearchTerm('');
    setSelectedCategory('all');
  };

  // Active filter count
  const activeFilterCount = selectedSizes.length + selectedColors.length + (maxPriceFilter < highestPrice ? 1 : 0);

  return (
    <>
      <Helmet>
        <title>Shop Collection | LoomoRA</title>
        <meta name="description" content="Browse our premium collection of modern fashion." />
      </Helmet>

      <div className="bg-white min-h-screen pb-20">
        
        {/* ================= TOP BANNERS SLIDER ================= */}
        {topBanners.length > 0 ? (
          <div className="relative w-full bg-[#0F172A] group">
            <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden">
              {topBanners.map((banner, index) => (
                <div 
                  key={banner.id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out cursor-pointer ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  onClick={() => handleBannerClick(banner.linkTo)}
                >
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12">
                    <span className="bg-blue-600 text-white text-xs md:text-sm font-bold tracking-widest uppercase px-3 py-1 rounded mb-2 inline-block shadow-sm">Special Event</span>
                    <h2 className="text-2xl md:text-5xl font-black text-white drop-shadow-lg">{banner.title}</h2>
                  </div>
                </div>
              ))}
            </div>

            {topBanners.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/90 backdrop-blur-sm text-white hover:text-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/90 backdrop-blur-sm text-white hover:text-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {topBanners.map((_, idx) => (
                    <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-blue-500 w-8' : 'bg-white/50 hover:bg-white shadow-sm'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-[#F8FAFC] py-16 px-4 border-b border-gray-100">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">Shop Collection</h1>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">Explore our curated selection of premium fashion.</p>
            </div>
          </div>
        )}

        <div id="product-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20">
          
          {/* ================= TOOLBAR ================= */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 pb-6 border-b border-gray-100 sticky top-20 bg-white/90 backdrop-blur-md z-30 pt-4">
            
            <div className="flex overflow-x-auto w-full md:w-auto pb-2 md:pb-0 space-x-2 custom-scrollbar hide-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    selectedCategory === cat.id ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center w-full md:w-auto gap-3">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-56 pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
                />
              </div>
              
              <div className="relative group flex-grow sm:flex-grow-0">
                <select
                  value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-44 pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 appearance-none text-sm cursor-pointer font-bold text-gray-700"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low - High</option>
                  <option value="price-high">Price: High - Low</option>
                  <option value="name-a-z">Name: A to Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Advanced Filter Button */}
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="relative bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2 flex-grow sm:flex-grow-0"
              >
                <Filter className="w-4 h-4" /> Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ================= PRODUCT GRID ================= */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500 font-medium">Loading collection...</p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-20 px-4 min-h-[40vh] border border-gray-100 rounded-3xl bg-gray-50">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Search className="w-10 h-10 text-gray-300" /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 max-w-md mx-auto">We couldn't find anything matching your current filters.</p>
              <button onClick={clearAllFilters} className="mt-6 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {filteredAndSortedProducts.map((product, index) => {
                
                const bannerIndex = Math.floor(index / 8);
                const showInlineBanner = index > 0 && index % 8 === 0 && inlineBanners[bannerIndex];

                return (
                  <React.Fragment key={product.id}>
                    
                    {/* Inline Category/Flash Banner */}
                    {showInlineBanner && (
                      <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 mb-4 mt-2 group cursor-pointer" onClick={() => handleBannerClick(inlineBanners[bannerIndex].linkTo)}>
                        <div className="relative w-full aspect-[21/9] md:aspect-[21/5] rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 border border-gray-100">
                          <img src={inlineBanners[bannerIndex].imageUrl} alt={inlineBanners[bannerIndex].title} className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-8 md:px-16">
                            <span className="text-blue-400 font-bold tracking-widest text-xs md:text-sm uppercase mb-2">Featured Category</span>
                            <h2 className="text-2xl md:text-4xl font-black text-white">{inlineBanners[bannerIndex].title}</h2>
                            <div className="mt-4 inline-flex items-center text-sm font-bold tracking-widest uppercase text-white bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl group-hover:bg-blue-600 transition-colors w-max">
                              Explore Now <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Product Card */}
                    <Link to={`/product/${product.slug}`} className="group block">
                      <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-100">
                        {product.images && product.images.length > 0 ? (
                          <>
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            {product.images[1] && (
                              <img src={product.images[1]} alt={`${product.name} alternate`} className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                        )}

                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.discountPrice && product.discountPrice > 0 ? <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">Sale</span> : null}
                          {product.stock <= 5 && product.stock > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">Low Stock</span>}
                        </div>
                        
                        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden md:block">
                          <button className="w-full bg-white/95 backdrop-blur-sm text-gray-900 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-2">
                            <ShoppingBag className="w-4 h-4" /> Quick View
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
                        <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h3>
                        
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold text-gray-700">{product.rating || '5.0'}</span>
                          <span className="text-xs text-gray-400 font-medium">({product.reviewCount || 0})</span>
                        </div>

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

                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= FILTER SLIDE-OVER DRAWER ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          ></div>
          
          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 animate-[slideInRight_0.3s_ease-out]">
            
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" /> Advanced Filters
              </h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* PRICE FILTER */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-gray-900">Max Price</h3>
                  <span className="text-blue-600 font-black">${maxPriceFilter}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={highestPrice > 0 ? highestPrice : 1000} 
                  value={maxPriceFilter} 
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs font-medium text-gray-400 mt-2">
                  <span>$0</span>
                  <span>${highestPrice > 0 ? highestPrice : 1000}</span>
                </div>
              </div>

              {/* SIZE FILTER */}
              {availableSizes.length > 0 && (
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Available Sizes</h3>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-4 py-2 border rounded-xl text-sm font-bold uppercase transition-all ${
                          selectedSizes.includes(size)
                            ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                            : 'border-gray-200 text-gray-700 hover:border-gray-900'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* COLOR FILTER */}
              {availableColors.length > 0 && (
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Available Colors</h3>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={`px-4 py-2 border rounded-xl text-sm font-bold capitalize flex items-center gap-2 transition-all ${
                          selectedColors.includes(color)
                            ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                            : 'border-gray-200 text-gray-700 hover:border-gray-900'
                        }`}
                      >
                        {selectedColors.includes(color) && <Check className="w-3.5 h-3.5" />}
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
              <button 
                onClick={clearAllFilters}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Clear All
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Show Results
              </button>
            </div>
            
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default Shop;
