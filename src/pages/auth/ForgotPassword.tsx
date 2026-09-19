import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Loader2, KeyRound, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      // ফায়ারবেসের মাধ্যমে পাসওয়ার্ড রিসেট ইমেইল পাঠানো
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address');
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password | LoomoRA</title>
        <meta name="description" content="Reset your LoomoRA account password." />
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 md:p-10 transform transition-all animate-[fadeInUp_0.5s_ease-out]">
          
          {!isSent ? (
            <>
              {/* === FORM STATE === */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Forgot Password?</h2>
                <p className="text-gray-500 font-medium">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="email">
                    Email Address *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-gray-50 hover:bg-white transition-all text-gray-900 outline-none font-medium"
                      placeholder="name@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 text-white py-4 px-4 rounded-xl font-bold hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Sending Link...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* === SUCCESS STATE === */}
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100 animate-pulse">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Check your email</h2>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                  We've sent a password reset link to <br/>
                  <span className="text-gray-900 font-bold">{email}</span>
                </p>
                <button 
                  onClick={() => setIsSent(false)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Didn't receive the email? Click to try again
                </button>
              </div>
            </>
          )}

          {/* Back to Login Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;