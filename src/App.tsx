import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Firebase & Store
import { auth, db } from './config/firebase';
import { useAuthStore } from './store/authstore';

// Layout & Common
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Main Pages
import Home from './pages/home/Home';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Faq from './pages/Faq';

// Auth & Account
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/account/Profile';
import Orders from './pages/account/Orders';
import OrderTracking from './pages/account/OrderTracking';
import Addresses from './pages/account/Addresses';

// Shop Pages
import Shop from './pages/shop/Shop';
import Categories from './pages/shop/Categories';
import NewArrivals from './pages/shop/NewArrivals';
import ProductDetails from './pages/shop/ProductDetails';
import Cart from './pages/shop/Cart';
import Wishlist from './pages/shop/Wishlist';
import Checkout from './pages/checkout/checkout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';
import ManageCategories from './pages/admin/ManageCategories';
import ManageBanners from './pages/admin/ManageBanners';
import ManageOrders from './pages/admin/ManageOrders';
import AdminCustomers from './pages/admin/Customers';
import Manage3DModels from './pages/admin/Manage3DModels';
import AdminLegalPages from './pages/admin/LegalPages';
import AdminSettings from './pages/admin/Settings';

// Legal Pages
import LegalPageViewer from './pages/legal/LegalPageViewer';

// Dummy Page for missing routes
const DummyPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <h2 className="text-2xl font-semibold text-gray-700">{title} Page Coming Soon...</h2>
  </div>
);

// ==========================================
// MAIN APP COMPONENT (Routing & Auth State)
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
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            duration: 3000, 
            style: { background: '#222222', color: '#ffffff', borderRadius: '8px' }, 
            success: { style: { background: '#0F172A' } } 
          }} 
        />
        
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Base Routes */}
            <Route index element={<Home />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<Faq />} />
            
            {/* Shop Routes */}
            <Route path="shop" element={<Shop />} />
            <Route path="categories" element={<Categories />} />
            <Route path="new-arrivals" element={<NewArrivals />} />
            <Route path="product/:slug" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            
            {/* Auth & Account Routes */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="order-tracking" element={<OrderTracking />} />
            <Route path="order-tracking/:id" element={<OrderTracking />} />
            <Route path="addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />

            {/* Admin Routes */}
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
            
            {/* Legal Pages Routes */}
            <Route path="privacy-policy" element={<LegalPageViewer pageId="privacy-policy" />} />
            <Route path="terms" element={<LegalPageViewer pageId="terms" />} />
            <Route path="refund-policy" element={<LegalPageViewer pageId="refund-policy" />} />
            
            {/* 404 - Page Not Found */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;