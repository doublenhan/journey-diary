import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import app from './firebase/firebaseConfig';
import { Heart, Mail, Lock, Eye, EyeOff, BookHeart, Calendar, Phone, X } from 'lucide-react';
import { MoodTheme, themes } from './config/themes';
import VisualEffects from './components/VisualEffects';
import { logSecurityEvent } from './utils/securityMonitoring';
import { useLanguage } from './hooks/useLanguage';
import { SecureStorage } from './utils/secureStorage';
import { createUserWithRole } from './apis/userRoleApi';
import { db } from './firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const loveQuotes = [
  "Love is not just looking at each other, it's looking in the same direction.",
  "In your smile, I see something more beautiful than the stars.",
  "Every love story is beautiful, but ours is my favorite.",
  "You are my today and all of my tomorrows.",
  "Love grows more tremendously full, swift, poignant, as the years multiply.",
  "Together is a wonderful place to be.",
  "You make my heart smile.",
  "Love is friendship that has caught fire."
];

const popularCountries = [
  { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
];

const FloatingHeart = ({ delay = 0, size = 'small' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  return (
    <div 
      className={`absolute text-pink-200/60 pointer-events-none animate-[float_6s_ease-in-out_infinite] ${sizeClasses[size as keyof typeof sizeClasses]}`}
      style={{ 
        animationDelay: `${delay}s`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`
      }}
    >
      <Heart className="fill-current" />
    </div>
  );
};


interface LoginPageProps {
  currentTheme?: MoodTheme;
}

function LoginPage({ currentTheme = 'happy' }: LoginPageProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // Lấy email từ secure storage, nhưng KHÔNG lấy password
  const [email, setEmail] = useState(() => SecureStorage.getRememberedEmail() || '');
  const [password, setPassword] = useState(''); // Always empty - never remember password!
  const [rememberMe, setRememberMe] = useState(SecureStorage.hasRememberedEmail());
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  // Registration method: 'email' or 'phone', default to 'email'
  const [registerMethod, setRegisterMethod] = useState<'email' | 'phone'>('email');
  // OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const otpInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  // Country code dropdown
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: '+84', flag: '🇻🇳', name: 'Vietnam' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Forgot password modal
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % loveQuotes.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (showOtpModal && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
  }, [showOtpModal, resendCountdown]);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Firebase Auth login function
  const loginWithFirebase = async (email: string, password: string) => {
    const auth = getAuth(app);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check user status before allowing login
      try {
        const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';
        const userDocRef = doc(db, `${ENV_PREFIX}users`, userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        // If user is Suspended, sign them out immediately
        if (userData?.status === 'Suspended') {
          await signOut(auth);
          logSecurityEvent({
            type: 'LOGIN_BLOCKED',
            userId: userCredential.user.uid,
            details: { reason: 'Account suspended', method: 'email' }
          });
          return { success: false, message: t('notification.accountSuspended') };
        }
        
        // If user is Removed, sign them out immediately
        if (userData?.status === 'Removed') {
          await signOut(auth);
          logSecurityEvent({
            type: 'LOGIN_BLOCKED',
            userId: userCredential.user.uid,
            details: { reason: 'Account removed', method: 'email' }
          });
          return { success: false, message: t('notification.accountRemoved') };
        }
      } catch (statusCheckError) {
        console.error('[Login] Error checking user status:', statusCheckError);
        // If we can't check status, allow login to proceed
        // The useStatusGuard hook will handle it during the session
      }
      
      // Log successful login
      logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        userId: userCredential.user.uid,
        details: { method: 'email' }
      });
      
      return { success: true };
    } catch (err: any) {
      // Log failed login
      logSecurityEvent({
        type: 'LOGIN_FAILED',
        details: { 
          method: 'email',
          email: email,
          error: err.code || err.message 
        }
      });
      
      return { success: false, message: err.message };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (isRegister) {
      // Registration validation
      if (registerMethod === 'phone') {
        if (!phone) {
          setError(t('auth.errorPhoneRequired'));
          return;
        }
      } else {
        if (!email) {
          setError(t('auth.errorEmailRequired'));
          return;
        }
      }
      // Validate password requirements
      const passwordRequirements = [
        { regex: /.{6,}/, message: t('auth.errorPasswordLength') },
        { regex: /[A-Z]/, message: t('auth.errorPasswordUppercase') },
        { regex: /[a-z]/, message: t('auth.errorPasswordLowercase') },
        { regex: /[0-9]/, message: t('auth.errorPasswordNumber') },
        { regex: /[^A-Za-z0-9]/, message: t('auth.errorPasswordSpecial') },
      ];
      for (const req of passwordRequirements) {
        if (!req.regex.test(password)) {
          setError(req.message);
          return;
        }
      }
    } else {
      if (!email || !password) {
        setError(t('auth.errorLoginRequired'));
        return;
      }
    }
    setIsLoading(true);
    if (isRegister) {
      // Sign Up
      let result;
      if (registerMethod === 'phone') {
        const fullPhone = `${selectedCountry.code}${phone}`;
        result = await registerWithPhoneFirebase(fullPhone);
      } else {
        result = await registerWithEmailFirebase(email, password);
      }
      setIsLoading(false);
      if (result.success) {
        setSuccessMsg(t('auth.successRegistered'));
        setIsRegister(false);
        setPhone('');
        setEmail('');
        setPassword('');
      } else {
        setError(result.message || t('auth.errorRegistrationFailed'));
      }
    } else {
      // Login
      const result = await loginWithFirebase(email, password);
      setIsLoading(false);
      if (result.success) {
        // SECURITY: Only remember email, NEVER remember password
        if (rememberMe) {
          SecureStorage.setRememberedEmail(email);
        } else {
          SecureStorage.clearRemembered();
        }
        navigate('/landing');
      } else {
        setError(result.message || t('auth.errorLoginFailed'));
      }
    }
  };

  // Firebase Auth register (sign up) with phone number (OTP)
  const registerWithPhoneFirebase = async (phone: string) => {
    try {
      const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
      const auth = getAuth(app);
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'invisible',
          }
        );
      }
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setShowOtpModal(true);
      setResendCountdown(60);
      setCanResend(false);
      setOtpCode(['', '', '', '', '', '']);
      setOtpError('');
      // Auto-focus first input
      setTimeout(() => otpInputRefs[0].current?.focus(), 100);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Firebase Auth register (sign up) with email/password
  const registerWithEmailFirebase = async (email: string, password: string) => {
    try {
      const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document with default 'User' role
      await createUserWithRole(userCredential.user.uid, {
        email,
        displayName: ''
      }, 'User');
      
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };


  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtpCode(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      handleOtpSubmit(newOtp.join(''));
    }
  };

  // Handle OTP input keydown (backspace, paste)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpCode(newOtp);
    setOtpError('');
    
    // Focus last filled input or submit if complete
    const lastFilledIndex = pastedData.length - 1;
    if (lastFilledIndex >= 0 && lastFilledIndex < 5) {
      otpInputRefs[lastFilledIndex + 1].current?.focus();
    } else if (pastedData.length === 6) {
      handleOtpSubmit(pastedData);
    }
  };

  // Submit OTP verification
  const handleOtpSubmit = async (code: string) => {
    if (!confirmationResult) {
      setOtpError(t('auth.otpErrorGeneral'));
      return;
    }
    
    setIsLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(code);
      
      // Check user status before allowing login (for phone auth)
      try {
        const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';
        const userDocRef = doc(db, `${ENV_PREFIX}users`, userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        // If user is Suspended, sign them out immediately
        if (userData?.status === 'Suspended') {
          const auth = getAuth(app);
          await signOut(auth);
          logSecurityEvent({
            type: 'LOGIN_BLOCKED',
            userId: userCredential.user.uid,
            details: { reason: 'Account suspended', method: 'phone' }
          });
          setShowOtpModal(false);
          setError(t('notification.accountSuspended'));
          setIsLoading(false);
          return;
        }
        
        // If user is Removed, sign them out immediately
        if (userData?.status === 'Removed') {
          const auth = getAuth(app);
          await signOut(auth);
          logSecurityEvent({
            type: 'LOGIN_BLOCKED',
            userId: userCredential.user.uid,
            details: { reason: 'Account removed', method: 'phone' }
          });
          setShowOtpModal(false);
          setError(t('notification.accountRemoved'));
          setIsLoading(false);
          return;
        }
      } catch (statusCheckError) {
        console.error('[OTP Login] Error checking user status:', statusCheckError);
        // If we can't check status, allow login to proceed
        // The useStatusGuard hook will handle it during the session
      }
      
      setShowOtpModal(false);
      setSuccessMsg(t('auth.successOtpVerified'));
      setIsRegister(false);
      setPhone('');
      setOtpCode(['', '', '', '', '', '']);
    } catch (err: any) {
      setOtpError(t('auth.otpErrorInvalid'));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    const fullPhone = `${selectedCountry.code}${phone}`;
    const result = await registerWithPhoneFirebase(fullPhone);
    setIsLoading(false);
    
    if (result.success) {
      setResendCountdown(60);
      setCanResend(false);
      setOtpError('');
    } else {
      setOtpError(result.message || t('auth.otpErrorResendFailed'));
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setError(t('auth.forgotPasswordEmailRequired'));
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, forgotPasswordEmail);
      
      // Log password reset request
      logSecurityEvent({
        type: 'PASSWORD_RESET_REQUESTED',
        details: { email: forgotPasswordEmail }
      });
      
      setSuccessMsg(t('auth.forgotPasswordSuccess'));
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail('');
    } catch (err: any) {
      setError(err.message || t('auth.forgotPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const theme = currentTheme ? themes[currentTheme] : themes.happy;
  
  // Default visual effects settings
  const effectsEnabled = {
    particles: true,
    hearts: true,
    transitions: true,
    glow: true,
    fadeIn: true,
    slideIn: true
  };
  const animationSpeed = 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 bg-[length:400%_400%] animate-[gradient-shift_15s_ease_infinite] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Visual Effects */}
      <VisualEffects 
        effectsEnabled={effectsEnabled}
        animationSpeed={animationSpeed}
        theme={{ colors: { primary: theme.textPrimary } }}
      />
      
      {/* Floating Hearts Background */}
      {[...Array(12)].map((_, i) => (
        <FloatingHeart 
          key={i} 
          delay={i * 0.5} 
          size={i % 3 === 0 ? 'large' : i % 2 === 0 ? 'medium' : 'small'} 
        />
      ))}
      
      {/* Main Login Card */}
      <div className="w-full max-w-md animate-[fade-in-up_0.8s_ease-out]">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-8 border border-pink-200/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-700 rounded-full mb-4 shadow-[0_10px_25px_rgba(236,72,153,0.3)] animate-[bounce-in_1s_ease-out_0.3s_both]">
              <BookHeart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-[fade-in-up_0.8s_ease-out_0.4s_both]">{t('auth.appTitle')}</h1>
            <p className="text-pink-600 text-lg font-medium animate-[fade-in-up_0.8s_ease-out_0.5s_both]">{t('auth.appSubtitle')}</p>
          </div>

          {/* Current Date */}
          <div className="flex items-center justify-center text-sm text-gray-600 mb-6 bg-pink-50 rounded-lg p-3 animate-[fade-in-up_0.8s_ease-out_0.6s_both]">
            <Calendar className="w-4 h-4 mr-2 text-pink-500" />
            {getCurrentDate()}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-[fade-in-up_0.8s_ease-out_0.7s_both]">
            {/* Registration Method Selector (only show when registering) */}
            {isRegister && (
              <div className="flex gap-6 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="register-method"
                    value="email"
                    checked={registerMethod === 'email'}
                    onChange={() => setRegisterMethod('email')}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-gray-700">{t('auth.registerMethodEmail')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="register-method"
                    value="phone"
                    checked={registerMethod === 'phone'}
                    onChange={() => setRegisterMethod('phone')}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-gray-700">{t('auth.registerMethodPhone')}</span>
                </label>
              </div>
            )}

            {/* Email/Phone Field */}
            {isRegister ? (
              registerMethod === 'phone' ? (
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    {t('auth.phoneLabel')}
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    {/* Country Code Dropdown Button */}
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-gray-50 rounded hover:bg-gray-100 transition-colors z-10"
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
                      <svg className="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Country Dropdown Menu */}
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {popularCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country);
                              setShowCountryDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-pink-50 transition-colors text-left"
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="flex-1 text-sm text-gray-700">{country.name}</span>
                            <span className="text-sm text-gray-500">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Phone Input */}
                    <div className="relative">
                      <Phone className="absolute left-[140px] top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-[170px] pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                        placeholder="123 456 7890"
                        required
                      />
                    </div>
                  </div>
                  {/* Recaptcha container for phone auth */}
                  <div id="recaptcha-container" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    {t('auth.emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                      placeholder="Nhập email của bạn"
                      required
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t('auth.emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mật Khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                  placeholder="Nhập mật khẩu của bạn"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <label htmlFor="rememberMe" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">{t('auth.rememberMe')}</span>
              </label>
            </div>


            {/* Error & Success Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {successMsg}
              </div>
            )}

            {/* Login/Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Heart className="w-5 h-5 fill-current animate-pulse" />
                  <span>{isRegister ? t('auth.registering') : t('auth.loggingIn')}</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 fill-current" />
                  <span>{isRegister ? t('auth.registerButton') : t('auth.loginButton')}</span>
                  <Heart className="w-5 h-5 fill-current" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="text-sm text-gray-500 font-medium">{t('auth.or')}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* Social Login Options */}
          <div className="flex flex-col gap-3">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-200 text-red-500 font-bold text-lg">G</div>
              <span className="font-medium text-gray-700">{t('auth.googleLogin')}</span>
            </button>
            
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full shadow-sm text-white font-bold text-lg">f</div>
              <span className="font-medium text-gray-700">{t('auth.facebookLogin')}</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              {isRegister ? (
                <>
                  {t('auth.existingUser')}{' '}
                  <button
                    type="button"
                    className="text-pink-600 font-semibold hover:text-pink-700 hover:underline transition-colors"
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                      setSuccessMsg('');
                    }}
                  >
                    {t('auth.login')}
                  </button>
                </>
              ) : (
                <>
                  {t('auth.newUser')}{' '}
                  <button
                    type="button"
                    className="text-pink-600 font-semibold hover:text-pink-700 hover:underline transition-colors"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                      setSuccessMsg('');
                    }}
                  >
                    {t('auth.createAccount')}
                  </button>
                </>
              )}
            </p>
            <button 
              type="button"
              className="text-sm text-pink-600 font-medium hover:text-pink-700 hover:underline transition-colors"
              onClick={() => {
                setShowForgotPasswordModal(true);
                setError('');
                setSuccessMsg('');
                setForgotPasswordEmail(email);
              }}
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fade-in_0.3s_ease-out]" onClick={() => setShowForgotPasswordModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-[bounce-in_0.5s_ease-out]" onClick={(e) => e.stopPropagation()}>
              <button 
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowForgotPasswordModal(false)}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <Mail className="w-12 h-12 mx-auto mb-3 text-pink-500" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.forgotPasswordTitle')}</h2>
                <p className="text-sm text-gray-600">
                  {t('auth.forgotPasswordSubtitle')}
                </p>
              </div>

              <form onSubmit={handleForgotPassword}>
                <div className="mb-6">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                      placeholder={t('auth.forgotPasswordEmailPlaceholder')}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !forgotPasswordEmail}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Heart className="w-5 h-5 animate-pulse" />
                      <span>{t('auth.forgotPasswordSending')}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>{t('auth.forgotPasswordSendButton')}</span>
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setError('');
                    }}
                    className="text-sm text-pink-600 font-medium hover:text-pink-700 hover:underline transition-colors"
                  >
                    {t('auth.forgotPasswordBackToLogin')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* OTP Verification Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fade-in_0.3s_ease-out]" onClick={() => setShowOtpModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-[bounce-in_0.5s_ease-out]" onClick={(e) => e.stopPropagation()}>
              <button 
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowOtpModal(false)}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <Phone className="w-12 h-12 mx-auto mb-3 text-pink-500" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.otpTitle')}</h2>
                <p className="text-sm text-gray-600">
                  {t('auth.otpSubtitle')}<br />
                  <strong>{selectedCountry.flag} {selectedCountry.code} {phone}</strong>
                </p>
              </div>

              <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpInputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              {otpError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {otpError}
                </div>
              )}

              <button
                onClick={() => handleOtpSubmit(otpCode.join(''))}
                disabled={isLoading || otpCode.some(d => !d)}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Heart className="w-5 h-5 animate-pulse" />
                    <span>{t('auth.otpVerifying')}</span>
                  </>
                ) : (
                  t('auth.otpConfirmButton')
                )}
              </button>

              <div className="mt-4 text-center">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm text-pink-600 font-medium hover:text-pink-700 hover:underline transition-colors disabled:opacity-50"
                  >
                    {t('auth.otpResendButton')}
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">
                    {t('auth.otpResendCountdown')} <strong className="text-pink-600">{resendCountdown}s</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Love Quote */}
        <div className="mt-6 animate-[fade-in-up_0.8s_ease-out_1s_both]">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 shadow-sm border border-pink-100">
            <p className="text-center text-sm text-gray-700 italic leading-relaxed">
              "{loveQuotes[currentQuote]}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
