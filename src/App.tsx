import React, { useEffect, Suspense, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { ArrowRight } from 'lucide-react';

// 3D Imports
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, ContactShadows, useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Firebase & Store Imports
import { auth, db } from './config/firebase';
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
    <group position={isMobile ? [0, 1.5, 0] : [3, 0, 0]} scale={isMobile ? 0.7 : 1}>
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
// 4. INTERACTIVE 3D CONTROLS (Touch & Drag)
// ==========================================
const InteractiveControls = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <OrbitControls 
      enableZoom={false} 
      enablePan={false}  
      autoRotate={true}  
      autoRotateSpeed={1.5} 
      target={isMobile ? [0, 1.5, 0] : [3, 0, 0]} 
      minPolarAngle={Math.PI / 3} 
      maxPolarAngle={Math.PI / 1.5} 
      makeDefault
    />
  );
};

// ==========================================
// 5. HOME COMPONENT
// ==========================================
const Home = () => {
  const [customModels, setCustomModels] = useState<string[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const q = query(collection(db, '3d_models'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const urls = snapshot.docs.map(doc => doc.data().modelUrl);
        setCustomModels(urls);
      } catch (error) {
        console.error("Error fetching 3D models:", error);
      }
    };
    fetchModels();
  }, []);

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
      `}</style>
      
      <div className="relative h-[calc(100vh-80px)] w-full bg-[#f8fafc] overflow-hidden flex flex-col md:flex-row items-center cursor-grab active:cursor-grabbing">
        
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pointer-events-none flex items-center justify-center md:justify-start h-full pb-20 md:pb-0 pt-10 md:pt-0">
          <div className="max-w-2xl text-center md:text-left mt-auto md:mt-0 pointer-events-auto">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
              <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100/80 backdrop-blur-md text-blue-700 text-sm font-bold tracking-widest mb-6 border border-blue-200">
                PREMIUM COLLECTION
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1] flex flex-wrap justify-center md:justify-start gap-x-3 pointer-events-none">
              <SparkleText text="Elevate" delayOffset={0.2} />
              <SparkleText text="Your" delayOffset={0.8} />
              <SparkleText text="Style" delayOffset={1.4} className="text-blue-600" />
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-12 max-w-md mx-auto md:mx-0 leading-relaxed font-medium bg-white/40 p-4 rounded-2xl backdrop-blur-sm border border-white/60 shadow-sm animate-fade-in-up" style={{ animationDelay: '1.8s', opacity: 0 }}>
              Discover our exclusive interactive collection. Drag to rotate and explore premium luxury from every angle.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '2.0s', opacity: 0 }}>
              <Link to="/shop" className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center text-sm tracking-widest uppercase shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95 group">
                Shop Now <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
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