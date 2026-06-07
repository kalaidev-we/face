import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Mail, Lock, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { loginUser } from '../lib/db';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { isDark, setSession } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');

  // Handle URL flags e.g. /login?register=true
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setIsRegister(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    
    setLoading(true);

    try {
      if (isRegister) {
        // Mock registration flow: just show a toast and switch to login
        toast.success('Registration successful! Please login with your email.');
        setIsRegister(false);
        setLoading(false);
        return;
      }

      if (otpMode && !otpSent) {
        // Send OTP
        const response = await loginUser(email, undefined, 'otp');
        if (response.success) {
          setOtpSent(true);
          toast.success('Simulation OTP sent successfully (Code is 123456)');
        } else {
          toast.error(response.error || 'Failed to request OTP');
        }
        setLoading(false);
        return;
      }

      // Complete standard login (or OTP verification)
      if (otpMode && otpSent) {
        if (otpCode !== '123456') {
          toast.error('Invalid OTP. Use 123456 for the demo.');
          setLoading(false);
          return;
        }
      }

      const response = await loginUser(email, otpMode ? undefined : password, otpMode ? 'otp' : 'password');
      if (response.success && response.session) {
        setSession(response.session.user);
        toast.success(`Welcome back, ${response.session.user?.name}!`);
        navigate('/dashboard/overview');
      } else {
        toast.error(response.error || 'Authentication failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    // Simulate google login with admin credentials
    setTimeout(async () => {
      const response = await loginUser('admin@facetrack.ai', undefined, 'google');
      if (response.success && response.session) {
        setSession(response.session.user);
        toast.success('Signed in with Google!');
        navigate('/dashboard/overview');
      } else {
        toast.error('Google login simulation failed');
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8 relative transition-colors duration-300 ${isDark ? 'bg-dark-bg text-gray-100' : 'bg-light-bg text-gray-800'}`}>
      
      {/* Decorative Blur Backgrounds */}
      {isDark && (
        <>
          <div className="absolute top-10 left-1/3 w-72 h-72 bg-primary/10 rounded-full filter blur-[80px] pointer-events-none" />
          <div className="absolute bottom-10 right-1/3 w-72 h-72 bg-secondary/10 rounded-full filter blur-[80px] pointer-events-none" />
        </>
      )}

      {/* Back button */}
      <div className="absolute top-6 left-6 md:left-12">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-gradient-to-tr from-primary to-secondary rounded-2xl text-white shadow-xl shadow-primary/20 mb-6">
          <Camera className="w-8 h-8" />
        </div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          {isRegister ? 'Create your Account' : 'Sign in to FaceTrack AI'}
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          {isRegister ? 'Already have an account?' : 'Or connect your Supabase database in settings'}
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setOtpMode(false);
              setOtpSent(false);
            }} 
            className="ml-1 text-primary hover:underline font-semibold"
          >
            {isRegister ? 'Sign in instead' : 'Register a new account'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel p-8 rounded-2xl shadow-xl border border-white/5 relative premium-border">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none transition-colors text-sm font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none transition-colors text-sm font-medium"
                  placeholder="name@institution.edu"
                />
              </div>
            </div>

            {!otpMode && !isRegister && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase text-gray-400">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none transition-colors text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {otpMode && otpSent && (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">One-Time Code (OTP)</label>
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/30 border border-white/10 rounded-xl text-center font-mono text-lg tracking-widest focus:border-primary focus:outline-none transition-colors"
                  placeholder="000000"
                  maxLength={6}
                />
                <span className="text-[11px] text-gray-500 mt-1 block">Enter mock code: <strong className="text-primary">123456</strong></span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Processing...' : (
                isRegister ? 'Register' : (
                  otpMode ? (otpSent ? 'Verify Code' : 'Send Verification OTP') : 'Sign In'
                )
              )}
            </button>
          </form>

          {!isRegister && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-dark-card text-gray-500 bg-opacity-0">Or continue with</span></div>
              </div>

              {/* Alternative Auth Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="py-2.5 px-4 glass-panel border border-white/5 hover:border-primary/20 rounded-xl flex items-center justify-center space-x-2 text-sm font-medium transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  onClick={() => {
                    setOtpMode(!otpMode);
                    setOtpSent(false);
                  }}
                  disabled={loading}
                  className="py-2.5 px-4 glass-panel border border-white/5 hover:border-primary/20 rounded-xl flex items-center justify-center space-x-2 text-sm font-medium transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{otpMode ? 'Password' : 'OTP Code'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mock Credentials Help Overlay */}
        <div className="mt-6 glass-panel p-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 text-xs text-gray-400 space-y-2">
          <div className="flex items-center space-x-2 text-yellow-500/80 font-bold uppercase tracking-wider text-[10px]">
            <AlertCircle className="w-4 h-4" />
            <span>Mock Mode Login Assistance</span>
          </div>
          <p>
            No database setup is required to test! Sign in directly using these pre-seeded roles:
          </p>
          <div className="font-mono space-y-1.5 pt-1 text-[11px]">
            <div>• <strong className="text-primary">admin@facetrack.ai</strong> (Super Admin)</div>
            <div>• <strong className="text-secondary">sarah.jenkins@facetrack.ai</strong> (Staff View)</div>
            <div>• <strong className="text-accent">alex.mercer@facetrack.ai</strong> (Student View)</div>
            <div className="text-[10px] text-gray-500">Note: Leave the password field blank or enter anything.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
