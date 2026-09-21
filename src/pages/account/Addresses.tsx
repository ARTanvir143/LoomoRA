import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  User, MapPin, FileText, Settings, LogOut, Loader2, Plus, Edit2, Trash2, Home as HomeIcon, Briefcase, X
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

interface Address {
  id: string;
  type: string; // 'home' or 'office'
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

const Addresses = () => {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    type: 'home',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Load Addresses from Firestore Subcollection
  const fetchAddresses = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'addresses'));
      const addressData: Address[] = [];
      querySnapshot.forEach((doc) => {
        addressData.push({ id: doc.id, ...doc.data() } as Address);
      });
      setAddresses(addressData);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    const loadingToast = toast.loading(editingId ? 'Updating address...' : 'Saving address...');

    try {
      if (editingId) {
        // Update Address
        await updateDoc(doc(db, 'users', user.uid, 'addresses', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Address updated successfully!', { id: loadingToast });
      } else {
        // Add New Address
        await addDoc(collection(db, 'users', user.uid, 'addresses'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        toast.success('New address saved!', { id: loadingToast });
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ type: 'home', firstName: '', lastName: '', phone: '', street: '', city: '', state: '', zipCode: '' });
      fetchAddresses();
      
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      type: addr.type || 'home',
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'addresses', id));
        setAddresses(addresses.filter(a => a.id !== id));
        toast.success('Address deleted');
      } catch (error) {
        toast.error('Failed to delete address');
      }
    }
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Saved Addresses | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Saved Addresses</h1>
            <p className="text-gray-500 mt-1">Manage your shipping and billing addresses.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ================= SIDEBAR ================= */}
            <div className="w-full lg:w-1/4 hidden lg:block">
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden sticky top-28">
                <div className="p-6 border-b border-gray-50 text-center">
                  <div className="w-20 h-20 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                
                <nav className="p-3 space-y-1">
                  <Link to="/profile" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <User className="w-5 h-5 mr-3" /> Profile Info
                  </Link>
                  <Link to="/orders" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <FileText className="w-5 h-5 mr-3" /> Order History
                  </Link>
                  <div className="flex items-center px-4 py-3 text-blue-600 bg-blue-50 rounded-xl font-medium transition-colors cursor-pointer">
                    <MapPin className="w-5 h-5 mr-3" /> Saved Addresses
                  </div>
                  <Link to="/settings" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <Settings className="w-5 h-5 mr-3" /> Account Settings
                  </Link>
                  
                  <div className="border-t border-gray-100 my-2"></div>
                  
                  <button onClick={() => auth.signOut()} className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-left">
                    <LogOut className="w-5 h-5 mr-3" /> Sign Out
                  </button>
                </nav>
              </div>
            </div>

            {/* ================= MAIN CONTENT ================= */}
            <div className="w-full lg:w-3/4">
              
              {showForm ? (
                <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 md:p-8 animate-[fadeInUp_0.4s_ease-out]">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
                  </div>

                  <form onSubmit={handleSaveAddress} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Address Label</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.type === 'home' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          <input type="radio" name="type" value="home" checked={formData.type === 'home'} onChange={handleInputChange} className="hidden" />
                          <HomeIcon className="w-4 h-4" /> Home
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.type === 'office' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          <input type="radio" name="type" value="office" checked={formData.type === 'office'} onChange={handleInputChange} className="hidden" />
                          <Briefcase className="w-4 h-4" /> Office
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">First Name *</label>
                        <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Last Name *</label>
                        <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number *</label>
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Street Address *</label>
                        <input type="text" name="street" required value={formData.street} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">City *</label>
                        <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">State / Province</label>
                        <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">ZIP Code *</label>
                        <input type="text" name="zipCode" required value={formData.zipCode} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Address'}
                      </button>
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-end mb-2">
                    <button onClick={() => { setFormData({ type: 'home', firstName: '', lastName: '', phone: '', street: '', city: '', state: '', zipCode: '' }); setShowForm(true); }} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center shadow-sm">
                      <Plus className="w-4 h-4 mr-2" /> Add New Address
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 h-64 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                      <p className="text-gray-500 font-medium">Loading addresses...</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[40vh]">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <MapPin className="w-10 h-10 text-gray-300" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Addresses</h3>
                      <p className="text-gray-500 max-w-sm mx-auto mb-8">You haven't saved any delivery addresses yet. Add one to make checkout faster.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {addresses.map(addr => (
                        <div key={addr.id} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all relative group">
                          
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${addr.type === 'office' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                              {addr.type === 'office' ? <Briefcase className="w-3 h-3" /> : <HomeIcon className="w-3 h-3" />}
                              {addr.type}
                            </span>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(addr)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 mb-1">{addr.firstName} {addr.lastName}</h3>
                          <p className="text-gray-600 text-sm mb-2">{addr.phone}</p>
                          <div className="text-gray-500 text-sm leading-relaxed">
                            <p>{addr.street}</p>
                            <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Addresses;