import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

import { upload3DModelToCloudinary } from '../../services/cloudinary/upload';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Menu, X, Tags, Settings, FileText,
  UploadCloud, Loader2, Trash2, Box, Cuboid
} from 'lucide-react';

interface Model3D {
  id: string;
  title: string;
  modelUrl: string;
  createdAt: any;
}

const Manage3DModels = () => {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [models, setModels] = useState<Model3D[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ফায়ারবেস থেকে আপলোড করা মডেলগুলো নিয়ে আসা
  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, '3d_models'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const modelsData: Model3D[] = [];
      querySnapshot.forEach((doc) => {
        modelsData.push({ id: doc.id, ...doc.data() } as Model3D);
      });
      
      setModels(modelsData);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load 3D models');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // ফাইল হ্যান্ডলার
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'glb' || fileExtension === 'gltf') {
        setFile(selectedFile);
      } else {
        toast.error('Only .glb and .gltf files are supported');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // মডেল আপলোড করা (Cloudinary + Firestore)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      toast.error('Please provide a title and select a 3D model file');
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Uploading 3D model... This might take a minute.');

    try {
      // 1. Upload to Cloudinary
      const modelUrl = await upload3DModelToCloudinary(file);

      // 2. Save URL to Firestore
      await addDoc(collection(db, '3d_models'), {
        title,
        modelUrl,
        createdAt: serverTimestamp(),
      });

      toast.success('3D Model uploaded successfully!', { id: loadingToast });
      
      // Form Reset
      setTitle('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh List
      fetchModels();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload 3D model', { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  // মডেল ডিলিট করা
  const handleDelete = async (id: string, modelTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${modelTitle}"? This will remove it from the homepage carousel.`)) {
      try {
        await deleteDoc(doc(db, '3d_models', id));
        setModels(models.filter(m => m.id !== id));
        toast.success('Model deleted successfully');
      } catch (error) {
        toast.error('Failed to delete model');
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Manage 3D Models | Admin | LoomoRA</title>
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
            <Link to="/admin/orders" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <ShoppingBag className="w-5 h-5 mr-3" /> Orders
            </Link>
            {/* 3D Models Tab */}
            <div className="flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors cursor-pointer">
              <Box className="w-5 h-5 mr-3" /> 3D Models
            </div>
            <Link to="/admin/legal" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <FileText className="w-5 h-5 mr-3" /> Legal Pages
            </Link>
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] overflow-hidden h-screen">
          
          <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 p-1"><Menu className="w-6 h-6" /></button>
            <span className="ml-4 font-semibold text-gray-900">Manage 3D Models</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">3D Fashion Showcase</h1>
              <p className="text-gray-500 text-sm mt-1">Upload and manage .glb/.gltf models for the homepage carousel.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* UPLOAD FORM */}
              <div className="xl:col-span-1">
                <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 sticky top-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                    <UploadCloud className="w-5 h-5 mr-2 text-blue-600" /> Upload New Model
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Model Title</label>
                      <input 
                        type="text" 
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Premium Leather Bag"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">3D File (.glb or .gltf)</label>
                      <label className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/50'}`}>
                        <Cuboid className={`w-8 h-8 mb-2 ${file ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-700 text-center">
                          {file ? file.name : 'Click to select a file'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">Max size: 10MB recommended</span>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept=".glb,.gltf" 
                          onChange={handleFileChange}
                          className="hidden" 
                        />
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={isUploading}
                      className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                    >
                      {isUploading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</>
                      ) : 'Upload Model'}
                    </button>
                  </div>
                </form>
              </div>

              {/* UPLOADED MODELS LIST */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Active Models on Homepage</h2>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                      <p className="text-gray-500">Loading models...</p>
                    </div>
                  ) : models.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                      <Box className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No 3D Models Uploaded</h3>
                      <p className="text-gray-500 text-sm max-w-sm">Upload your first 3D model to showcase it on the homepage carousel.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {models.map((model) => (
                        <div key={model.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
                              <Cuboid className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-sm font-bold text-gray-900">{model.title}</h3>
                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px] sm:max-w-md">
                                {model.modelUrl}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDelete(model.id, model.title)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-4 flex-shrink-0"
                            title="Remove Model"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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

export default Manage3DModels;