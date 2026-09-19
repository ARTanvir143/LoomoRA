import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute = ({ requireAdmin = false, children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  // যখন ফায়ারবেস চেক করছে ইউজার লগইন আছে কি না, তখন একটি সুন্দর লোডিং স্পিনার দেখাবে
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // যদি ইউজার লগইন করা না থাকে, তাহলে তাকে লগইন পেজে পাঠিয়ে দেবে
  // এবং state-এ আগের লিংকের তথ্য রেখে দেবে, যাতে লগইন শেষে আবার আগের জায়গায় ফিরে আসতে পারে
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // যদি রাউটটি শুধুমাত্র অ্যাডমিনদের জন্য হয় এবং ইউজারের রোল অ্যাডমিন না হয়, তবে তাকে হোমপেজে পাঠিয়ে দেবে
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // সব ঠিক থাকলে পেজটি রেন্ডার করবে
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;