import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  Search, Package, Truck, CheckCircle, Clock, 
  ArrowLeft, Loader2, XCircle, MapPin, Calendar, Home
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface Order {
  id: string;
  orderId: string;
  total: number;
  orderStatus: string;
  paymentMethod: string;
  items: OrderItem[];
  customerDetails: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: any;
}

const OrderTracking = () => {
  const { id } = useParams<{ id: string }>(); // URL থেকে ID নেওয়া
  const navigate = useNavigate();
  
  const [trackingId, setTrackingId] = useState(id || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!id);

  // অর্ডার খোঁজার ফাংশন
  const fetchOrderDetails = async (searchId: string) => {
    if (!searchId.trim()) {
      toast.error('Please enter a valid Order ID');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Order ID দিয়ে ডাটাবেজে খোঁজা (e.g., ORD-123456)
      const q = query(collection(db, 'orders'), where('orderId', '==', searchId.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const orderData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Order;
        setOrder(orderData);
      } else {
        setOrder(null);
        toast.error('No order found with this ID');
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      toast.error('Failed to track order');
    } finally {
      setIsLoading(false);
    }
  };

  // যদি URL এ ID থাকে, তবে পেজ লোড হতেই অর্ডার খুঁজবে
  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId) {
      navigate(`/order-tracking/${trackingId}`);
      fetchOrderDetails(trackingId);
    }
  };

  // টাইমলাইন লজিক
  const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const currentStepIndex = steps.indexOf(order?.orderStatus || 'Pending');
  const isCancelled = order?.orderStatus === 'Cancelled';

  // তারিখ ফরম্যাট
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    }).format(timestamp.toDate());
  };

  return (
    <>
      <Helmet>
        <title>Track Your Order | LoomoRA</title>
        <meta name="description" content="Track your LoomoRA order status." />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen py-10 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Back Button */}
          <div className="mb-8 animate-[fadeInUp_0.5s_ease-out]">
            <Link to="/account" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Account
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
              Track Your Order
            </h1>
            <p className="text-gray-500 mt-2">Enter your Order ID (e.g., ORD-123456) to check the current status of your shipment.</p>
          </div>

          {/* Search Box */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-8 animate-[fadeInUp_0.6s_ease-out]">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter Order ID..." 
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-gray-900 uppercase"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg active:scale-95 whitespace-nowrap"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Track Package'}
              </button>
            </form>
          </div>

          {/* Tracking Results */}
          {hasSearched && !isLoading && (
            <div className="animate-[fadeInUp_0.7s_ease-out]">
              {order ? (
                <div className="space-y-6">
                  
                  {/* Status Timeline Card */}
                  <div className="bg-white p-6 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-100 pb-6 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">Order Status</p>
                        <h2 className="text-2xl font-bold text-gray-900">{order.orderId}</h2>
                      </div>
                      <div className="text-left sm:text-right bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order Date</p>
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Animation */}
                    {isCancelled ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center bg-red-50 rounded-2xl border border-red-100">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h3 className="text-xl font-bold text-red-700 mb-2">Order Cancelled</h3>
                        <p className="text-red-500 max-w-md">This order has been cancelled. If you have made a payment, it will be refunded shortly.</p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-6 md:top-8 left-6 md:left-12 right-6 md:right-12 h-1 bg-gray-100 rounded-full z-0 hidden md:block">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                          ></div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-0">
                          {steps.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isActive = index === currentStepIndex;
                            
                            // Icons for steps
                            const StepIcon = index === 0 ? Clock : index === 1 ? Package : index === 2 ? Truck : CheckCircle;

                            return (
                              <div key={step} className="flex md:flex-col items-center gap-4 md:gap-3 relative">
                                
                                {/* Vertical line for mobile */}
                                {index !== steps.length - 1 && (
                                  <div className="absolute top-12 left-6 w-0.5 h-full bg-gray-100 md:hidden z-0">
                                    <div 
                                      className="w-full bg-blue-600 transition-all duration-1000 ease-out"
                                      style={{ height: isCompleted ? '100%' : '0%' }}
                                    ></div>
                                  </div>
                                )}

                                {/* Icon Circle */}
                                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 relative bg-white ${
                                  isActive ? 'border-blue-600 text-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-110' : 
                                  isCompleted ? 'border-blue-600 bg-blue-600 text-white' : 
                                  'border-gray-200 text-gray-300'
                                }`}>
                                  <StepIcon className={isActive || isCompleted ? 'w-5 h-5 md:w-6 md:h-6' : 'w-5 h-5 md:w-6 md:h-6'} />
                                </div>
                                
                                {/* Text */}
                                <div className="md:text-center pt-2 md:pt-0">
                                  <p className={`font-bold ${isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {step}
                                  </p>
                                  {isActive && <p className="text-xs text-gray-500 mt-1 animate-pulse">Current Status</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Delivery Address */}
                    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400" /> Delivery Address
                      </h3>
                      <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="font-bold text-gray-900 mb-1">Shipping To:</p>
                        <p>{order.customerDetails.address}</p>
                        <p>{order.customerDetails.city}, {order.customerDetails.state} {order.customerDetails.zipCode}</p>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-gray-400" /> Items in Order
                      </h3>
                      <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                            <img src={item.image} alt={item.name} className="w-12 h-16 object-cover rounded-lg border border-gray-200" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                              <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-600">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-medium text-gray-500">Total Amount:</span>
                        <span className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                /* Order Not Found State */
                <div className="bg-white p-12 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 text-center">
                  <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    We couldn't find an order with the ID <span className="font-bold text-gray-900">"{trackingId}"</span>. Please check the ID and try again.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default OrderTracking;