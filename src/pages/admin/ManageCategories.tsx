import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { uploadImageToCloudinary } from '../../services/cloudinary/upload';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Package, ShoppingBag, Menu, X, Tags,
  UploadCloud, Loader2, Trash2, Box, Image as ImageIcon, Edit2, DownloadCloud
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  createdAt: any;
}

// ডিফল্ট ক্যাটাগরিগুলো ডাটাবেজে ইমপোর্ট করার জন্য
const defaultCategoriesData = [
  { slug: 'women', name: "Women's Collection", description: "Elegance redefined. Explore our latest women's fashion.", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop" },
  { slug: 'men', name: "Men's Classics", description: "Sharp, modern, and timeless pieces for him.", image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1000&auto=format&fit=crop" },
  { slug: 'accessories', name: "Premium Accessories", description: "The perfect details to complete your look.", image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=1000&auto=format&fit=crop" },
  { slug: 'shoes', name: "Footwear", description: "Step up your style with our premium shoes.", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop" },
  { slug: 'kids', name: "Kids' Apparel", description: "Playful, comfortable, and durable clothing.", image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?q=80&w=1000&auto=format&fit=crop" }
];

const ManageCategories = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string>(''); // এডিটের সময় আগের ছবি দেখানোর জন্য
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ফায়ারবেস থেকে ক্যাটাগরি লোড করা
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const categoriesData: Category[] = [];
      querySnapshot.forEach((doc) => {
        categoriesData.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // ডিফল্ট ক্যাটাগরিগুলো ডাটাবেজে সেভ করার জাদুকরী বাটন
  const handleSeedDefaults = async () => {
    if (!window.confirm('Do you want to import the default categories into your database?')) return;
    
    setIsUploading(true);
    const toastId = toast.loading('Importing default categories...');
    try {
      for (const cat of defaultCategoriesData) {
        await addDoc(collection(db, 'categories'), {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          createdAt: serverTimestamp(),
        });
      }
      toast.success('Default categories imported successfully!', { id: toastId });
      fetchCategories();
    } catch (error) {
      toast.error('Failed to import categories', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
      } else {
        toast.error('Please select a valid image file');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // অ্যাড এবং আপডেট (Edit) ফাংশন
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      return toast.error('Name and description are required');
    }
    if (!editingId && !file) {
      return toast.error('Please select an image for the new category');
    }

    setIsUploading(true);
    const loadingToast = toast.loading(editingId ? 'Updating category...' : 'Adding category...');

    try {
      let imageUrl = existingImage;
      
      // নতুন ছবি সিলেক্ট করলে Cloudinary তে আপলোড হবে
      if (file) {
        imageUrl = await uploadImageToCloudinary(file);
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      if (editingId) {
        // Update Existing
        await updateDoc(doc(db, 'categories', editingId), {
          name, slug, description, image: imageUrl
        });
        toast.success('Category updated successfully!', { id: loadingToast });
      } else {
        // Add New
        await addDoc(collection(db, 'categories'), {
          name, slug, description, image: imageUrl, createdAt: serverTimestamp(),
        });
        toast.success('Category added successfully!', { id: loadingToast });
      }
      
      // Reset Form
      cancelEdit();
      fetchCategories();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save category', { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description);
    setExistingImage(cat.image);
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setExistingImage('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, catName: string) => {
    if (window.confirm(`Are you sure you want to delete "${catName}"?`)) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        setCategories(categories.filter(c => c.id !== id));
        toast.success('Category deleted successfully');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Manage Categories | Admin | LoomoRA</title>
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
            <div className="flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors cursor-pointer">
              <Tags className="w-5 h-5 mr-3" /> Categories
            </div>
            <Link to="/admin/orders" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <ShoppingBag className="w-5 h-5 mr-3" /> Orders
            </Link>
            <Link to="/admin/3d-models" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Box className="w-5 h-5 mr-3" /> 3D Models
            </Link>
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] overflow-hidden h-screen">
          <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 p-1"><Menu className="w-6 h-6" /></button>
            <span className="ml-4 font-semibold text-gray-900">Manage Categories</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Categories</h1>
                <p className="text-gray-500 text-sm mt-1">Add, edit, and manage product categories.</p>
              </div>
              
              {/* Import Defaults Button */}
              <button 
                onClick={handleSeedDefaults}
                disabled={isUploading}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center shadow-sm"
              >
                <DownloadCloud className="w-5 h-5 mr-2 text-blue-600" /> Import Default Categories
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* === ADD / EDIT FORM === */}
              <div className="xl:col-span-1">
                <form onSubmit={handleSaveCategory} className={`p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border sticky top-4 transition-colors ${editingId ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100'}`}>
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                      {editingId ? <Edit2 className="w-5 h-5 mr-2 text-blue-600" /> : <UploadCloud className="w-5 h-5 mr-2 text-blue-600" />}
                      {editingId ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    {editingId && (
                      <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name *</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm bg-white" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                      <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm resize-none bg-white" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image {editingId ? '(Optional to change)' : '*'}</label>
                      
                      {/* Show existing image during edit */}
                      {editingId && existingImage && !file && (
                        <div className="mb-3 relative rounded-xl overflow-hidden border border-gray-200 h-32">
                          <img src={existingImage} alt="Current" className="w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 flex items-center justify-center font-medium text-gray-900 drop-shadow-md">Current Image</div>
                        </div>
                      )}

                      <label className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-white ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
                        <ImageIcon className={`w-8 h-8 mb-2 ${file ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-700 text-center">
                          {file ? file.name : (editingId ? 'Select new image' : 'Click to upload image')}
                        </span>
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={isUploading} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center shadow-sm">
                        {isUploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : (editingId ? 'Update' : 'Add Category')}
                      </button>
                      {editingId && (
                         <button type="button" onClick={cancelEdit} className="px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors">Cancel</button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* === CATEGORIES LIST === */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Active Categories</h2>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center h-64 items-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                      <Tags className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Categories Found</h3>
                      <p className="text-gray-500 text-sm mb-4">Click "Import Default Categories" or create a new one.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                      {categories.map((category) => (
                        <div key={category.id} className="border border-gray-100 rounded-2xl overflow-hidden group hover:shadow-md transition-shadow relative">
                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(category)} className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-sm" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(category.id, category.name)} className="p-2 bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="aspect-video w-full bg-gray-100 overflow-hidden relative">
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <h3 className="absolute bottom-3 left-4 font-bold text-white text-lg">{category.name}</h3>
                          </div>
                          <div className="p-4 bg-white">
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{category.description}</p>
                            <span className="inline-block text-[10px] font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                              Slug: {category.slug}
                            </span>
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

export default ManageCategories;