import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from './firebase/firebaseConfig';
import { Heart, Mail, Lock, Eye, EyeOff, BookHeart, Calendar, Phone } from 'lucide-react';
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
  currentTheme?: 'happy' | 'calm' | 'romantic';
}

const themes = {
  happy: {
    background: 'linear-gradient(135deg, #FFFDE4 0%, #FFF 50%, #FEF08A 100%)',
    cardBg: '#fff',
    textPrimary: '#78350f',
    border: '#FEF08A',
  },
  calm: {
    background: 'linear-gradient(135deg, #EEF2FF 0%, #FFF 50%, #E0E7FF 100%)',
    cardBg: '#fff',
    textPrimary: '#3730a3',
    border: '#E0E7FF',
  },
  romantic: {
    background: 'linear-gradient(135deg, #FDF2F8 0%, #FFF 50%, #FCE7F3 100%)',
    cardBg: '#fff',
    textPrimary: '#831843',
    border: '#FCE7F3',
  }
};

function LoginPage({ currentTheme = 'happy' }: LoginPageProps) {
  const theme = themes[currentTheme];
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % loveQuotes.length);
    }, 4000);

    return () => clearInterval(interval);
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
        setError('Please fill in all fields to continue your love journey 💕');
        return;
      }
    }
    setIsLoading(true);
    if (isRegister) {
      // Sign Up
      let result;
      if (registerMethod === 'phone') {
        result = await registerWithPhoneFirebase(phone);
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
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      const code = window.prompt('Enter the verification code sent to your phone:');
      if (!code) return { success: false, message: 'Verification code is required.' };
      await confirmationResult.confirm(code);
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

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="login-container">
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
            <h1 className="login-title">Love Journey</h1>
            <p className="login-subtitle">Chào mừng quay lại Hành Trình Tình Yêu của bạn 💌</p>
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
                  <div className="input-container">
                    <Phone className="input-icon" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                      placeholder="+84xxxxxxxxx"
                      required
                    />
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
                <span className="remember-me-text">Nhớ Tôi</span>
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
              <span>Tiếp Tục bằng Google</span>
            </button>
            
            <button className="social-button">
              <div className="social-icon facebook">f</div>
              <span>Tiếp Tục bằng Facebook</span>
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
                  Mới sử dụng Love Journey?{' '}
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
