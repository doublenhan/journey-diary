
import React, { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from './firebase/firebaseConfig';
import { Heart, Mail, Lock, Eye, EyeOff, BookHeart, Calendar } from 'lucide-react';
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
  onLogin?: (email: string, password: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [error, setError] = useState('');

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
    if (!email || !password) {
      setError('Please fill in all fields to continue your love journey 💕');
      return;
    }
    setIsLoading(true);
    // Use Firebase Auth
    const result = await loginWithFirebase(email, password);
    setIsLoading(false);
    if (result.success) {
      if (onLogin) {
        onLogin(email, password);
      }
    } else {
      setError(result.message || 'Login failed. Please try again.');
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
            <p className="login-subtitle">Welcome back to your Love Journey 💌</p>
          </div>

          {/* Current Date */}
          <div className="date-display">
            <Calendar className="date-icon" />
            {getCurrentDate()}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-container">
                <Mail className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-container">
                <Lock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="password-toggle-icon" />
                  ) : (
                    <Eye className="password-toggle-icon" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? (
                <>
                  <Heart className="login-button-icon loading fill-current" />
                  <span>Signing you in...</span>
                </>
              ) : (
                <>
                  <Heart className="login-button-icon fill-current" />
                  <span>Continue Love Journey</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          {/* Social Login Options */}
          <div className="social-login">
            <button className="social-button">
              <div className="social-icon google">G</div>
              <span>Continue with Google</span>
            </button>
            
            <button className="social-button">
              <div className="social-icon facebook">f</div>
              <span>Continue with Facebook</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="footer-links">
            <p className="footer-text">
              New to Love Journey?{' '}
              <button className="footer-link">
                Create Account
              </button>
            </p>
            <button className="footer-link">
              Forgot Password?
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
