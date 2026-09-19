import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { uploadImageToCloudinary } from '../../services/cloudinary/upload';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Menu, X, Tags, Settings, FileText,
  UploadCloud, Loader2, Trash2, Box, Image as ImageIcon, Megaphone, Link as LinkIcon, Power, Edit2
} from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkTo: string;
  position: string;
  isActive: boolean;
  createdAt: any;
}

const ManageBanners = () => {
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [linkTo, setLinkTo] = useState('');
  const [position, setPosition] = useState('hero');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [existingImage, setExistingImage] = useState<string>(''); // এডিটের সময় আগের ছবি
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const bannersData: Banner[] = [];
      querySnapshot.forEach((doc) => {
        bannersData.push({ id: doc.id, ...doc.data() } as Banner);
      });
      
      setBanners(bannersData);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        toast.error('Please select a valid image file');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // ব্যানার সেভ বা আপডেট করা
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !linkTo.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!editingId && !file) {
      toast.error('Please select an image for the new banner');
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading(editingId ? 'Updating banner...' : 'Uploading banner...');

    try {
      let finalImageUrl = existingImage;

      // নতুন ছবি সিলেক্ট করলে সেটি আপলোড হবে
      if (file) {
        finalImageUrl = await uploadImageToCloudinary(file);
      }

      if (editingId) {
        // Update
        await updateDoc(doc(db, 'banners', editingId), {
          title,
          linkTo: linkTo.toLowerCase().trim(),
          position,
          imageUrl: finalImageUrl
        });
        toast.success('Banner updated successfully!', { id: loadingToast });
      } else {
        // Create
        await addDoc(collection(db, 'banners'), {
          title,
          linkTo: linkTo.toLowerCase().trim(),
          position,
          imageUrl: finalImageUrl,
          isActive: true,
          createdAt: serverTimestamp(),
        });
        toast.success('Banner added successfully!', { id: loadingToast });
      }
      
      cancelEdit();
      fetchBanners();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save banner', { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = (banner: Banner) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setLinkTo(banner.linkTo);
    setPosition(banner.position);
    setExistingImage(banner.imageUrl);
    setFile(null);
    setPreviewUrl('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setLinkTo('');
    setPosition('hero');
    setExistingImage('');
    setFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, bannerTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${bannerTitle}"?`)) {
      try {
        await deleteDoc(doc(db, 'banners', id));
        setBanners(banners.filter(b => b.id !== id));
        toast.success('Banner deleted');
      } catch (error) {
        toast.error('Failed to delete banner');
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'banners', id), { isActive: !currentStatus });
      setBanners(banners.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b));
      toast.success(`Banner ${!currentStatus ? 'Activated' : 'Deactivated'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <>
      <Helmet>
        <title>Manage Banners | Admin | LoomoRA</title>
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
            
            {/* Active Banners Tab */}
            <div className="flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors cursor-pointer">
              <Megaphone className="w-5 h-5 mr-3" /> Banners & Ads
            </div>

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
            <Link to="/admin/settings" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Settings className="w-5 h-5 mr-3" /> Settings
            </Link>
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] overflow-hidden h-screen">
          <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 p-1"><Menu className="w-6 h-6" /></button>
            <span className="ml-4 font-semibold text-gray-900">Manage Banners</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Promotional Banners</h1>
              <p className="text-gray-500 text-sm mt-1">Upload and edit banners to display on your shop page.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* === ADD/EDIT FORM === */}
              <div className="xl:col-span-1">
                <form onSubmit={handleSaveBanner} className={`p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border sticky top-4 transition-colors ${editingId ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100'}`}>
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                      {editingId ? <Edit2 className="w-5 h-5 mr-2 text-blue-600" /> : <UploadCloud className="w-5 h-5 mr-2 text-blue-600" />}
                      {editingId ? 'Edit Banner' : 'Add New Banner'}
                    </h2>
                    {editingId && (
                      <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Banner Title / Name *</label>
                      <input 
                        type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Summer Mega Sale"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-gray-400" /> Link to Category Slug *
                      </label>
                      <input 
                        type="text" required value={linkTo} onChange={(e) => setLinkTo(e.target.value)}
                        placeholder="e.g., combo, skin-care, men"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Banner Position *</label>
                      <select 
                        value={position} onChange={(e) => setPosition(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm bg-white cursor-pointer"
                      >
                        <option value="hero">Hero Slider (Top of Shop)</option>
                        <option value="category">Category Break (Middle Banner)</option>
                        <option value="flash">Flash Sale (Small Banner)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Banner Image {editingId ? '(Optional to change)' : '*'}</label>
                      
                      {/* Show existing image during edit */}
                      {editingId && existingImage && !file && !previewUrl && (
                        <div className="mb-3 relative rounded-xl overflow-hidden border border-gray-200 h-32">
                          <img src={existingImage} alt="Current" className="w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 flex items-center justify-center font-medium text-gray-900 drop-shadow-md bg-black/10">Current Image</div>
                        </div>
                      )}

                      {previewUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 group h-32 mb-3">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { setFile(null); setPreviewUrl(''); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                            Change Image
                          </button>
                        </div>
                      ) : (
                        <label className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-white ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
                          <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 text-center">{editingId ? 'Select new image' : 'Click to upload banner'}</span>
                          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit" disabled={isUploading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center shadow-md"
                      >
                        {isUploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : (editingId ? 'Update Banner' : 'Upload Banner')}
                      </button>
                      {editingId && (
                        <button type="button" onClick={cancelEdit} className="px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors">Cancel</button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* === BANNERS LIST === */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Active Banners</h2>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center h-64 items-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  ) : banners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                      <Megaphone className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Banners Found</h3>
                      <p className="text-gray-500 text-sm mb-4">Upload your first promotional banner to display on the shop.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {banners.map((banner) => (
                        <div key={banner.id} className={`p-4 sm:p-6 transition-colors ${!banner.isActive ? 'bg-gray-50/50 opacity-75' : 'bg-white hover:bg-gray-50/30'}`}>
                          <div className="flex flex-col sm:flex-row gap-5">
                            
                            {/* Banner Image Preview */}
                            <div className="w-full sm:w-48 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 relative group">
                              <img src={banner.imageUrl} alt={banner.title} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!banner.isActive ? 'grayscale' : ''}`} />
                              {!banner.isActive && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/60 px-2 py-1 rounded">Hidden</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Banner Details & Actions */}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <h3 className="text-base font-bold text-gray-900">{banner.title}</h3>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                    banner.position === 'hero' ? 'bg-purple-100 text-purple-700' : 
                                    banner.position === 'flash' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {banner.position}
                                  </span>
                                </div>
                                <p className="text-sm text-blue-600 font-medium flex items-center mt-2">
                                  <LinkIcon className="w-3.5 h-3.5 mr-1" /> Links to: <span className="uppercase ml-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{banner.linkTo}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                <button 
                                  onClick={() => handleEditClick(banner)}
                                  className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                                </button>
                                <button 
                                  onClick={() => toggleStatus(banner.id, banner.isActive)}
                                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    banner.isActive ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-green-600 bg-green-50 hover:bg-green-100'
                                  }`}
                                >
                                  <Power className="w-4 h-4 mr-1.5" /> {banner.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button 
                                  onClick={() => handleDelete(banner.id, banner.title)}
                                  className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
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

export default ManageBanners;