import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Menu, X, Tags, Settings, FileText,
  Search, Loader2, Filter, ChevronDown, CheckCircle, Clock, Truck, Eye
} from 'lucide-react';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}

interface Order {
  id: string;
  orderId: string;
  customerDetails: CustomerDetails;
  items: OrderItem[];
  total: number;
  orderStatus: string;
  paymentMethod: string;
  createdAt: any;
}

const ManageOrders = () => {
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal State for viewing order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ফায়ারবেস থেকে সব অর্ডার নিয়ে আসা
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // অর্ডারের স্ট্যাটাস আপডেট করা
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        orderStatus: newStatus
      });
      
      // UI আপডেট করা
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      ));
      
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // স্ট্যাটাস অনুযায়ী রং সেট করা
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // তারিখ ফরম্যাট
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(timestamp.toDate());
  };

  // সার্চ এবং ফিল্টার লজিক
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customerDetails.firstName} ${order.customerDetails.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Helmet>
        <title>Manage Orders | Admin | LoomoRA</title>
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
          <div className="p-4 flex items-center space-x-3 border-b border-gray-800">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-medium text-sm">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'Administrator'}</p>
            </div>
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
            <Link to="/admin/orders" className="flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors">
              <ShoppingBag className="w-5 h-5 mr-3" /> Orders
            </Link>
            <Link to="/admin/customers" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Users className="w-5 h-5 mr-3" /> Customers
            </Link>
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] overflow-hidden h-screen">
          
          <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 p-1"><Menu className="w-6 h-6" /></button>
            <span className="ml-4 font-semibold text-gray-900">Manage Orders</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Orders</h1>
              <p className="text-gray-500 text-sm mt-1">View, track, and update customer orders.</p>
            </div>

            {/* Toolbar (Search & Filter) */}
            <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by Order ID or Customer Name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm"
                />
              </div>
              <div className="relative w-full sm:w-48 flex-shrink-0">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 appearance-none text-sm cursor-pointer font-medium text-gray-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-b-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 border-t-0 overflow-hidden mb-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                  <p className="text-gray-500 text-sm">We couldn't find any orders matching your criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Info</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-blue-600">{order.orderId}</span>
                            <p className="text-xs text-gray-500 mt-1">{order.items.length} item(s)</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{order.customerDetails.firstName} {order.customerDetails.lastName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{order.customerDetails.email}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">${order.total.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center justify-center bg-gray-900 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-[fadeInUp_0.3s_ease-out]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm font-medium text-blue-600">{selectedOrder.orderId}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Product List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm flex items-center">
                      <ShoppingBag className="w-4 h-4 mr-2" /> Ordered Items
                    </div>
                    <div className="p-4 divide-y divide-gray-100">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-lg border border-gray-200" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                            <div className="text-xs text-gray-500 mt-1 flex gap-3">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-sm">${item.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  
                  {/* Status Updater */}
                  <div className="border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">
                      Update Status
                    </div>
                    <div className="p-4 space-y-3">
                      <select 
                        value={selectedOrder.orderStatus}
                        onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                        disabled={isUpdating}
                        className={`w-full px-3 py-2 border-2 rounded-lg outline-none font-semibold text-sm cursor-pointer ${getStatusStyle(selectedOrder.orderStatus)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      {isUpdating && <p className="text-xs text-blue-600 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Updating...</p>}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm flex items-center">
                      <Users className="w-4 h-4 mr-2" /> Customer Details
                    </div>
                    <div className="p-4 text-sm text-gray-600 space-y-2">
                      <p className="font-bold text-gray-900">{selectedOrder.customerDetails.firstName} {selectedOrder.customerDetails.lastName}</p>
                      <p>{selectedOrder.customerDetails.email}</p>
                      <p>{selectedOrder.customerDetails.phone}</p>
                      <div className="pt-2 mt-2 border-t border-gray-100">
                        <p className="font-medium text-gray-900 mb-1">Shipping Address:</p>
                        <p>{selectedOrder.customerDetails.address}</p>
                        <p>{selectedOrder.customerDetails.city}, {selectedOrder.customerDetails.state}</p>
                        <p>{selectedOrder.customerDetails.zipCode}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2" /> Payment Summary
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Method:</span>
                        <span className="font-medium uppercase">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 border-b border-gray-100 pb-2">
                        <span>Status:</span>
                        <span className={selectedOrder.paymentMethod === 'cod' && selectedOrder.orderStatus !== 'Delivered' ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                          {selectedOrder.paymentMethod === 'cod' && selectedOrder.orderStatus !== 'Delivered' ? 'Unpaid' : 'Paid'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="font-bold text-gray-900">Total Amount:</span>
                        <span className="font-bold text-blue-600 text-lg">${selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
};

export default ManageOrders;