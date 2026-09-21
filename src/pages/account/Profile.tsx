import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Loader2, Save, MapPin, FileText, Settings, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, setUser, isLoading: isAuthLoading } = useAuthStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ইউজার না থাকলে লগইন পেজে পাঠিয়ে দেওয়া
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login');
    } else if (user) {
      setName(user.name);
    }
  }, [user, isAuthLoading, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      // ১. Firebase Auth এ নাম আপডেট করা
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name
        });
      }

      // ২. Firestore ডাটাবেজে নাম আপডেট করা
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          name: name
        });

        // ৩. Zustand Store আপডেট করা
        setUser({ ...user, name: name });
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null; // রিডাইরেক্ট হওয়ার আগ পর্যন্ত কিছু দেখাবে না

  return (
    <>
      <Helmet>
        <title>My Profile | LoomoRA</title>
        <meta name="description" content="Manage your LoomoRA account profile and settings." />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Account</h1>
            <p className="text-gray-500 mt-1">Manage your personal information and preferences.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ================= SIDEBAR ================= */}
            <div className="w-full lg:w-1/4">
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden sticky top-28">
                <div className="p-6 border-b border-gray-50 text-center">
                  <div className="w-20 h-20 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                
                <nav className="p-3 space-y-1">
                  <Link to="/profile" className="flex items-center px-4 py-3 text-blue-600 bg-blue-50 rounded-xl font-medium transition-colors">
                    <User className="w-5 h-5 mr-3" /> Profile Info
                  </Link>
                  <Link to="/orders" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <FileText className="w-5 h-5 mr-3" /> Order History
                  </Link>
                  <Link to="/addresses" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <MapPin className="w-5 h-5 mr-3" /> Saved Addresses
                  </Link>
                  <Link to="/settings" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <Settings className="w-5 h-5 mr-3" /> Account Settings
                  </Link>
                  
                  <div className="border-t border-gray-100 my-2"></div>
                  
                  <button 
                    onClick={() => auth.signOut()}
                    className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-left"
                  >
                    <LogOut className="w-5 h-5 mr-3" /> Sign Out
                  </button>
                </nav>
              </div>
            </div>

            {/* ================= MAIN CONTENT ================= */}
            <div className="w-full lg:w-3/4">
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 md:p-8 transform transition-all animate-[fadeInUp_0.4s_ease-out]">
                
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  Personal Information
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                  
                  {/* Account Role Badge (Read Only) */}
                  <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100 w-fit">
                    <Shield className={`w-5 h-5 ${user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`} />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      Account Type: <span className="font-bold">{user.role}</span>
                    </span>
                  </div>

                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white transition-all text-gray-900 outline-none"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Email Field (Read Only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                      Email Address <span className="text-gray-400 font-normal text-xs ml-1">(Cannot be changed)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={user.email}
                        readOnly
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving || name === user.name} // নাম পরিবর্তন না হলে বাটন ডিজেবল থাকবে
                      className="bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;