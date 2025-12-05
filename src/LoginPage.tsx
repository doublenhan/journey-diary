import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from './firebase/firebaseConfig';
import { Heart, Mail, Lock, Eye, EyeOff, BookHeart, Calendar, Phone, X } from 'lucide-react';
import { MoodTheme, themes } from './config/themes';
import VisualEffects from './components/VisualEffects';
import './styles/LoginPage.css';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}


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
  const [email, setEmail] = useState(() => localStorage.getItem('rememberEmail') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('rememberPassword') || '');
  const [rememberMe, setRememberMe] = useState(true);
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
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: any) {
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
          setError('Please enter your phone number to register.');
          return;
        }
      } else {
        if (!email) {
          setError('Please enter your email to register.');
          return;
        }
      }
      // Validate password requirements
      const passwordRequirements = [
        { regex: /.{6,}/, message: 'Password must be at least 6 characters.' },
        { regex: /[A-Z]/, message: 'Password must contain an uppercase letter.' },
        { regex: /[a-z]/, message: 'Password must contain a lowercase letter.' },
        { regex: /[0-9]/, message: 'Password must contain a number.' },
        { regex: /[^A-Za-z0-9]/, message: 'Password must contain a special character.' },
      ];
      for (const req of passwordRequirements) {
        if (!req.regex.test(password)) {
          setError(req.message);
          return;
        }
      }
    } else {
      if (!email || !password) {
        setError('Vui lòng điền đầy đủ thông tin để tiếp tục hành trình tình yêu 💕');
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
        setSuccessMsg('Tạo tài khoản thành công!');
        setIsRegister(false);
        setPhone('');
        setEmail('');
        setPassword('');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } else {
      // Login
      const result = await loginWithFirebase(email, password);
      setIsLoading(false);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email);
          localStorage.setItem('rememberPassword', password);
        } else {
          localStorage.removeItem('rememberEmail');
          localStorage.removeItem('rememberPassword');
        }
        navigate('/landing');
      } else {
        setError(result.message || 'Login failed. Please try again.');
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
      await createUserWithEmailAndPassword(auth, email, password);
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
      setOtpError('Có lỗi xảy ra. Vui lòng thử lại.');
      return;
    }
    
    setIsLoading(true);
    try {
      await confirmationResult.confirm(code);
      setShowOtpModal(false);
      setSuccessMsg('Xác thực thành công! Tài khoản đã được tạo.');
      setIsRegister(false);
      setPhone('');
      setOtpCode(['', '', '', '', '', '']);
    } catch (err: any) {
      setOtpError('Mã xác thực không đúng. Vui lòng thử lại.');
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
      setOtpError(result.message || 'Không thể gửi lại mã. Vui lòng thử lại.');
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
            <h1 className="login-title">Nhật Ký Tình Yêu</h1>
            <p className="login-subtitle">Hành Trình Tình Yêu 💌</p>
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
                  Đăng ký bằng Email
                </label>
                <label style={{ marginLeft: '1.5em' }}>
                  <input
                    type="radio"
                    name="register-method"
                    value="phone"
                    checked={registerMethod === 'phone'}
                    onChange={() => setRegisterMethod('phone')}
                  />{' '}
                  Đăng ký bằng Điện Thoại
                </label>
              </div>
            )}

            {/* Email/Phone Field */}
            {isRegister ? (
              registerMethod === 'phone' ? (
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Số Điện Thoại
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
                    Email
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
                  Email
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
                <span className="remember-me-text">Lưu Thông Tin</span>
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
                  <span>{isRegister ? 'Đang tạo tài khoản...' : 'Đang đăng nhập...'}</span>
                </>
              ) : (
                <>
                  <Heart className="login-button-icon fill-current" />
                  <span>{isRegister ? 'Tạo Tài Khoản' : 'Tiếp Tục Hành Trình Tình Yêu'}</span>
                  <Heart className="login-button-icon fill-current" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">hoặc</span>
            <div className="divider-line"></div>
          </div>

          {/* Social Login Options */}
          <div className="social-login">
            <button className="social-button">
              <div className="social-icon google">G</div>
              <span>Đăng nhập bằng Google</span>
            </button>
            
            <button className="social-button">
              <div className="social-icon facebook">f</div>
              <span>Đăng nhập bằng Facebook</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="footer-links">
            <p className="footer-text">
              {isRegister ? (
                <>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    className="footer-link"
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                      setSuccessMsg('');
                    }}
                  >
                    Đăng Nhập
                  </button>
                </>
              ) : (
                <>
                  Mới sử dụng Nhật Ký Tình Yêu?{' '}
                  <button
                    type="button"
                    className="footer-link"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                      setSuccessMsg('');
                    }}
                  >
                    Tạo Tài Khoản
                  </button>
                </>
              )}
            </p>
            <button className="footer-link">
              Quên Mật Khẩu?
            </button>
          </div>
        </div>

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
                <h2 className="otp-modal-title">Xác Thực OTP</h2>
                <p className="otp-modal-subtitle">
                  Nhập mã 6 chữ số đã được gửi đến<br />
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
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  'Xác Nhận'
                )}
              </button>

              <div className="otp-resend-container">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="otp-resend-button"
                  >
                    Gửi lại mã OTP
                  </button>
                ) : (
                  <p className="otp-countdown">
                    Gửi lại mã sau <strong>{resendCountdown}s</strong>
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
