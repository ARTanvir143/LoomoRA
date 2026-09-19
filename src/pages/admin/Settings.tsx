import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Menu, X, Tags, Settings as SettingsIcon, 
  FileText, Box, Save, Loader2, Store, Phone, Mail, MapPin 
} from 'lucide-react';

const AdminSettings = () => {
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'LoomoRA',
    email: 'support@loomora.com',
    phone: '+1 (555) 000-0000',
    address: '123 Fashion Avenue\nNew York, NY 10012',
    facebook: '',
    instagram: '',
    twitter: ''
  });

  // ফায়ারবেস থেকে সেটিংস ডাটা নিয়ে আসা
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'settings', 'store_info');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setStoreInfo(docSnap.data() as any);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load store settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStoreInfo(prev => ({ ...prev, [name]: value }));
  };

  // সেটিংস ডাটাবেজে সেভ করা
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const loadingToast = toast.loading('Saving settings...');

    try {
      await setDoc(doc(db, 'settings', 'store_info'), {
        ...storeInfo,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email
      }, { merge: true });

      toast.success('Settings saved successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Store Settings | Admin | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen flex flex-col md:flex-row">
        
        {/* ================= SIDEBAR ================= */}
        {isSidebarOpen && <div className="fixed inset-0 bg-gray-900/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

        <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0F172A] text-white transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
          <div className="h-20 flex items-center justify-between px-6 border-b border-gray-800">
            <span className="text-2xl font-bold tracking-tight">Loomo<span className="text-blue-500">Admin</span></span>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
          <div className="p-4 flex items-center space-x-3 border-b border-gray-800">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-medium text-sm">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'Administrator'}</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
            <Link to="/admin" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
            </Link>
            <Link to="/admin/products" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Package className="w-5 h-5 mr-3" /> Products
            </Link>
            <Link to="/admin/categories" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Tags className="w-5 h-5 mr-3" /> Categories
            </Link>
            <Link to="/admin/orders" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <ShoppingBag className="w-5 h-5 mr-3" /> Orders
            </Link>
            <Link to="/admin/3d-models" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Box className="w-5 h-5 mr-3" /> 3D Models
            </Link>
            <Link to="/admin/customers" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Users className="w-5 h-5 mr-3" /> Customers
            </Link>
            <Link to="/admin/legal" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <FileText className="w-5 h-5 mr-3" /> Legal Pages
            </Link>
            <div className="flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors cursor-pointer">
              <SettingsIcon className="w-5 h-5 mr-3" /> Store Settings
            </div>
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] overflow-hidden h-screen">
          
          <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 p-1"><Menu className="w-6 h-6" /></button>
            <span className="ml-4 font-semibold text-gray-900">Store Settings</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Store Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your store's contact information and social links.</p>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving || isLoading}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Save Settings
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Loading settings...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* General Information Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 animate-[fadeInUp_0.4s_ease-out]">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-3">
                    <Store className="w-5 h-5 mr-2 text-blue-600" /> General Contact Info
                  </h2>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Store Name</label>
                      <input 
                        type="text" name="storeName" value={storeInfo.storeName} onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> Support Email</label>
                        <input 
                          type="email" name="email" value={storeInfo.email} onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> Phone Number</label>
                        <input 
                          type="text" name="phone" value={storeInfo.phone} onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> Office Address</label>
                      <textarea 
                        name="address" value={storeInfo.address} onChange={handleChange} rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Card with Safe Inline SVGs */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 animate-[fadeInUp_0.5s_ease-out]">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-3">
                    <Users className="w-5 h-5 mr-2 text-blue-600" /> Social Media Links
                  </h2>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> 
                        Facebook Page URL
                      </label>
                      <input 
                        type="url" name="facebook" value={storeInfo.facebook} onChange={handleChange} placeholder="https://facebook.com/yourbrand"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-pink-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        Instagram URL
                      </label>
                      <input 
                        type="url" name="instagram" value={storeInfo.instagram} onChange={handleChange} placeholder="https://instagram.com/yourbrand"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-sky-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                        Twitter/X URL
                      </label>
                      <input 
                        type="url" name="twitter" value={storeInfo.twitter} onChange={handleChange} placeholder="https://twitter.com/yourbrand"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
};

export default AdminSettings;