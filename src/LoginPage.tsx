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
import './styles/LoginPage.css';

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

const FloatingHeart = ({ delay = 0, size = 'small' }) => (
  <div 
    className={`floating-heart ${size}`}
    style={{ 
      animationDelay: `${delay}s`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`
    }}
  >
    <Heart className="fill-current" />
  </div>
);


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
      signupTrace.putAttribute('success', 'false');
      signupTrace.putAttribute('error', err.code || err.message);
      signupTrace.stop();
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
    <div className="login-container">
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
      <div className="login-card">
        <div className="login-card-inner">
          {/* Header */}
          <div className="login-header">
            <div className="logo-container">
              <BookHeart className="logo-icon" />
            </div>
            <h1 className="login-title">{t('auth.appTitle')}</h1>
            <p className="login-subtitle">{t('auth.appSubtitle')}</p>
          </div>

          {/* Current Date */}
          <div className="date-display">
            <Calendar className="date-icon" />
            {getCurrentDate()}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Registration Method Selector (only show when registering) */}
            {isRegister && (
              <div className="register-method-toggle">
                <label>
                  <input
                    type="radio"
                    name="register-method"
                    value="email"
                    checked={registerMethod === 'email'}
                    onChange={() => setRegisterMethod('email')}
                  />{' '}
                  {t('auth.registerMethodEmail')}
                </label>
                <label style={{ marginLeft: '1.5em' }}>
                  <input
                    type="radio"
                    name="register-method"
                    value="phone"
                    checked={registerMethod === 'phone'}
                    onChange={() => setRegisterMethod('phone')}
                  />{' '}
                  {t('auth.registerMethodPhone')}
                </label>
              </div>
            )}

            {/* Email/Phone Field */}
            {isRegister ? (
              registerMethod === 'phone' ? (
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    {t('auth.phoneLabel')}
                  </label>
                  <div className="phone-input-container" ref={dropdownRef}>
                    {/* Country Code Dropdown Button */}
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="country-dropdown-button"
                    >
                      <span className="country-flag">{selectedCountry.flag}</span>
                      <span className="country-code">{selectedCountry.code}</span>
                      <svg className="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Country Dropdown Menu */}
                    {showCountryDropdown && (
                      <div className="country-dropdown-menu">
                        {popularCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country);
                              setShowCountryDropdown(false);
                            }}
                            className="country-dropdown-item"
                          >
                            <span className="country-flag">{country.flag}</span>
                            <span className="country-name">{country.name}</span>
                            <span className="country-code-text">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Phone Input */}
                    <div className="phone-input-wrapper">
                      <Phone className="input-icon" />
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-input phone-input"
                        placeholder="123 456 7890"
                        required
                      />
                    </div>
                  </div>
                  {/* Recaptcha container for phone auth */}
                  <div id="recaptcha-container" />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    {t('auth.emailLabel')}
                  </label>
                  <div className="input-container">
                    <Mail className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      placeholder="Nhập email của bạn"
                      required
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  {t('auth.emailLabel')}
                </label>
                <div className="input-container">
                  <Mail className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mật Khẩu
              </label>
              <div className="input-container">
                <Lock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Nhập mật khẩu của bạn"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="password-toggle-icon" />
                  ) : (
                    <Eye className="password-toggle-icon" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-group remember-me-row">
              <label htmlFor="rememberMe" className="remember-me-label">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="remember-me-checkbox"
                />
                <span className="remember-me-text">{t('auth.rememberMe')}</span>
              </label>
            </div>


            {/* Error & Success Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="success-message">
                {successMsg}
              </div>
            )}

            {/* Login/Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? (
                <>
                  <Heart className="login-button-icon loading fill-current" />
                  <span>{isRegister ? t('auth.registering') : t('auth.loggingIn')}</span>
                </>
              ) : (
                <>
                  <Heart className="login-button-icon fill-current" />
                  <span>{isRegister ? t('auth.registerButton') : t('auth.loginButton')}</span>
                  <Heart className="login-button-icon fill-current" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">{t('auth.or')}</span>
            <div className="divider-line"></div>
          </div>

          {/* Social Login Options */}
          <div className="social-login">
            <button className="social-button">
              <div className="social-icon google">G</div>
              <span>{t('auth.googleLogin')}</span>
            </button>
            
            <button className="social-button">
              <div className="social-icon facebook">f</div>
              <span>{t('auth.facebookLogin')}</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="footer-links">
            <p className="footer-text">
              {isRegister ? (
                <>
                  {t('auth.existingUser')}{' '}
                  <button
                    type="button"
                    className="footer-link"
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
                    className="footer-link"
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
              className="footer-link"
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
          <div className="otp-modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
            <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
              <button 
                className="otp-modal-close"
                onClick={() => setShowForgotPasswordModal(false)}
                aria-label="Đóng"
              >
                <X />
              </button>
              
              <div className="otp-modal-header">
                <Mail className="otp-modal-icon" />
                <h2 className="otp-modal-title">{t('auth.forgotPasswordTitle')}</h2>
                <p className="otp-modal-subtitle">
                  {t('auth.forgotPasswordSubtitle')}
                </p>
              </div>

              <form onSubmit={handleForgotPassword}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <div className="input-container">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="form-input"
                      placeholder={t('auth.forgotPasswordEmailPlaceholder')}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="otp-error-message" style={{ marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !forgotPasswordEmail}
                  className="otp-submit-button"
                >
                  {isLoading ? (
                    <>
                      <Heart className="animate-pulse" />
                      <span>{t('auth.forgotPasswordSending')}</span>
                    </>
                  ) : (
                    <>
                      <Mail style={{ width: '20px', height: '20px' }} />
                      <span>{t('auth.forgotPasswordSendButton')}</span>
                    </>
                  )}
                </button>

                <div className="otp-resend-container">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setError('');
                    }}
                    className="otp-resend-button"
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
          <div className="otp-modal-overlay" onClick={() => setShowOtpModal(false)}>
            <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
              <button 
                className="otp-modal-close"
                onClick={() => setShowOtpModal(false)}
                aria-label="Đóng"
              >
                <X />
              </button>
              
              <div className="otp-modal-header">
                <Phone className="otp-modal-icon" />
                <h2 className="otp-modal-title">{t('auth.otpTitle')}</h2>
                <p className="otp-modal-subtitle">
                  {t('auth.otpSubtitle')}<br />
                  <strong>{selectedCountry.flag} {selectedCountry.code} {phone}</strong>
                </p>
              </div>

              <div className="otp-inputs-container" onPaste={handleOtpPaste}>
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
                    className="otp-input"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}</div>

              {otpError && (
                <div className="otp-error-message">
                  {otpError}
                </div>
              )}

              <button
                onClick={() => handleOtpSubmit(otpCode.join(''))}
                disabled={isLoading || otpCode.some(d => !d)}
                className="otp-submit-button"
              >
                {isLoading ? (
                  <>
                    <Heart className="animate-pulse" />
                    <span>{t('auth.otpVerifying')}</span>
                  </>
                ) : (
                  t('auth.otpConfirmButton')
                )}
              </button>

              <div className="otp-resend-container">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="otp-resend-button"
                  >
                    {t('auth.otpResendButton')}
                  </button>
                ) : (
                  <p className="otp-countdown">
                    {t('auth.otpResendCountdown')} <strong>{resendCountdown}s</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Love Quote */}
        <div className="love-quote-container">
          <div className="love-quote-card">
            <p className="love-quote-text">
              "{loveQuotes[currentQuote]}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
