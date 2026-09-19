import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
}

interface WishlistState {
  items: WishlistItem[];
  
  // Actions
  toggleItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      // প্রোডাক্ট আগে থেকে থাকলে রিমুভ করবে, না থাকলে অ্যাড করবে
      toggleItem: (newItem) => {
        const currentItems = get().items;
        const exists = currentItems.some((item) => item.id === newItem.id);

        if (exists) {
          set({ items: currentItems.filter((item) => item.id !== newItem.id) });
        } else {
          set({ items: [...currentItems, newItem] });
        }
      },

      // সরাসরি রিমুভ করা
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      // পুরো উইশলিস্ট ক্লিয়ার করা
      clearWishlist: () => {
        set({ items: [] });
      },

      // চেক করা যে প্রোডাক্টটি উইশলিস্টে আছে কি না
      isInWishlist: (id) => {
        return get().items.some((item) => item.id === id);
      },
    }),
    {
      name: 'loomora-wishlist-storage', // ব্রাউজারের লোকাল স্টোরেজে এই নামে সেভ থাকবে
    }
  )
);