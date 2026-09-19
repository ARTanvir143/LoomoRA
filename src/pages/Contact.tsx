import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Mail, Send, ChevronRight, Home, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const Contact = () => {
  // Store Settings State
  const [storeInfo, setStoreInfo] = useState({
    email: 'support@loomora.com',
    phone: '+1 (555) 000-0000',
    address: '123 Fashion Avenue\nNew York, NY 10012',
    facebook: '',
    instagram: '',
    twitter: ''
  });
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ফায়ারবেস থেকে স্টোরের সেটিংস (ঠিকানা, নম্বর) নিয়ে আসা
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'store_info');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoreInfo({
            email: data.email || 'support@loomora.com',
            phone: data.phone || '+1 (555) 000-0000',
            address: data.address || '123 Fashion Avenue\nNew York, NY 10012',
            facebook: data.facebook || '',
            instagram: data.instagram || '',
            twitter: data.twitter || ''
          });
        }
      } catch (error) {
        console.error('Error fetching store info:', error);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchStoreInfo();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // মেসেজ সাবমিট লজিক
    setTimeout(() => {
      toast.success('Your message has been sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | LoomoRA</title>
        <meta name="description" content="Get in touch with the LoomoRA team for any inquiries or support." />
      </Helmet>

      <div className="bg-white min-h-screen pb-20">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="bg-[#F8FAFC] pt-16 pb-12 px-4 border-b border-gray-100">
          <div className="max-w-7xl mx-auto text-center animate-[fadeInUp_0.8s_ease-out]">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Contact Us
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-6">
              We'd love to hear from you. Our friendly team is always here to chat and help you out.
            </p>
            
            <nav className="flex items-center justify-center text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600 flex items-center transition-colors"><Home className="w-4 h-4" /></Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <span className="text-gray-900 font-medium">Contact Us</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* ================= CONTACT INFO CARDS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            
            {/* Email Card */}
            <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col justify-center items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-500 mb-4 text-sm">Our friendly team is here to help.</p>
              {isLoadingInfo ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
              ) : (
                <a href={`mailto:${storeInfo.email}`} className="text-blue-600 font-bold hover:underline">
                  {storeInfo.email}
                </a>
              )}
            </div>

            {/* Visit Us Card */}
            <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col justify-center items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-500 mb-4 text-sm">Come say hello at our office HQ.</p>
              {isLoadingInfo ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
              ) : (
                <p className="text-gray-900 font-bold whitespace-pre-line">
                  {storeInfo.address}
                </p>
              )}
            </div>

            {/* Call Us Card */}
            <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col justify-center items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-500 mb-4 text-sm">Mon-Fri from 8am to 5pm.</p>
              {isLoadingInfo ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
              ) : (
                <a href={`tel:${storeInfo.phone}`} className="text-blue-600 font-bold hover:underline">
                  {storeInfo.phone}
                </a>
              )}
            </div>

          </div>

          {/* ================= SOCIAL MEDIA LINKS (Dynamic with Safe SVGs) ================= */}
          {(!isLoadingInfo && (storeInfo.facebook || storeInfo.instagram || storeInfo.twitter)) && (
            <div className="flex justify-center items-center gap-6 mb-16">
              {storeInfo.facebook && (
                <a href={storeInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-50 text-blue-600 border border-gray-200 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> 
                </a>
              )}
              {storeInfo.instagram && (
                <a href={storeInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-50 text-pink-600 border border-gray-200 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all shadow-sm hover:shadow-md">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {storeInfo.twitter && (
                <a href={storeInfo.twitter} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-50 text-sky-500 border border-gray-200 rounded-full flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all shadow-sm hover:shadow-md">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
              )}
            </div>
          )}

          {/* ================= CONTACT FORM SECTION ================= */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Left Image Side */}
            <div className="w-full lg:w-2/5 bg-[#0F172A] relative p-12 flex flex-col justify-between overflow-hidden min-h-[400px]">
              <div className="absolute inset-0 opacity-20">
                <img 
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000&auto=format&fit=crop" 
                  alt="Customer Support" 
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-white mb-4">Got a question?</h2>
                <p className="text-blue-100 text-lg leading-relaxed">
                  Whether you're curious about sizing, your order status, or our products—we're ready to answer any and all your questions.
                </p>
              </div>
              
              <div className="relative z-10 mt-12">
                <blockquote className="text-white border-l-4 border-blue-500 pl-4 italic opacity-90">
                  "LoomoRA's customer service is second to none. They resolved my sizing issue within minutes!"
                </blockquote>
                <p className="text-blue-200 text-sm mt-4 font-bold">— Sarah Jenkins, Customer</p>
              </div>
            </div>

            {/* Right Form Side */}
            <div className="w-full lg:w-3/5 p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message *</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    rows={5}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium resize-none"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending Message...</>
                  ) : (
                    <>Send Message <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Contact;