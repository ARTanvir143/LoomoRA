import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// কার্টে থাকা প্রতিটি প্রোডাক্টের ডাটা টাইপ
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  maxStock: number;
}

// কার্ট স্টোরের টাইপ
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, size: string | undefined, color: string | undefined, quantity: number) => void;
  clearCart: () => void;
}

// মোট আইটেম এবং দাম হিসাব করার হেল্পার ফাংশন
const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { totalItems, totalPrice };
};

// Zustand Store তৈরি করা হচ্ছে (Persist এর মাধ্যমে LocalStorage এ সেভ থাকবে)
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      // কার্টে নতুন প্রোডাক্ট যুক্ত করা
      addItem: (newItem) => {
        const currentItems = get().items;
        
        // চেক করা হচ্ছে একই প্রোডাক্ট (একই সাইজ ও কালার সহ) কার্টে আগে থেকেই আছে কি না
        const existingItemIndex = currentItems.findIndex(
          (item) => item.id === newItem.id && item.size === newItem.size && item.color === newItem.color
        );

        let updatedItems;

        if (existingItemIndex >= 0) {
          // আগে থেকে থাকলে শুধু পরিমাণ (Quantity) বাড়বে
          updatedItems = [...currentItems];
          const currentQty = updatedItems[existingItemIndex].quantity;
          const newQty = currentQty + newItem.quantity;
          
          // স্টকের চেয়ে বেশি কার্টে অ্যাড করা যাবে না
          updatedItems[existingItemIndex].quantity = newQty > newItem.maxStock ? newItem.maxStock : newQty;
        } else {
          // নতুন প্রোডাক্ট হলে লিস্টে যুক্ত হবে
          updatedItems = [...currentItems, newItem];
        }

        const totals = calculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      },

      // কার্ট থেকে প্রোডাক্ট ডিলিট করা
      removeItem: (id, size, color) => {
        const updatedItems = get().items.filter(
          (item) => !(item.id === id && item.size === size && item.color === color)
        );
        const totals = calculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      },

      // কার্টের প্রোডাক্টের পরিমাণ (Quantity) কমানো বা বাড়ানো
      updateQuantity: (id, size, color, quantity) => {
        if (quantity < 1) return;
        
        const updatedItems = get().items.map((item) => {
          if (item.id === id && item.size === size && item.color === color) {
            // স্টকের চেয়ে বেশি যেন সিলেক্ট করতে না পারে
            const validQuantity = quantity > item.maxStock ? item.maxStock : quantity;
            return { ...item, quantity: validQuantity };
          }
          return item;
        });

        const totals = calculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      },

      // সফলভাবে অর্ডার করার পর কার্ট খালি করে দেওয়া
      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 });
      },
    }),
    {
      name: 'loomora-cart-storage', // লোকাল স্টোরেজে এই নামে সেভ থাকবে
    }
  )
);