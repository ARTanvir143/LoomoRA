import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import JoditEditor from 'jodit-react';
import { collection, doc, getDoc, updateDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { uploadImageToCloudinary } from '../../services/cloudinary/upload';
import toast from 'react-hot-toast';
import { ArrowLeft, UploadCloud, X, Loader2, Save, Image as ImageIcon } from 'lucide-react';

interface CategoryOption {
  name: string;
  slug: string;
}

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editor = useRef(null);

  // Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState(''); // NEW: SKU State
  const [brand, setBrand] = useState(''); // NEW: Brand State
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [sizes, setSizes] = useState(''); 
  const [colors, setColors] = useState(''); 
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  // Dynamic Categories State
  const [dbCategories, setDbCategories] = useState<CategoryOption[]>([]);
  
  // Loading States
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ১. ডাটাবেজ থেকে ক্যাটাগরিগুলো লোড করা
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const fetchedCats: CategoryOption[] = [];
        snapshot.forEach((doc) => {
          fetchedCats.push({ name: doc.data().name, slug: doc.data().slug });
        });
        setDbCategories(fetchedCats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // ২. ডাটাবেজ থেকে নির্দিষ্ট প্রোডাক্টের আগের ডাটা লোড করা
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      setIsLoadingData(true);
      
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setSku(data.sku || ''); // Load SKU
          setBrand(data.brand || ''); // Load Brand
          setCategory(data.category || '');
          setPrice(data.price || '');
          setDiscountPrice(data.discountPrice || '');
          setStock(data.stock || 0);
          setSizes(data.sizes ? data.sizes.join(', ') : '');
          setColors(data.colors ? data.colors.join(', ') : '');
          setDescription(data.description || '');
          setIsFeatured(data.isFeatured || false);
          setImages(data.images || []);
        } else {
          toast.error("Product not found!");
          navigate('/admin/products');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product details");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProductDetails();
  }, [id, navigate]);

  // ছবি আপলোডের ফাংশন (Cloudinary)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImageToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setImages(prev => [...prev, ...uploadedUrls]);
      toast.success('Images uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload images. Check Cloudinary settings.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // প্রোডাক্ট আপডেট করার ফাংশন (Firestore)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !category || price === '' || stock === '') {
      toast.error('Please fill all required fields');
      return;
    }
    if (images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }
    if (!id) return;

    setIsSaving(true);
    const loadingToast = toast.loading('Updating product...');

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const updatedData = {
        name,
        slug,
        sku: sku.trim().toUpperCase(),
        brand: brand.trim(),
        category,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : 0,
        stock: Number(stock),
        sizes: sizes ? sizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [],
        colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        description,
        isFeatured,
        images,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'products', id), updatedData);
      
      toast.success('Product updated successfully!', { id: loadingToast });
      navigate('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-bold">Loading product details...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Product | Admin | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen py-8 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-4">
              <Link to="/admin/products" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Product</h1>
                <p className="text-gray-500 text-sm mt-1">Update product details and inventory.</p>
              </div>
            </div>
            <button 
              onClick={handleUpdate}
              disabled={isSaving || isUploading}
              className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Info */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-5">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Product Name *</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {/* NEW: Brand Name */}
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Brand Name</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white"
                      placeholder="e.g. Zara, Nike (Optional)"
                    />
                  </div>

                  {/* NEW: SKU */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white uppercase"
                      placeholder="e.g. TSH-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
                    <select
                      value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white cursor-pointer"
                    >
                      <option value="">Select a Category</option>
                      {dbCategories.map(cat => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Stock Quantity *</label>
                    <input
                      type="number" value={stock} onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Rich Text Description */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Product Description</h2>
                <div className="prose-editor">
                  <JoditEditor ref={editor} value={description} config={{ readonly: false, height: 300 }} onBlur={newContent => setDescription(newContent)} />
                </div>
              </div>

              {/* Variants */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-5">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Variants</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Available Sizes</label>
                    <input
                      type="text" value={sizes} onChange={(e) => setSizes(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white uppercase"
                      placeholder="e.g. S, M, L, XL"
                    />
                    <p className="text-xs font-medium text-gray-500 mt-1">Separate sizes with commas</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Available Colors</label>
                    <input
                      type="text" value={colors} onChange={(e) => setColors(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white capitalize"
                      placeholder="e.g. Black, White, Navy"
                    />
                    <p className="text-xs font-medium text-gray-500 mt-1">Separate colors with commas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Images & Pricing */}
            <div className="space-y-6">
              
              {/* Pricing */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-5">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Pricing</h2>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Regular Price ($) *</label>
                  <input
                    type="number" value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white"
                    min="0" step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Discount Price ($)</label>
                  <input
                    type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white"
                    placeholder="(Optional)" min="0" step="0.01"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Mark as Featured Product</span>
                  </label>
                </div>
              </div>

              {/* Images (Cloudinary) */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
                  Product Images *
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">Cloudinary</span>
                </h2>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group rounded-xl border border-gray-200 overflow-hidden aspect-square bg-gray-50">
                      <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                      <button 
                        type="button" onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-700 shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <label className={`border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer transition-colors bg-gray-50 ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:bg-blue-50 hover:border-blue-400'}`}>
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs font-bold text-gray-600 text-center px-2">Upload Image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProduct;