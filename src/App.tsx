import React, { useEffect, Suspense, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { ArrowRight, Truck, ShieldCheck, Clock, RotateCcw, ShoppingBag, Star, Loader2 } from 'lucide-react';

// 3D Imports
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, ContactShadows, useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Firebase & Store Imports
import { auth, db } from './config/firebase';
// @ts-ignore
import { useAuthStore } from './store/authStore';

// Layouts & Components
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/account/Profile';
import Orders from './pages/account/Orders';
import OrderTracking from './pages/account/OrderTracking';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';
import ManageOrders from './pages/admin/ManageOrders';
import AdminLegalPages from './pages/admin/LegalPages';
import Manage3DModels from './pages/admin/Manage3DModels';
import ManageCategories from './pages/admin/ManageCategories';
import ManageBanners from './pages/admin/ManageBanners';
import AdminCustomers from './pages/admin/Customers';
import AdminSettings from './pages/admin/Settings';
import Shop from './pages/shop/Shop';
import ProductDetails from './pages/shop/ProductDetails';
import Cart from './pages/shop/Cart';
import Wishlist from './pages/shop/Wishlist';
// @ts-ignore
import Checkout from './pages/checkout/Checkout';
import Categories from './pages/shop/Categories';
import NewArrivals from './pages/shop/NewArrivals';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import LegalPageViewer from './pages/legal/LegalPageViewer';
import NotFound from './pages/NotFound';
import Addresses from './pages/account/Addresses';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  isFeatured?: boolean;
  images: string[];
  rating: number;
  reviewCount: number;
}

