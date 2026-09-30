import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, doc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';
import { 
  CreditCard, Truck, MapPin, CheckCircle, ArrowLeft, 
  Loader2, ShieldCheck, ChevronRight, Smartphone
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, totalPrice, totalItems, clearCart } = useCartStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, bkash, card
  
  // bKash States
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');

  const [shippingDetails, setShippingDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/shop');
      toast.error('Your cart is empty');
    }
    
    if (user) {
      const names = user.name.split(' ');
      setShippingDetails(prev => ({
        ...prev,
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || ''
      }));
    }
  }, [items.length, navigate, user]);

  // Shipping Logic: 2000 টাকার ওপরে কিনলে ফ্রি শিপিং, নাহলে 100 টাকা।
  const shippingCost = totalPrice >= 2000 || totalPrice === 0 ? 0 : 100;
  const grandTotal = totalPrice + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to place an order');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (paymentMethod === 'bkash') {
      if (!bkashNumber || bkashNumber.length < 11) {
        toast.error('Please enter a valid bKash number');
        return;
      }
      if (!trxId) {
        toast.error('Please enter the Transaction ID (TrxID)');
        return;
      }
    }

    setIsProcessing(true);
    const loadingToast = toast.loading('Processing your order...');

    try {
      const batch = writeBatch(db);

      const orderData = {
        userId: user.uid,
        orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        customerDetails: shippingDetails,
        items: items,
        subtotal: totalPrice,
        shippingCost: shippingCost,
        total: grandTotal,
        paymentMethod: paymentMethod,
        // বিকাশের পেমেন্ট স্ট্যাটাস 'Verifying' দেখাবে, যা অ্যাডমিন চেক করে 'Completed' করবে
        paymentStatus: paymentMethod === 'cod' ? 'Pending' : (paymentMethod === 'bkash' ? 'Verifying' : 'Pending'),
        bkashDetails: paymentMethod === 'bkash' ? { phone: bkashNumber, trxId: trxId } : null,
        orderStatus: 'Processing',
        createdAt: serverTimestamp(),
      };

      const newOrderRef = doc(collection(db, 'orders'));
      batch.set(newOrderRef, orderData);

      items.forEach((item) => {
        const productRef = doc(db, 'products', item.id);
        batch.update(productRef, {
          stock: increment(-item.quantity) 
        });
      });

      await batch.commit();

      clearCart();
      toast.success('Order placed successfully! 🎉', { id: loadingToast });
      navigate('/orders'); 
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.', { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Checkout | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-[#F8FAFC] min-h-screen pb-20">
        
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="flex items-center space-x-2 md:space-x-4 text-sm font-medium">
              <span className="text-gray-500">Cart</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-blue-600 font-bold flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">2</span>
                Checkout
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-gray-400">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/cart" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Cart
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            
            <div className="w-full lg:w-2/3">
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
                
                {/* Shipping Information */}
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" /> Shipping Address
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">First Name *</label>
                      <input type="text" name="firstName" required value={shippingDetails.firstName} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Last Name *</label>
                      <input type="text" name="lastName" required value={shippingDetails.lastName} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address *</label>
                      <input type="email" name="email" required value={shippingDetails.email} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number *</label>
                      <input type="tel" name="phone" required value={shippingDetails.phone} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Street Address *</label>
                      <input type="text" name="address" required value={shippingDetails.address} onChange={handleInputChange} placeholder="House number and street name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">City *</label>
                      <input type="text" name="city" required value={shippingDetails.city} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">State / Division</label>
                      <input type="text" name="state" value={shippingDetails.state} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">ZIP / Postal Code *</label>
                      <input type="text" name="zipCode" required value={shippingDetails.zipCode} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all bg-gray-50 hover:bg-white" />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" /> Payment Method
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Option 1: Cash on Delivery */}
                    <label className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 hover:border-blue-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600" />
                          <div className="ml-3">
                            <span className="block text-sm font-bold text-gray-900">Cash on Delivery (COD)</span>
                            <span className="block text-xs font-medium text-gray-500">Pay with cash upon delivery.</span>
                          </div>
                        </div>
                        <Truck className="w-6 h-6 text-gray-400" />
                      </div>
                    </label>

                    {/* Option 2: bKash */}
                    <label className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'bkash' ? 'border-pink-600 bg-pink-50/30' : 'border-gray-100 hover:border-pink-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input type="radio" name="paymentMethod" value="bkash" checked={paymentMethod === 'bkash'} onChange={() => setPaymentMethod('bkash')} className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-600" />
                          <div className="ml-3">
                            <span className="block text-sm font-bold text-gray-900">bKash Payment</span>
                            <span className="block text-xs font-medium text-gray-500">Send money and verify.</span>
                          </div>
                        </div>
                        <div className="bg-pink-600 text-white p-1.5 rounded-lg"><Smartphone className="w-5 h-5" /></div>
                      </div>
                      
                      {/* bKash Input Fields */}
                      {paymentMethod === 'bkash' && (
                        <div className="mt-4 pt-4 border-t border-gray-200 animate-[fadeInUp_0.3s_ease-out]">
                          <div className="bg-pink-50 text-pink-800 p-4 rounded-xl text-sm font-medium mb-4 border border-pink-200">
                            Please Send Money / Payment of <span className="font-black">৳{grandTotal.toFixed(2)}</span> to our bKash Number: <br/>
                            <span className="text-xl font-black block mt-2 tracking-widest text-pink-600">017XX-XXXXXX</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">Your bKash Number</label>
                              <input type="text" placeholder="01XXXXXXXXX" value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} required={paymentMethod === 'bkash'} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-pink-500 bg-white" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">Transaction ID (TrxID)</label>
                              <input type="text" placeholder="e.g. 8N4MN53" value={trxId} onChange={(e) => setTrxId(e.target.value)} required={paymentMethod === 'bkash'} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-pink-500 bg-white uppercase" />
                            </div>
                          </div>
                        </div>
                      )}
                    </label>

                    {/* Option 3: Credit/Debit Card (Mock) */}
                    <label className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 hover:border-blue-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600" />
                          <div className="ml-3">
                            <span className="block text-sm font-bold text-gray-900">Credit / Debit Card</span>
                            <span className="block text-xs font-medium text-gray-500">Secure online payment (Coming Soon)</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-8 h-5 bg-gray-200 rounded"></div>
                          <div className="w-8 h-5 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      
                      {paymentMethod === 'card' && (
                        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 animate-[fadeInUp_0.3s_ease-out]">
                          <div className="col-span-2 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs font-medium border border-yellow-200">
                            Automated card payments require a Merchant Gateway (like SSLCommerz). Currently not available in demo mode.
                          </div>
                          <div className="col-span-2">
                            <input type="text" placeholder="Card Number" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50" disabled />
                          </div>
                          <div>
                            <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50" disabled />
                          </div>
                          <div>
                            <input type="text" placeholder="CVC" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50" disabled />
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

              </form>
            </div>

            {/* ================= RIGHT SIDE: ORDER SUMMARY ================= */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-3xl shadow-[0_4px_30px_rgb(0,0,0,0.05)] border border-gray-100 p-6 sticky top-28">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Order Summary</h2>
                
                <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors">
                          <Link to={`/product/${item.id}`}>{item.name}</Link>
                        </h4>
                        <div className="text-xs font-medium text-gray-500 mt-1 space-x-2">
                          {item.size && <span className="uppercase">Size: {item.size}</span>}
                          {item.color && <span className="capitalize">Color: {item.color}</span>}
                        </div>
                        <p className="text-sm font-bold text-gray-900 mt-1">৳{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="text-gray-900">৳{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Shipping</span>
                    <span className="text-gray-900">{shippingCost === 0 ? 'Free' : `৳${shippingCost.toFixed(2)}`}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 text-center font-medium">
                      Add ৳{(2000 - totalPrice).toFixed(2)} more to your cart to get FREE shipping!
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-black text-blue-600">৳{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_10px_20px_rgba(37,99,235,0.2)]"
                >
                  {isProcessing ? (
                    <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Processing...</>
                  ) : (
                    <><CheckCircle className="h-5 w-5 mr-2" /> Confirm Order</>
                  )}
                </button>
                
                <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 py-2 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>256-bit SSL encrypted checkout</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;