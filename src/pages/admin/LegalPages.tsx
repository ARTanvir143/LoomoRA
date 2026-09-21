import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import JoditEditor from 'jodit-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Menu, X, Tags, Settings, FileText,
  Save, Loader2, ShieldAlert
} from 'lucide-react';

const AdminLegalPages = () => {
const { user } = useAuthStore();
  const editor = useRef(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Page states
  const [activeTab, setActiveTab] = useState('privacy-policy');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'privacy-policy', name: 'Privacy Policy' },
    { id: 'terms', name: 'Terms of Service' },
    { id: 'refund-policy', name: 'Refund Policy' },
  ];

  // ফায়ারবেস থেকে পেজের কনটেন্ট নিয়ে আসা
  const fetchPageContent = async (pageId: string) => {
    setIsLoading(true);
    try {
      const docRef = doc(db, 'legalPages', pageId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContent(docSnap.data().content);
      } else {
        setContent(''); // পেজ না থাকলে ফাঁকা দেখাবে
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
      toast.error('Failed to load page content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPageContent(activeTab);
  }, [activeTab]);

  // ফায়ারবেসে পেজের কনটেন্ট সেভ করা
  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'legalPages', activeTab), {
        title: tabs.find(t => t.id === activeTab)?.name,
        content: content,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email
      });
      
      toast.success(`${tabs.find(t => t.id === activeTab)?.name} updated successfully!`);
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Manage Legal Pages | Admin | LoomoRA</title>
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
            <Link to="/admin/customers" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Users className="w-5 h-5 mr-3" /> Customers
            </Link>
            <Link to="/admin/legal" className="flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors">
              <FileText className="w-5 h-5 mr-3" /> Legal Pages
            </Link>
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] overflow-hidden h-screen">
          
          <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 p-1"><Menu className="w-6 h-6" /></button>
            <span className="ml-4 font-semibold text-gray-900">Legal Pages</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Legal Pages</h1>
                <p className="text-gray-500 text-sm mt-1">Manage content for your store's legal pages.</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Save Changes
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
              
              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50 custom-scrollbar hide-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === tab.id 
                        ? 'border-blue-600 text-blue-600 bg-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Editor Area */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <p>Changes made here will directly update the <strong>{tabs.find(t => t.id === activeTab)?.name}</strong> page on the live website.</p>
                </div>

                <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden prose-editor min-h-[400px]">
                  {isLoading ? (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                      <p className="text-gray-500 text-sm">Loading page content...</p>
                    </div>
                  ) : (
                    <JoditEditor
                      ref={editor}
                      value={content}
                      config={{
                        readonly: false,
                        height: 500,
                        placeholder: `Write your ${tabs.find(t => t.id === activeTab)?.name} content here...`,
                      }}
                      onBlur={newContent => setContent(newContent)} // prefer onBlur for performance
                    />
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminLegalPages;