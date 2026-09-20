import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, LogOut, LayoutDashboard, FileText, Heart } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authstore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import toast from 'react-hot-toast';

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Zustand স্টোর থেকে ডাটা নেওয়া হচ্ছে
  const { user } = useAuthStore();
  const { totalItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* ================= HEADER / NAVBAR ================= */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${
          scrolled 
            ? 'bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.04)]' 
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo: Image + Text Combined */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
              {/* Image Logo (public/logo.png) */}
              <img 
                src="/logo.png" 
                alt="LoomoRA Logo" 
                className="h-8 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  // যদি লোগো না থাকে, তবে ভাঙা ইমেজ আইকন হাইড হয়ে যাবে
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Text Logo */}
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                Loomo<span className="text-blue-600">RA</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-10">
              <Link to="/" className="text-gray-800 hover:text-blue-600 font-bold transition-colors tracking-wide text-sm uppercase">Home</Link>
              <Link to="/shop" className="text-gray-800 hover:text-blue-600 font-bold transition-colors tracking-wide text-sm uppercase">Shop</Link>
              <Link to="/categories" className="text-gray-800 hover:text-blue-600 font-bold transition-colors tracking-wide text-sm uppercase">Categories</Link>
              <Link to="/new-arrivals" className="text-gray-800 hover:text-blue-600 font-bold transition-colors tracking-wide text-sm uppercase">New Arrivals</Link>
            </nav>

            {/* Right side icons */}
            <div className="flex items-center space-x-4 sm:space-x-5">
              <button className="text-gray-700 hover:text-blue-600 transition-colors p-2" aria-label="Search">
                <Search className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              
              {/* User Account Dropdown */}
              {user ? (
                <div className="relative group">
                  <button className="text-gray-700 hover:text-blue-600 transition-colors p-2 flex items-center gap-1">
                    <User className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <div className="absolute right-0 w-56 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right translate-y-2 group-hover:translate-y-0">
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs font-medium text-gray-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link to="/profile" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors">
                        <User className="w-4 h-4 mr-2" /> My Profile
                      </Link>
                      <Link to="/orders" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors">
                        <FileText className="w-4 h-4 mr-2" /> Order History
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="flex items-center px-3 py-2.5 text-sm font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100 rounded-xl transition-colors">
                          <LayoutDashboard className="w-4 h-4 mr-2" /> Admin Dashboard
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors p-2" aria-label="User Account">
                  <User className="w-5 h-5 md:w-6 md:h-6" />
                </Link>
              )}

              {/* Wishlist Icon */}
              <Link to="/wishlist" className="text-gray-700 hover:text-red-500 transition-colors p-2 relative group" aria-label="Wishlist">
                <Heart className="w-5 h-5 md:w-6 md:h-6" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 md:h-5 md:w-5 flex items-center justify-center rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Icon */}
              <Link to="/cart" className="text-gray-700 hover:text-blue-600 transition-colors p-2 relative group" aria-label="Shopping Cart">
                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-blue-600 text-white text-[10px] font-bold h-4 w-4 md:h-5 md:w-5 flex items-center justify-center rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    {totalItems}
                  </span>
                )}
              </Link>
              
              <button onClick={toggleMobileMenu} className="md:hidden text-gray-700 hover:text-blue-600 p-2">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl backdrop-saturate-150 border-t border-gray-100 px-4 pt-2 pb-6 space-y-2 shadow-2xl absolute w-full max-h-[80vh] overflow-y-auto z-50">
            <Link to="/" className="block px-4 py-3 rounded-xl text-base font-bold text-gray-900 hover:bg-gray-50 hover:text-blue-600">Home</Link>
            <Link to="/shop" className="block px-4 py-3 rounded-xl text-base font-bold text-gray-900 hover:bg-gray-50 hover:text-blue-600">Shop</Link>
            <Link to="/wishlist" className="block px-4 py-3 rounded-xl text-base font-bold text-gray-900 hover:bg-red-50 hover:text-red-600">Wishlist ({wishlistItems.length})</Link>
            <Link to="/categories" className="block px-4 py-3 rounded-xl text-base font-bold text-gray-900 hover:bg-gray-50 hover:text-blue-600">Categories</Link>
            
            <div className="border-t border-gray-100 my-2 pt-2"></div>
            
            {user ? (
              <>
                <div className="px-4 py-3 bg-gray-50 rounded-xl mb-2 border border-gray-100">
                  <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs font-medium text-gray-500">{user.email}</p>
                </div>
                <Link to="/profile" className="block px-4 py-3 rounded-xl text-base font-bold text-gray-900 hover:bg-gray-50 hover:text-blue-600">My Profile</Link>
                <Link to="/orders" className="block px-4 py-3 rounded-xl text-base font-bold text-gray-900 hover:bg-gray-50 hover:text-blue-600">Order History</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block px-4 py-3 rounded-xl text-base font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100">Admin Dashboard</Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 mt-2">Logout</button>
              </>
            ) : (
              <Link to="/login" className="block px-4 py-3.5 rounded-xl text-base font-bold text-white bg-gray-900 hover:bg-blue-600 text-center mt-4 transition-colors">Sign In / Register</Link>
            )}
          </div>
        )}
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-grow w-full relative z-10"><Outlet /></main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#0F172A] text-white pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            
            <div>
              {/* Footer Logo: Image + Text Combined */}
              <div className="flex items-center gap-2.5 mb-6 opacity-90">
                <img 
                  src="/logo.png" 
                  alt="LoomoRA Logo" 
                  className="h-8 w-auto object-contain brightness-0 invert" // Inverted to white for dark footer
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Loomo<span className="text-blue-500">RA</span>
                </h3>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-6 pe-4 font-medium">
                Elevate your style with our premium collection of modern fashion. Designed for the bold and the beautiful.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-white tracking-wide">Quick Links</h4>
              <ul className="space-y-3 text-sm text-gray-400 font-medium">
                <li><Link to="/shop" className="hover:text-blue-400 block transition-colors">Shop All</Link></li>
                <li><Link to="/categories" className="hover:text-blue-400 block transition-colors">Collections</Link></li>
                <li><Link to="/new-arrivals" className="hover:text-blue-400 block transition-colors">New Arrivals</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-white tracking-wide">Customer Service</h4>
              <ul className="space-y-3 text-sm text-gray-400 font-medium">
                <li><Link to="/account" className="hover:text-blue-400 block transition-colors">My Account</Link></li>
                <li><Link to="/order-tracking" className="hover:text-blue-400 block transition-colors">Track Order</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 block transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-white tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400 font-medium">
                <li><Link to="/privacy-policy" className="hover:text-blue-400 block transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 block transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="hover:text-blue-400 block transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-medium text-gray-500">
            <p>&copy; {new Date().getFullYear()} LoomoRA. All rights reserved.</p>
            <p className="mt-4 md:mt-0">Premium Fashion E-Commerce</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;