import { create } from 'zustand';

// ইউজারের ডাটার টাইপ ডিফাইন করা হচ্ছে
export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

// Auth Store এর টাইপ ডিফাইন করা হচ্ছে
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // একশনগুলো
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

// Zustand Store তৈরি করা হচ্ছে
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // শুরুতে true থাকবে, কারণ ফায়ারবেস চেক করবে ইউজার লগইন আছে কি না

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user, 
    isLoading: false 
  }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    isLoading: false 
  }),
}));