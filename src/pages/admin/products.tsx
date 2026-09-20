import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Menu, X, Tags, Settings, FileText,
  Plus, Search, Edit, Trash2, Loader2, Image as ImageIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
}

const AdminProducts = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ফায়ারবেস থেকে প্রোডাক্টগুলো নিয়ে আসার ফাংশন
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // প্রোডাক্ট ডিলিট করার ফাংশন
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('Product deleted successfully');
        setProducts(products.filter(product => product.id !== id));
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  // সার্চ ফিল্টার
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Manage Products | Admin | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen flex flex-col md:flex-row">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* ================= SIDEBAR ================= */}
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
            <Link to="/admin/products" className="flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors">
              <Package className="w-5 h-5 mr-3" /> Products
            </Link>
            <Link to="/admin/categories" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Tags className="w-5 h-5 mr-3" /> Categories
            </Link>
            <Link to="/admin/orders" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <ShoppingBag className="w-5 h-5 mr-3" /> Orders
            </Link>
            <Link to="/admin/customers" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Users className="w-5 h-5 mr-3" /> Customers
            </Link>
            <Link to="/admin/legal" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <FileText className="w-5 h-5 mr-3" /> Legal Pages
            </Link>
            <Link to="/admin/settings" className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors">
              <Settings className="w-5 h-5 mr-3" /> Settings
            </Link>
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] overflow-hidden">
          
          <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 p-1"><Menu className="w-6 h-6" /></button>
            <span className="ml-4 font-semibold text-gray-900">Products</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your store's inventory and products.</p>
              </div>
              <Link 
                to="/admin/products/new" 
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Product
              </Link>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search products by name or category..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm"
                />
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-b-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 border-t-0 overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-500">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
                  <p className="text-gray-500 text-sm max-w-sm mb-4">You haven't added any products yet, or no products match your search.</p>
                  <Link to="/admin/products/new" className="text-blue-600 font-medium hover:text-blue-700 hover:underline flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> Add your first product
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                                {product.images && product.images.length > 0 ? (
                                  <img className="h-full w-full object-cover" src={product.images[0]} alt={product.name} />
                                ) : (
                                  <ImageIcon className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 capitalize">{product.category}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">${product.price.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/admin/products/edit/${product.id}`} className="text-blue-600 hover:text-blue-900 p-1 bg-blue-50 rounded">
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button onClick={() => handleDelete(product.id, product.name)} className="text-red-600 hover:text-red-900 p-1 bg-red-50 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
    </>
  );
};

export default AdminProducts;