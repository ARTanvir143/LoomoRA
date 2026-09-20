import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authstore';
import { 
  User, MapPin, FileText, Settings, LogOut, Package, 
  ShoppingBag, Loader2, ArrowRight, Clock, CheckCircle, Truck
} from 'lucide-react';

interface OrderItem {
  id: string;
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
  createdAt: any;
}

const Orders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ইউজারের অর্ডারগুলো ফায়ারবেস থেকে নিয়ে আসা
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const ordersData: Order[] = [];
        
        querySnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() } as Order);
        });
        
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // অর্ডারের স্ট্যাটাস অনুযায়ী রং এবং আইকন সেট করা
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Processing</span>;
      case 'shipped':
        return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Shipped</span>;
      case 'delivered':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Delivered</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  // ফায়ারবেসের টাইমস্ট্যাম্পকে সুন্দর তারিখে রূপান্তর করা
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Order History | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order History</h1>
            <p className="text-gray-500 mt-1">View and track all your recent orders.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ================= SIDEBAR (Same as Profile) ================= */}
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
                  <Link to="/orders" className="flex items-center px-4 py-3 text-blue-600 bg-blue-50 rounded-xl font-medium transition-colors">
                    <FileText className="w-5 h-5 mr-3" /> Order History
                  </Link>
                  <Link to="/addresses" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <MapPin className="w-5 h-5 mr-3" /> Saved Addresses
                  </Link>
                  <Link to="/settings" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <Settings className="w-5 h-5 mr-3" /> Account Settings
                  </Link>
                </nav>
              </div>
            </div>

            {/* ================= MAIN CONTENT ================= */}
            <div className="w-full lg:w-3/4">
              
              {isLoading ? (
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 h-64 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-500">Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-8">
                    You haven't placed any orders yet. Start exploring our collections to find something you like.
                  </p>
                  <Link to="/shop" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center">
                    Start Shopping <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              ) : (
                /* Orders List */
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden transform transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                      
                      {/* Order Header */}
                      <div className="bg-gray-50/50 border-b border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full sm:w-auto">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Order Placed</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Amount</p>
                            <p className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Order ID</p>
                            <p className="text-sm font-semibold text-blue-600">{order.orderId}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                          {getStatusBadge(order.orderStatus)}
                          <Link to={`/order-tracking/${order.orderId}`} className="text-sm text-blue-600 font-medium hover:underline mt-2">
                            Track Package
                          </Link>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-4 sm:p-6 divide-y divide-gray-100">
                        {order.items.map((item, index) => (
                          <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                            <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link to={`/product/${item.id}`} className="text-sm sm:text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 sm:line-clamp-2 mb-1">
                                {item.name}
                              </Link>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-1.5">
                                {item.color && <span className="capitalize">Color: {item.color}</span>}
                                {item.size && <span className="uppercase">Size: {item.size}</span>}
                                <span>Qty: {item.quantity}</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900">${item.price.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              )}
              
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Orders;