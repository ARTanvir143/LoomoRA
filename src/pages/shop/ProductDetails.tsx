import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { 
  Star, Minus, Plus, ShoppingBag, Heart, ShieldCheck, 
  Truck, RotateCcw, Loader2, ChevronRight, Home, ImagePlus, X, Edit2, Trash2, CheckCircle, Clock
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { uploadImageToCloudinary } from '../../services/cloudinary/upload';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sizes: string[];
  colors: string[];
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  verifiedPurchase?: boolean;
  purchasedSize?: string;
  purchasedColor?: string;
  createdAt: any;
}

const ProductDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const { addItem } = useCartStore(); 
  const { toggleItem, isInWishlist } = useWishlistStore(); 
  const { user } = useAuthStore(); 
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // === RECENTLY VIEWED PRODUCTS STATE ===
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // === REVIEW STATES ===
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWished = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'products'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0];
          const productData = { id: docData.id, ...docData.data() } as Product;
          setProduct(productData);
          
          if (productData.images && productData.images.length > 0) setSelectedImage(productData.images[0]);
          if (productData.sizes && productData.sizes.length > 0) setSelectedSize(productData.sizes[0]);
          if (productData.colors && productData.colors.length > 0) setSelectedColor(productData.colors[0]);

          // === SAVE TO RECENTLY VIEWED (LocalStorage) ===
          const rvStore = JSON.parse(localStorage.getItem('loomora_recently_viewed') || '[]');
          // Remove duplicate if exists, then add to front
          const updatedRv = [productData, ...rvStore.filter((p: Product) => p.id !== productData.id)].slice(0, 5);
          localStorage.setItem('loomora_recently_viewed', JSON.stringify(updatedRv));
          
          // Set state for UI (Excluding the current product)
          setRecentlyViewed(updatedRv.filter((p: Product) => p.id !== productData.id).slice(0, 4));

          // Fetch Reviews
          const reviewsQuery = query(collection(db, 'reviews'), where('productId', '==', productData.id));
          const reviewsSnapshot = await getDocs(reviewsQuery);
          const reviewsData: Review[] = [];
          reviewsSnapshot.forEach((rDoc) => {
            reviewsData.push({ id: rDoc.id, ...rDoc.data() } as Review);
          });
          
          reviewsData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setReviews(reviewsData);

        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      window.scrollTo(0, 0); // Scroll to top on slug change
      fetchProductAndReviews();
    }
  }, [slug]);

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (reviewFiles.length + files.length > 2) {
        toast.error('You can only upload up to 2 images');
        return;
      }
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      files.forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds the 2MB size limit.`);
        } else if (file.type.startsWith('image/')) {
          validFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        }
      });

      setReviewFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeReviewImage = (index: number) => {
    setReviewFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to submit a review');
    if (rating === 0) return toast.error('Please select a star rating');
    if (!comment.trim()) return toast.error('Please write a comment');

    setIsSubmittingReview(true);
    const loadingToast = toast.loading(editingReviewId ? 'Updating review...' : 'Checking purchase history & submitting...');

    try {
      let verifiedPurchase = false;
      let purchasedSize = '';
      let purchasedColor = '';

      if (!editingReviewId) {
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const ordersSnap = await getDocs(ordersQuery);
        
        for (const orderDoc of ordersSnap.docs) {
          const orderData = orderDoc.data();
          if (orderData.orderStatus === 'Delivered') {
            const foundItem = orderData.items?.find((i: any) => i.id === product!.id);
            if (foundItem) {
              verifiedPurchase = true;
              purchasedSize = foundItem.size || '';
              purchasedColor = foundItem.color || '';
              break; 
            }
          }
        }
      }

      let uploadedImageUrls: string[] = [];
      if (reviewFiles.length > 0) {
        const uploadPromises = reviewFiles.map(file => uploadImageToCloudinary(file));
        uploadedImageUrls = await Promise.all(uploadPromises);
      }

      const existingUrls = previewUrls.filter(url => url.startsWith('http'));
      const finalImages = [...existingUrls, ...uploadedImageUrls];

      const reviewData: any = {
        productId: product!.id,
        userId: user.uid,
        userName: user.name,
        rating,
        comment,
        images: finalImages,
        updatedAt: serverTimestamp(),
      };

      if (!editingReviewId && verifiedPurchase) {
        reviewData.verifiedPurchase = true;
        reviewData.purchasedSize = purchasedSize;
        reviewData.purchasedColor = purchasedColor;
      }

      if (editingReviewId) {
        await updateDoc(doc(db, 'reviews', editingReviewId), reviewData);
        setReviews(reviews.map(r => r.id === editingReviewId ? { ...r, ...reviewData } as Review : r));
        toast.success('Review updated successfully!', { id: loadingToast });
      } else {
        const docRef = await addDoc(collection(db, 'reviews'), { ...reviewData, createdAt: serverTimestamp() });
        setReviews([{ id: docRef.id, ...reviewData, createdAt: { toDate: () => new Date() } } as any, ...reviews]);
        toast.success(verifiedPurchase ? 'Verified review submitted! ✅' : 'Review submitted successfully!', { id: loadingToast });
      }
      
      setRating(0);
      setComment('');
      setReviewFiles([]);
      setPreviewUrls([]);
      setEditingReviewId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error('Error with review:', error);
      toast.error('Failed to submit review', { id: loadingToast });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditClick = (review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment);
    setPreviewUrls(review.images || []);
    setReviewFiles([]);
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteDoc(doc(db, 'reviews', reviewId));
        setReviews(reviews.filter(r => r.id !== reviewId));
        toast.success('Review deleted');
      } catch (error) {
        toast.error('Failed to delete review');
      }
    }
  };

  const decreaseQuantity = () => { if (quantity > 1) setQuantity(quantity - 1); };
  const increaseQuantity = () => {
    if (product && quantity < product.stock) setQuantity(quantity + 1);
    else toast.error('Maximum stock limit reached');
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes.length > 0 && !selectedSize) return toast.error('Please select a size');
    if (product.colors.length > 0 && !selectedColor) return toast.error('Please select a color');

    const cartItem = {
      id: product.id, name: product.name,
      price: product.discountPrice > 0 ? product.discountPrice : product.price,
      image: product.images[0], size: selectedSize, color: selectedColor,
      quantity: quantity, maxStock: product.stock
    };

    addItem(cartItem);
    toast.success('Added to shopping cart!');
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    toggleItem({
      id: product.id, name: product.name, slug: product.slug,
      price: product.discountPrice > 0 ? product.discountPrice : product.price,
      image: product.images[0]
    });
    if (isWished) toast.success('Removed from wishlist');
    else toast.success('Added to your wishlist!');
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">The product you are looking for might have been removed or is temporarily unavailable.</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Back to Shop</button>
      </div>
    );
  }

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (product.rating || 5).toFixed(1);
    
  const totalReviews = reviews.length > 0 ? reviews.length : product.reviewCount || 0;

  return (
    <>
      <Helmet>
        <title>{product.name} | LoomoRA</title>
        <meta name="description" content={`Buy ${product.name} at LoomoRA. Premium fashion.`} />
      </Helmet>

      <div className="bg-white min-h-screen pb-20">
        
        <div className="bg-[#F8FAFC] border-b border-gray-100 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600 flex items-center transition-colors"><Home className="w-4 h-4" /></Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <Link to="/shop" className="hover:text-blue-600 transition-colors">Shop</Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <span className="text-gray-900 font-medium truncate">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-12 mb-16">
            
            {/* ================= IMAGE GALLERY ================= */}
            <div className="w-full lg:w-1/2">
              <div className="flex flex-col-reverse md:flex-row gap-4">
                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 custom-scrollbar flex-shrink-0">
                  {product.images.map((img, index) => (
                    <button
                      key={index} onClick={() => setSelectedImage(img)}
                      className={`relative aspect-[3/4] w-20 md:w-full rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === img ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-gray-200'}`}
                    >
                      <img src={img} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="relative aspect-[3/4] w-full bg-gray-50 rounded-2xl overflow-hidden flex-grow border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <img src={selectedImage || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  {product.discountPrice > 0 && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">Sale</span>
                  )}
                </div>
              </div>
            </div>

            {/* ================= PRODUCT DETAILS ================= */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">{product.category}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">{product.name}</h1>
              
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-700">{avgRating}</span>
                <span className="text-sm text-gray-400 font-medium underline hover:text-gray-600">({totalReviews} reviews)</span>
              </div>

              <div className="flex items-end gap-3 mb-8">
                {product.discountPrice > 0 ? (
                  <>
                    <span className="text-3xl font-black text-gray-900">${product.discountPrice.toFixed(2)}</span>
                    <span className="text-xl text-gray-400 font-bold line-through mb-1">${product.price.toFixed(2)}</span>
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md mb-1 ml-2">Save ${(product.price - product.discountPrice).toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-3xl font-black text-gray-900">${product.price.toFixed(2)}</span>
                )}
              </div>

              <div className="h-px bg-gray-100 w-full mb-8"></div>

              {product.colors && product.colors.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-900">Color</span>
                    <span className="text-sm font-medium text-gray-500 capitalize">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)} className={`px-5 py-2.5 border rounded-xl text-sm font-bold transition-all capitalize ${selectedColor === color ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-200 text-gray-700 hover:border-gray-900'}`}>{color}</button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-900">Size</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)} className={`w-14 h-14 flex items-center justify-center border rounded-xl text-sm font-bold transition-all uppercase ${selectedSize === size ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-200 text-gray-700 hover:border-gray-900'}`}>{size}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-1 h-14 sm:w-32 bg-gray-50 flex-shrink-0">
                  <button onClick={decreaseQuantity} className="p-2 text-gray-500 hover:text-gray-900 transition-colors" disabled={quantity <= 1}><Minus className="w-4 h-4" /></button>
                  <span className="font-bold text-gray-900 w-8 text-center">{quantity}</span>
                  <button onClick={increaseQuantity} className="p-2 text-gray-500 hover:text-gray-900 transition-colors" disabled={quantity >= product.stock}><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={handleAddToCart} disabled={product.stock <= 0} className="flex-1 bg-blue-600 text-white h-14 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-[0_8px_20px_rgba(37,99,235,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg">
                  <ShoppingBag className="w-5 h-5" /> {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button onClick={handleAddToWishlist} className={`h-14 w-14 border rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${isWished ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-red-200 hover:text-red-500'}`}>
                  <Heart className={`w-5 h-5 transition-transform active:scale-75 ${isWished ? 'fill-red-500' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-8 text-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                <span className="font-bold text-gray-700">{product.stock > 10 ? 'In Stock and ready to ship' : product.stock > 0 ? `Only ${product.stock} items left in stock` : 'Currently unavailable'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 py-6 border-y border-gray-100">
                <div className="flex flex-col items-center justify-center text-center p-2"><ShieldCheck className="w-6 h-6 text-gray-400 mb-2" /><span className="text-xs font-bold text-gray-600">Secure Payment</span></div>
                <div className="flex flex-col items-center justify-center text-center p-2"><Truck className="w-6 h-6 text-gray-400 mb-2" /><span className="text-xs font-bold text-gray-600">Free Shipping</span></div>
                <div className="flex flex-col items-center justify-center text-center p-2"><RotateCcw className="w-6 h-6 text-gray-400 mb-2" /><span className="text-xs font-bold text-gray-600">30-Day Returns</span></div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Product Details</h3>
                <div className="prose prose-sm prose-blue max-w-none text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            </div>
          </div>

          {/* ================= REVIEWS & RATINGS SECTION ================= */}
          <div id="reviews-section" className="mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-8 text-center md:text-left">Customer Reviews</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Write/Edit Review Form */}
              <div className="lg:col-span-1" id="review-form">
                <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-gray-100 sticky top-28">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
                  </h3>
                  
                  {!user ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600 font-medium text-sm mb-4">You must be logged in to write a review.</p>
                      <Link to="/login" className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-colors inline-block shadow-sm">Sign In to Review</Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Your Rating *</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button" key={star}
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Your Review *</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                          placeholder="What did you like or dislike?"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium resize-none bg-white"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Add Photos <span className="text-gray-400 font-medium">(Max 2 images, 2MB each)</span>
                        </label>
                        <div className="flex flex-wrap gap-3 mb-2">
                          {previewUrls.map((url, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden group">
                              <img src={url} alt="preview" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeReviewImage(idx)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          ))}
                          {previewUrls.length < 2 && (
                            <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors bg-white">
                              <ImagePlus className="w-5 h-5 text-gray-400" />
                              <input type="file" accept="image/*" multiple onChange={handleReviewImageChange} className="hidden" ref={fileInputRef} />
                            </label>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={isSubmittingReview} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center shadow-md">
                          {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : editingReviewId ? 'Update Review' : 'Submit Review'}
                        </button>
                        {editingReviewId && (
                          <button type="button" onClick={() => { setEditingReviewId(null); setRating(0); setComment(''); setPreviewUrls([]); }} className="px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold">No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative group hover:border-blue-100 transition-colors">
                      
                      {user && user.uid === review.userId && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(review)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit Review">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteReview(review.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Review">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                            {review.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{review.userName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="text-xs font-medium text-gray-400">
                                {review.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(review.createdAt.toDate()) : 'Just now'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {review.verifiedPurchase && (
                        <div className="mb-3 inline-flex items-center flex-wrap gap-2 bg-green-50 border border-green-100 text-green-700 text-[10px] sm:text-xs font-bold tracking-wide px-2.5 py-1.5 rounded-lg shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified Purchase
                          {(review.purchasedSize !== 'N/A' || review.purchasedColor !== 'N/A') && (
                            <span className="border-l border-green-200 pl-2 flex items-center gap-2">
                              {review.purchasedColor && review.purchasedColor !== 'N/A' && (
                                <span className="flex items-center gap-1 capitalize">
                                  <span className="w-2.5 h-2.5 rounded-full border border-green-300" style={{ backgroundColor: review.purchasedColor }}></span>
                                  {review.purchasedColor}
                                </span>
                              )}
                              {review.purchasedSize && review.purchasedSize !== 'N/A' && (
                                <span className="uppercase">Size: {review.purchasedSize}</span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 font-medium">{review.comment}</p>
                      
                      {review.images && review.images.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                          {review.images.map((imgUrl, idx) => (
                            <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity cursor-zoom-in shadow-sm">
                              <img src={imgUrl} alt="Review attachment" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>
              
            </div>
          </div>

          {/* ================= RECENTLY VIEWED PRODUCTS ================= */}
          {recentlyViewed.length > 0 && (
            <div className="mt-20 pt-16 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-8">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-black text-gray-900">Recently Viewed</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recentlyViewed.map((rvProduct) => (
                  <Link key={rvProduct.id} to={`/product/${rvProduct.slug}`} className="group block bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="relative aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden mb-3">
                      <img src={rvProduct.images[0]} alt={rvProduct.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{rvProduct.category}</p>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">{rvProduct.name}</h3>
                      <p className="text-sm font-black text-gray-900">${(rvProduct.discountPrice || rvProduct.price).toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ProductDetails;