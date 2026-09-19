import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ChevronRight, Home, Loader2, Tags } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ফায়ারবেস থেকে লাইভ ক্যাটাগরিগুলো নিয়ে আসা
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedCategories: Category[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCategories.push({ id: doc.id, ...doc.data() } as Category);
        });
        
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      <Helmet>
        <title>Shop by Categories | LoomoRA</title>
        <meta name="description" content="Browse LoomoRA's premium fashion collections by categories." />
      </Helmet>

      <div className="bg-white min-h-screen pb-20">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="bg-[#F8FAFC] pt-16 pb-12 px-4 border-b border-gray-100">
          <div className="max-w-7xl mx-auto text-center animate-[fadeInUp_0.8s_ease-out]">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Shop by Category
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-6">
              Find exactly what you're looking for. Browse our carefully curated collections designed for every occasion.
            </p>
            
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600 flex items-center transition-colors"><Home className="w-4 h-4" /></Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <span className="text-gray-900 font-medium">Categories</span>
            </nav>
          </div>
        </div>

        {/* ================= CATEGORIES GRID ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500 font-medium">Loading collections...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 px-4 min-h-[40vh] flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tags className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                We are currently updating our collections. Please check back later!
              </p>
              <Link to="/shop" className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-blue-600 transition-colors inline-flex items-center shadow-lg active:scale-95">
                Shop All Products <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px] md:auto-rows-[400px]">
              {categories.map((category, index) => {
                // জাদুকরী লজিক: গ্রিডকে সুন্দর দেখানোর জন্য প্রতি ৫ম এলিমেন্টের ১ম ও ৪র্থ টিকে বড় (large) দেখানো হচ্ছে
                const isLarge = index % 5 === 0 || index % 5 === 3;
                
                return (
                  <Link 
                    key={category.id} 
                    to="/shop" 
                    state={{ categoryId: category.slug }} // Slug পাঠানো হচ্ছে যাতে শপ পেজে ফিল্টার হয়
                    className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 block ${
                      isLarge ? 'md:col-span-2' : 'col-span-1'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0 w-full h-full bg-gray-100">
                      <img 
                        src={category.image} 
                        alt={category.name} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    </div>

                    {/* Dark Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

                    {/* Content */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                          {category.name}
                        </h2>
                        <p className="text-gray-300 text-sm md:text-base mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
                          {category.description}
                        </p>
                        <div className="inline-flex items-center text-sm font-bold tracking-widest uppercase text-white bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl group-hover:bg-blue-600 transition-colors duration-300">
                          Explore <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= PROMOTIONAL BANNER ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="relative rounded-3xl overflow-hidden bg-[#0F172A] py-16 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between shadow-2xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            
            <div className="relative z-10 text-center md:text-left mb-8 md:mb-0 max-w-xl">
              <span className="text-blue-400 font-bold tracking-widest text-sm uppercase mb-2 block">Special Offer</span>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4">New Arrivals Are Here</h3>
              <p className="text-gray-400 text-lg">Be the first to wear our exclusive seasonal drop. Limited stock available.</p>
            </div>
            
            <Link to="/shop" className="relative z-10 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center shadow-lg active:scale-95 group flex-shrink-0">
              Shop New Arrivals
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
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

export default Categories;