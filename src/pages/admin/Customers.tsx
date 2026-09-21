import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Menu, X, Tags, Settings, FileText,
  Search, Loader2, Eye, Box, MapPin, Calendar, Clock
} from 'lucide-react';

// Interfaces
interface PurchasedItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
  orderId: string;
  purchaseDate: any;
}

interface Customer {
  id: string;
  uid: string;
  name: string;
  email: string;
  createdAt: any;
  totalOrders: number;
  totalSpent: number;
  purchasedItems: PurchasedItem[];
}

const AdminCustomers = () => {
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // ఫায়ারবেস থেকে কাস্টমার এবং তাদের অর্ডারের বিস্তারিত তথ্য নিয়ে আসা
  useEffect(() => {
    const fetchCustomersAndOrders = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch all users who are 'customer'
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'customer'));
        const usersSnapshot = await getDocs(usersQuery);
        
        // 2. Fetch all orders to calculate total spent and extract variant details
        const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        const allOrders = ordersSnapshot.docs.map(doc => doc.data());

        const customersData: Customer[] = [];

        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          
          // Filter orders for this specific customer
          const customerOrders = allOrders.filter(order => order.userId === userData.uid);
          
          // Calculate total spent
          const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
          
          // Extract exact variant details (Size, Color, Qty) for everything they bought
          const purchasedItems: PurchasedItem[] = [];
          customerOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                purchasedItems.push({
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  image: item.image,
                  size: item.size || 'N/A',
                  color: item.color || 'N/A',
                  orderId: order.orderId,
                  purchaseDate: order.createdAt
                });
              });
            }
          });

          customersData.push({
            id: userDoc.id,
            uid: userData.uid,
            name: userData.name || 'Unknown',
            email: userData.email,
            createdAt: userData.createdAt,
            totalOrders: customerOrders.length,
            totalSpent: totalSpent,
            purchasedItems: purchasedItems
          });
        });

        // Sort customers by newest first
        customersData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setCustomers(customersData);

      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomersAndOrders();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(timestamp.toDate());
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Manage Customers | Admin | LoomoRA</title>
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
            <Link to="/admin/orders" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <ShoppingBag className="w-5 h-5 mr-3" /> Orders
            </Link>
            <Link to="/admin/3d-models" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Box className="w-5 h-5 mr-3" /> 3D Models
            </Link>
            {/* Active Customers Tab */}
            <div className="flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors cursor-pointer">
              <Users className="w-5 h-5 mr-3" /> Customers
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
            <span className="ml-4 font-semibold text-gray-900">Manage Customers</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registered Customers</h1>
              <p className="text-gray-500 text-sm mt-1">View customer details and their complete purchase history.</p>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search customers by name or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm"
                />
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-b-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 border-t-0 overflow-hidden mb-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-500">Loading customer data...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <Users className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
                  <p className="text-gray-500 text-sm">We couldn't find any customers matching your search.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <p className="font-bold text-gray-900">{customer.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{customer.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(customer.createdAt)}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                              {customer.totalOrders} Orders
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">${customer.totalSpent.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedCustomer(customer)}
                              className="inline-flex items-center justify-center bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm text-sm font-medium"
                            >
                              <Eye className="w-4 h-4 mr-2" /> Purchase History
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

      {/* ================= PURCHASE HISTORY MODAL (VARIANT DETAILS) ================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-[fadeInUp_0.3s_ease-out]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedCustomer.name}'s Purchases</h2>
                  <p className="text-sm font-medium text-gray-500">{selectedCustomer.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Exact Variant Details */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              
              <div className="flex items-center justify-between mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <div>
                  <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Lifetime Spent</p>
                  <p className="text-3xl font-black text-gray-900">${selectedCustomer.totalSpent.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Items Bought</p>
                  <p className="text-3xl font-black text-gray-900">{selectedCustomer.purchasedItems.length}</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-b border-gray-100 pb-2">
                <ShoppingBag className="w-5 h-5 mr-2 text-gray-400" /> Detailed Purchase History
              </h3>

              {selectedCustomer.purchasedItems.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">This customer hasn't purchased any items yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCustomer.purchasedItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white">
                      
                      {/* Product Image */}
                      <div className="w-20 h-24 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* Product & Variant Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Order ID: <span className="text-blue-600">{item.orderId}</span></p>
                          </div>
                          <p className="font-black text-gray-900 text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        
                        {/* THE EXACT VARIANT SELECTION (Size, Color, Qty) */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                          {item.color !== 'N/A' && (
                            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 capitalize">
                              <span className="w-3 h-3 rounded-full border border-gray-300 shadow-inner" style={{ backgroundColor: item.color }}></span>
                              {item.color}
                            </span>
                          )}
                          {item.size !== 'N/A' && (
                            <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 uppercase">
                              Size: {item.size}
                            </span>
                          )}
                          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-sm font-bold">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AdminCustomers;