// ==========================================
// 1. SPARKLE TEXT ANIMATION
// ==========================================
const SparkleText = ({ text, delayOffset = 0, className = "" }: { text: string, delayOffset?: number, className?: string }) => {
  return (
    <span className={`inline-block ${className}`}>
      {text.split('').map((char, index) => {
        if (char === ' ') return <span key={index}>&nbsp;</span>;
        const randomX = (Math.sin(index * 12.5) * 120).toFixed(2); 
        const randomY = (Math.cos(index * 42.1) * 120).toFixed(2); 
        const randomScale = (Math.sin(index * 7.1) * 2 + 1.5).toFixed(2); 
        const randomRotate = (Math.sin(index * 21.3) * 90).toFixed(2); 
        const style = {
          display: 'inline-block',
          '--tx': `${randomX}px`, '--ty': `${randomY}px`,
          '--s': randomScale, '--r': `${randomRotate}deg`,
          animation: `sparkleAssemble 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
          animationDelay: `${delayOffset + index * 0.08}s`, opacity: 0, 
        } as React.CSSProperties;
        return <span key={index} style={style} className="sparkle-char">{char}</span>;
      })}
    </span>
  );
};

// ==========================================
// 2. DYNAMIC 3D MODEL LOADER
// ==========================================
const DynamicModel = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 3.5 / (maxDim || 1); 
    
    clone.scale.set(scaleFactor, scaleFactor, scaleFactor);
    clone.position.x = -center.x * scaleFactor;
    clone.position.y = -center.y * scaleFactor;
    clone.position.z = -center.z * scaleFactor;
    return clone;
  }, [scene]);
  return <primitive object={clonedScene} />;
};

// ==========================================
// 3. 3D CAROUSEL SWITCHER
// ==========================================
const FashionCarousel = ({ customModels }: { customModels: string[] }) => {
  const [index, setIndex] = useState(0);
  const groupRef = useRef<THREE.Group>(null);
  const targetScale = useRef(0); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initTimer = setTimeout(() => { targetScale.current = 1; }, 100);
    let interval: NodeJS.Timeout;
    if (customModels.length > 1) {
      interval = setInterval(() => {
        targetScale.current = 0.01; 
        setTimeout(() => {
          setIndex((prev) => (prev + 1) % customModels.length);
          targetScale.current = 1; 
        }, 500); 
      }, 6000); 
    }
    return () => {
      clearTimeout(initTimer);
      if (interval) clearInterval(interval);
    };
  }, [customModels.length]);

  useFrame(() => {
    if (groupRef.current && customModels.length > 0) {
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale.current, targetScale.current, targetScale.current), 0.08);
    }
  });

  if (customModels.length === 0) return null;

  return (
    // 💡 FIX: মোবাইলে মডেলটি একদম মাঝখানে (0,0,0) থাকবে, কারণ ক্যানভাস সাইজ ছোট করা হয়েছে।
    <group position={isMobile ? [0, 11, 0] : [3.5, 0, 0]} scale={isMobile ? 2 : 1}>
      <Float speed={2} floatIntensity={0.5} rotationIntensity={0.1}>
        <group ref={groupRef} scale={0}>
          <Suspense fallback={null}>
            <DynamicModel url={customModels[index]} />
          </Suspense>
        </group>
      </Float>
      <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={7} blur={2.5} far={2} color="#000000" />
    </group>
  );
};

// ==========================================
// 4. INTERACTIVE 3D CONTROLS
// ==========================================
const InteractiveControls = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useFrame((state) => {
    if (!isMobile) {
      const targetX = -2.5 + (state.pointer.x * 1);
      const targetY = (state.pointer.y * 1);
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    }
  });

  return (
    <OrbitControls 
      enableZoom={false} 
      enablePan={false}  
      autoRotate={true}  
      autoRotateSpeed={1.5} 
      target={isMobile ? [0, 11, 0] : [3.5, 0, 0]} 
      minPolarAngle={Math.PI / 3} 
      maxPolarAngle={Math.PI / 1.5} 
      minDistance={8} 
      maxDistance={8} 
      makeDefault
    />
  );
};

// ==========================================
// 5. MAIN HOME COMPONENT
// ==========================================
const Home = () => {
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const modelsQuery = query(collection(db, '3d_models'), orderBy('createdAt', 'desc'));
        const modelsSnap = await getDocs(modelsQuery);
        setCustomModels(modelsSnap.docs.map(doc => doc.data().modelUrl));

        const newArrQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(4));
        const newArrSnap = await getDocs(newArrQuery);
        setNewArrivals(newArrSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

        const featuredQuery = query(collection(db, 'products'), where('isFeatured', '==', true), limit(4));
        const featuredSnap = await getDocs(featuredQuery);
        setFeaturedProducts(featuredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const ProductCard = ({ product }: { product: Product }) => (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
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
          {product.discountPrice && product.discountPrice > 0 ? (
            <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">Sale</span>
          ) : null}
          {product.isFeatured && (
            <span className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">Featured</span>
          )}
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
  );

  return (
    <>
      <Helmet>
        <title>LoomoRA | Premium Fashion</title>
      </Helmet>
      
      <style>{`
        @keyframes sparkleAssemble {
          0% { opacity: 0; transform: translate3d(var(--tx), var(--ty), 0) scale(var(--s)) rotate(var(--r)); filter: blur(12px) brightness(300%) drop-shadow(0 0 15px rgba(37, 99, 235, 0.8)); color: #93c5fd; }
          50% { opacity: 0.8; filter: blur(4px) brightness(150%) drop-shadow(0 0 5px rgba(37, 99, 235, 0.4)); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0); filter: blur(0) brightness(100%) drop-shadow(0 0 0 transparent); }
        }
        .sparkle-char { will-change: transform, opacity, filter; }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .prevent-scroll-zoom canvas {
          touch-action: pan-y !important;
          overscroll-behavior: none !important;
        }
      `}</style>
      
      {/* 💡 FIX: Flex-col used properly. Height is full on desktop, but dynamic on mobile. */}
      <div className="relative min-h-[calc(100vh-80px)] w-full bg-[#f8fafc] overflow-hidden flex flex-col md:flex-row items-center justify-center cursor-grab active:cursor-grabbing pb-10 md:pb-0">
        
        {/* ================= 3D CANVAS ================= */}
        {/* 💡 FIX: On mobile, Canvas takes 50vh at the TOP. On desktop, it takes absolute full screen. */}
        <div className="prevent-scroll-zoom w-full h-[50vh] md:absolute md:inset-0 md:h-full z-0 pointer-events-auto">
          <Canvas camera={{ position: [0, 0, 8], fov: window.innerWidth < 768 ? 60 : 45 }}>
            <ambientLight intensity={1.5} color="#ffffff" />
            <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2.5} color="#ffffff" castShadow />
            <directionalLight position={[-10, -10, -5]} intensity={1.5} color="#e2e8f0" />
            <Suspense fallback={null}>
              <FashionCarousel customModels={customModels} />
              <InteractiveControls />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>

        {/* ================= FOREGROUND UI ================= */}
        {/* 💡 FIX: On mobile, Text comes sequentially BELOW the 3D model. */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pointer-events-none flex items-center justify-center md:justify-start h-full -translate-y-8 md:pt-0 pb-12 md:pb-0">
          
          {/* 💡 FIX: Glassmorphism added for both Mobile and Desktop */}
          <div className="max-w-xl text-start md:text-left -translate-y-20 md:mt-0 pointer-events-auto bg-white/15 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 relative overflow-hidden">
            
            {/* Subtle inner reflection for realistic glass effect */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
              <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100/80 backdrop-blur-md text-blue-700 text-xs md:text-sm font-bold tracking-widest mb-4 border border-blue-200 shadow-sm">
                PREMIUM COLLECTION
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight leading-[1.1] flex flex-wrap justify-center md:justify-start gap-x-3 pointer-events-none">
              <SparkleText text="Elevate" delayOffset={0.2} />
              <SparkleText text="Your" delayOffset={0.8} />
              <SparkleText text="Style" delayOffset={1.4} className="text-blue-600" />
            </h1>
            
            <p className="text-gray-600 text-sm sm:text-base md:text-xl mb-8 max-w-md mx-auto md:mx-0 leading-relaxed font-medium md:bg-white/40 md:p-4 md:rounded-2xl md:backdrop-blur-sm md:border md:border-white/60 md:shadow-sm animate-fade-in-up" style={{ animationDelay: '1.8s', opacity: 0 }}>
              Discover our exclusive interactive collection. Drag to rotate and explore premium luxury from every angle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '2.0s', opacity: 0 }}>
              <Link to="/shop" className="bg-gray-900 text-white px-8 py-3.5 md:py-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center text-sm tracking-widest uppercase shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95 group">
                Shop Now <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TRUST INDICATORS ================= */}
      <div className="bg-white py-12 border-b border-gray-100 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-gray-100">
            <div className="flex flex-col items-center justify-center px-4">
              <Truck className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-1">Free Shipping</h3>
              <p className="text-xs text-gray-500 font-medium">On orders over $200</p>
            </div>
            <div className="flex flex-col items-center justify-center px-4">
              <ShieldCheck className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-1">Secure Checkout</h3>
              <p className="text-xs text-gray-500 font-medium">100% protected payments</p>
            </div>
            <div className="flex flex-col items-center justify-center px-4">
              <RotateCcw className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-1">Easy Returns</h3>
              <p className="text-xs text-gray-500 font-medium">30-day return policy</p>
            </div>
            <div className="flex flex-col items-center justify-center px-4">
              <Clock className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-1">24/7 Support</h3>
              <p className="text-xs text-gray-500 font-medium">Always here to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= NEW ARRIVALS ================= */}
      <div className="bg-[#F8FAFC] py-24 border-b border-gray-100 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-2 block">Just Dropped</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">New Arrivals</h2>
            </div>
            <Link to="/new-arrivals" className="hidden md:flex items-center font-bold text-gray-900 hover:text-blue-600 transition-colors group">
              View All <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {newArrivals.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl text-center border border-gray-100 shadow-sm">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold">New collections coming soon!</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= CUSTOM PROMOTIONAL BANNER ================= */}
      <div className="bg-white py-20 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gray-900 min-h-[400px] flex flex-col md:flex-row items-center justify-center md:justify-start shadow-2xl group">
            <img 
              src="/my-banner.jpg" 
              alt="Promotional Banner" 
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            <div className="relative z-10 px-8 md:px-16 py-16 md:py-20 text-center md:text-left max-w-2xl">
              <span className="text-blue-400 font-bold tracking-widest text-sm uppercase mb-3 block drop-shadow-md">Special Offer</span>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg">Summer Collection 2026</h3>
              <p className="text-gray-200 text-lg md:text-xl mb-10 font-medium drop-shadow-md">Get ready for the season with our most vibrant and comfortable pieces yet. Up to 40% off on selected items.</p>
              <Link to="/shop" className="inline-flex bg-white text-gray-900 px-10 py-4 rounded-full font-bold hover:bg-blue-600 hover:text-white transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-95 text-sm tracking-widest uppercase items-center group/btn">
                Explore Collection
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FEATURED PRODUCTS ================= */}
      <div className="bg-[#F8FAFC] py-24 border-t border-gray-100 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-2 block">Top Picks</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Featured Products</h2>
            </div>
            <Link to="/shop" className="hidden md:flex items-center font-bold text-gray-900 hover:text-blue-600 transition-colors group">
              View All <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {featuredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl text-center border border-gray-100 shadow-sm">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold">Featured products will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: userData.role || 'customer',
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'customer',
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { background: '#222222', color: '#ffffff', borderRadius: '8px' }, success: { style: { background: '#0F172A' } } }} />
        
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            
            <Route path="shop" element={<Shop />} />
            <Route path="categories" element={<Categories />} />
            <Route path="new-arrivals" element={<NewArrivals />} />
            <Route path="product/:slug" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="order-tracking" element={<OrderTracking />} />
            <Route path="order-tracking/:id" element={<OrderTracking />} />
            
            <Route path="admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
            <Route path="admin/categories" element={<ProtectedRoute requireAdmin><ManageCategories /></ProtectedRoute>} />
            <Route path="admin/banners" element={<ProtectedRoute requireAdmin><ManageBanners /></ProtectedRoute>} />
            <Route path="admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
            <Route path="admin/products/new" element={<ProtectedRoute requireAdmin><AddProduct /></ProtectedRoute>} />
            <Route path="admin/products/edit/:id" element={<ProtectedRoute requireAdmin><EditProduct /></ProtectedRoute>} />
            <Route path="admin/orders" element={<ProtectedRoute requireAdmin><ManageOrders /></ProtectedRoute>} />
            <Route path="admin/customers" element={<ProtectedRoute requireAdmin><AdminCustomers /></ProtectedRoute>} />
            <Route path="admin/3d-models" element={<ProtectedRoute requireAdmin><Manage3DModels /></ProtectedRoute>} />
            <Route path="admin/legal" element={<ProtectedRoute requireAdmin><AdminLegalPages /></ProtectedRoute>} />
            
            <Route path="privacy-policy" element={<LegalPageViewer pageId="privacy-policy" />} />
            <Route path="terms" element={<LegalPageViewer pageId="terms" />} />
            <Route path="refund-policy" element={<LegalPageViewer pageId="refund-policy" />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<Faq />} />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;