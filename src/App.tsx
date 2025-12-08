import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Heart, BookOpen, Camera, Bell, Download as Download2,
  Menu, X, Instagram, Twitter, Facebook,
  Mail, Phone, MapPin
} from 'lucide-react';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import { useLanguage } from './hooks/useLanguage';
import { MoodTheme, themes, isValidTheme } from './config/themes';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/App.css';
import './styles/PageLoader.css';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Lazy load heavy components with prefetch hints
const CreateMemory = lazy(() => import(
  /* webpackChunkName: "create-memory" */
  /* webpackPrefetch: true */
  './CreateMemory'
));

const ViewMemory = lazy(() => import(
  /* webpackChunkName: "view-memory" */
  /* webpackPrefetch: true */
  './ViewMemory'
));

const AnniversaryReminders = lazy(() => import(
  /* webpackChunkName: "anniversary" */
  './AnniversaryReminders'
));

const SettingPage = lazy(() => import(
  /* webpackChunkName: "settings" */
  './SettingPage'
));

const LoginPage = lazy(() => import(
  /* webpackChunkName: "login" */
  './LoginPage'
));

// Loading component with heart balloon and person
const PageLoader = () => {
  return (
    <div className="page-loader-container">
      {/* Overlay for better contrast */}
      <div className="page-loader-overlay" />

      {/* Floating particles/sparkles */}
      {[...Array(20)].map((_, i) => (
        <div 
          key={i} 
          className="page-loader-sparkle"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 2}s`,
          }} 
        />
      ))}

      {/* Main animation container */}
      <div className="page-loader-main">
        {/* Heart balloon floating up */}
        <div className="page-loader-balloon">
          <Heart 
            className="w-16 h-16 page-loader-balloon-heart" 
            fill="#ec4899"
            style={{ color: '#ec4899' }} 
          />
        </div>

        {/* Balloon string */}
        <div className="page-loader-string" />

        {/* Complete person illustration */}
        <div className="page-loader-person">
          {/* Person SVG illustration */}
          <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <circle cx="40" cy="20" r="15" fill="#fcd6e8" stroke="#ec4899" strokeWidth="2"/>
            {/* Eyes */}
            <circle cx="35" cy="18" r="2" fill="#ec4899"/>
            <circle cx="45" cy="18" r="2" fill="#ec4899"/>
            {/* Smile */}
            <path d="M 32 24 Q 40 28 48 24" stroke="#ec4899" strokeWidth="2" fill="none" strokeLinecap="round"/>
            
            {/* Body */}
            <rect x="30" y="35" width="20" height="35" rx="10" fill="#fbcfe8" stroke="#ec4899" strokeWidth="2"/>
            
            {/* Arm holding balloon (right) */}
            <path d="M 50 45 Q 55 35 50 25" stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <circle cx="50" cy="25" r="4" fill="#fcd6e8" stroke="#ec4899" strokeWidth="2"/>
            
            {/* Other arm (left) */}
            <path d="M 30 45 Q 20 50 22 60" stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <circle cx="22" cy="60" r="4" fill="#fcd6e8" stroke="#ec4899" strokeWidth="2"/>
            
            {/* Legs */}
            <path d="M 35 70 L 32 95 L 28 110" stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M 45 70 L 48 95 L 52 110" stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round"/>
            
            {/* Feet */}
            <ellipse cx="28" cy="112" rx="6" ry="4" fill="#fcd6e8" stroke="#ec4899" strokeWidth="2"/>
            <ellipse cx="52" cy="112" rx="6" ry="4" fill="#fcd6e8" stroke="#ec4899" strokeWidth="2"/>
          </svg>
        </div>

        {/* Loading text */}
        <div className="page-loader-text-container">
          <p className="page-loader-text">Đang tải...</p>
        </div>
      </div>
    </div>
  );
};

type FetchCloudinaryOptions = {
  folder?: string;
  tags?: string[];
  maxResults?: number;
  nextCursor?: string;
  sortBy?: string;
  sortOrder?: string;
  userId?: string;
};

async function fetchCloudinaryImages(options: FetchCloudinaryOptions = {}) {
  const params = new URLSearchParams();
  if (options.folder) params.append('folder', options.folder);
  if (options.tags && options.tags.length) params.append('tags', options.tags.join(','));
  if (options.maxResults !== undefined) params.append('max_results', options.maxResults.toString());
  if (options.nextCursor) params.append('next_cursor', options.nextCursor);
  if (options.sortBy) params.append('sort_by', options.sortBy);
  if (options.sortOrder) params.append('sort_order', options.sortOrder);
  if (options.userId) params.append('userId', options.userId);
  const res = await fetch(`/api/cloudinary/images?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch images');
  return await res.json();
}

function App() {
  const navigate = useNavigate();
  const { userId, loading } = useCurrentUserId();
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/' || currentPath === '/login';
    const session = localStorage.getItem('userIdSession');
    let sessionUserId = null;
    if (session) {
      try {
        const { userId, expires } = JSON.parse(session);
        if (userId && expires && Date.now() < expires) {
          sessionUserId = userId;
        }
      } catch {}
    }
    if (!userId && !sessionUserId && !isLoginPage) {
      navigate('/');
    }
  }, [userId, loading, navigate]);

  // ✅ Gọi API health check từ serverless Vercel (non-blocking)
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const buildVersion = `${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(7)}`;
        const res = await fetch('/api/cloudinary/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        // Check if response is ok and has correct content type
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
        } else {
        }
      } catch (err) {
        // Silently fail - don't block page load
      }
    };
    
    checkHealth();
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  
  // Handle menu open with proper animation timing
  useEffect(() => {
    if (mobileMenuOpen) {
      // Set mounted immediately to show full height
      setMenuMounted(true);
    } else {
      setMenuMounted(false);
    }
  }, [mobileMenuOpen]);

  const [currentTheme, setCurrentThemeState] = useState<MoodTheme>(() => {
    const stored = localStorage.getItem('currentTheme');
    return (stored && isValidTheme(stored)) ? stored : 'romantic';
  });

  // Listen for theme changes from other components (like SettingPage)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentTheme' && e.newValue && isValidTheme(e.newValue)) {
        setCurrentThemeState(e.newValue);
      }
    };

    const handleThemeChange = (e: CustomEvent<MoodTheme>) => {
      if (isValidTheme(e.detail)) {
        setCurrentThemeState(e.detail);
      }
    };

    // Listen to storage events (for multi-tab sync)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen to custom theme change event (for same-tab updates)
    window.addEventListener('themechange' as any, handleThemeChange as any);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange' as any, handleThemeChange as any);
    };
  }, []);

  const setCurrentTheme = (theme: MoodTheme) => {
    setCurrentThemeState(theme);
    localStorage.setItem('currentTheme', theme);
    // Dispatch custom event for same-tab communication
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  };

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc')
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc')
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc')
    },
    {
      icon: <Download2 className="w-8 h-8" />,
      title: t('landing.feature4Title'),
      description: t('landing.feature4Desc')
    }
  ];

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const getImagesPerPage = () => {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  };
  const [imagesPerPage, setImagesPerPage] = useState(getImagesPerPage());

  useEffect(() => {
    const handleResize = () => setImagesPerPage(getImagesPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { memoriesByYear, years, isLoading: heroLoading, error: heroError } = useMemoriesCache(userId, loading);
  const heroImages = years.flatMap((y: string) => (memoriesByYear[y] || []).flatMap((mem: any) =>
    Array.isArray(mem.images) ? mem.images.map((img: any) => img.secure_url) : []));

  useEffect(() => {
    if (!heroImages.length) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1 >= heroImages.length ? 0 : prev + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [heroImages]);

  useEffect(() => {
    async function fetchImages() {
      try {
        // Always limit to max 6 images for both desktop and mobile
        const maxResults = 6;
        const fetchOptions: FetchCloudinaryOptions = { maxResults };
        
        // Add userId if available to fetch from user-specific folder
        if (userId) {
          fetchOptions.userId = userId;
        }
        
        const res = await fetchCloudinaryImages(fetchOptions);
        setGalleryImages(res.resources.map((img: { secure_url: any; }) => img.secure_url));
      } catch (e) {
        setGalleryImages([]);
      }
    }
    fetchImages();
  }, []);

  useEffect(() => {
    if (!galleryImages.length) return;
    const maxIndex = Math.max(0, Math.ceil(galleryImages.length / imagesPerPage) - 1);
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1 > maxIndex ? 0 : prev + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [galleryImages, imagesPerPage]);

  return (
    <>
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<LoginPage currentTheme={currentTheme} />} />
      <Route path="/landing" element={
        (() => {
          const theme = themes[currentTheme];
          return (
            <div className="landing-page" style={{ background: theme.background, color: theme.textPrimary }}>
              <header className="header">
                <div className="header-container">
                  <div className="header-content">
                    <div className="logo">
                      <Heart className="logo-icon" />
                      <span className="logo-text">{t('landing.heroHighlight')}</span>
                    </div>
                    <nav className="nav-desktop">
                      <a href="/create-memory" className="nav-link">{t('nav.create')}</a>
                      <a href="/view-memory" className="nav-link">{t('nav.memories')}</a>
                      <a href="/anniversary-reminders" className="nav-link">{t('nav.anniversary')}</a>
                      <a href="/setting-page" className="nav-link">{t('nav.settings')}</a>
                    </nav>
                    <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                      <Menu size={28} />
                    </button>
                  </div>
                </div>
                {mobileMenuOpen && (
                  <>
                    {/* Backdrop Overlay */}
                    <div 
                      className={`mobile-menu-backdrop ${menuMounted ? 'mobile-menu-backdrop-visible' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close menu"
                    />
                    <div className={`mobile-menu ${menuMounted ? 'mobile-menu-mounted' : ''}`}>
                      <div className="mobile-menu-content">
                        <button 
                          className="mobile-menu-button" 
                          onClick={() => setMobileMenuOpen(false)} 
                          aria-label="Close menu"
                        >
                          <X size={28} />
                        </button>
                        <a 
                          href="/create-memory" 
                          className={`mobile-menu-link ${window.location.pathname === '/create-memory' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setTimeout(() => window.location.href = '/create-memory', 300);
                            setMobileMenuOpen(false);
                          }}
                        >
                        <span className="mobile-menu-link-row">
                          <BookOpen size={20} className="mobile-menu-link-icon" />
                          {t('nav.create')}
                        </span>
                      </a>
                      <a 
                        href="/view-memory" 
                        className={`mobile-menu-link ${window.location.pathname === '/view-memory' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setTimeout(() => window.location.href = '/view-memory', 300);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <span className="mobile-menu-link-row">
                          <Camera size={20} className="mobile-menu-link-icon" />
                          {t('nav.memories')}
                        </span>
                      </a>
                      <a 
                        href="/anniversary-reminders" 
                        className={`mobile-menu-link ${window.location.pathname === '/anniversary-reminders' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setTimeout(() => window.location.href = '/anniversary-reminders', 300);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <span className="mobile-menu-link-row">
                          <Bell size={20} className="mobile-menu-link-icon" />
                          {t('nav.anniversary')}
                        </span>
                      </a>
                      <a 
                        href="/setting-page" 
                        className={`mobile-menu-link ${window.location.pathname === '/setting-page' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setTimeout(() => window.location.href = '/setting-page', 300);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <span className="mobile-menu-link-row">
                          <Download2 size={20} className="mobile-menu-link-icon" />
                          {t('nav.settings')}
                        </span>
                      </a>
                    </div>
                  </div>
                  </>
                )}
              </header>
              <main>
                <section className="hero-section">
                  <div className="hero-container">
                    <div className="hero-grid">
                      <div className="hero-content">
                        <h1 className="hero-title">
                          {t('landing.heroTitle')} <span className="hero-title-highlight">{t('landing.heroHighlight')}</span>
                        </h1>
                        <p className="hero-description">
                          {t('landing.heroSubtitle')}
                        </p>
                        <div className="hero-buttons">
                          <a href="/create-memory" className="hero-button-primary">{t('landing.getStarted')}</a>
                          <a href="/view-memory" className="hero-button-secondary">{t('nav.memories')}</a>
                        </div>
                      </div>
                      <div className="hero-image-container">
                        <div className="hero-image-wrapper">
                          <img
                            src={heroImages.length > 0 ? heroImages[heroIndex] : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400"}
                            alt="Love Memory"
                            className="hero-image hero-image-consistent"
                          />
                        </div>
                        <div className="hero-decoration-1"></div>
                        <div className="hero-decoration-2"></div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="features-section">
                  <div className="features-container">
                    <div className="features-header">
                      <h2 className="features-title">
                        <span className="features-title-highlight">{t('landing.featuresTitle')}</span>
                      </h2>
                      <p className="features-description">
                        {t('landing.featuresTitle')}
                      </p>
                    </div>
                    <div className="features-grid">
                      {features.map((feature, idx) => (
                        <div className="feature-card" key={idx}>
                          <div className="feature-icon">{feature.icon}</div>
                          <div className="feature-title">{feature.title}</div>
                          <div className="feature-description">{feature.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                <section className="gallery-section" style={{ background: 'white', color: '#111827' }}>
                  <div className="gallery-container">
                    <div className="gallery-header">
                      <h2 className="gallery-title" style={{ color: '#111827' }}>
                        <span className="gallery-title-highlight" style={{ color: '#dc2626' }}>{t('landing.galleryTitle')}</span>
                      </h2>
                      <p className="gallery-description" style={{ color: '#4b5563' }}>
                        {t('landing.gallerySubtitle')}
                      </p>
                    </div>
                    <div className="gallery-carousel-wrapper">
                      <div
                        className="gallery-carousel"
                        ref={carouselRef}
                        style={{
                          display: 'flex',
                          transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
                          transform: `translateX(-${carouselIndex * (100 / imagesPerPage)}%)`,
                          willChange: 'transform',
                        }}
                      >
                        {galleryImages.length === 0 ? (
                          <div style={{width:'100%',textAlign:'center',padding:'2rem',color:'#aaa'}}>{t('landing.emptyState')}</div>
                        ) : (
                          galleryImages.slice(0, 6).map((img, idx) => (
                            <div
                              className="gallery-item"
                              key={idx}
                            >
                              <img 
                                src={img} 
                                alt="Memory" 
                                className="gallery-image" 
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="gallery-overlay"></div>
                              <Heart className="gallery-heart" />
                            </div>
                          ))
                        )}
                      </div>
                      <div className="gallery-carousel-dots">
                        {Array.from({length: Math.max(1, Math.ceil(galleryImages.length / imagesPerPage))}).map((_, idx) => (
                          <span
                            key={idx}
                            className={idx === carouselIndex ? 'dot active' : 'dot'}
                            onClick={() => setCarouselIndex(idx)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                <section className="cta-section">
                  <div className="cta-container">
                    <h2 className="cta-title">{t('landing.ctaTitle')}</h2>
                    <p className="cta-description">{t('landing.ctaSubtitle')}</p>
                    <div className="cta-buttons">
                      <a href="/create-memory" className="cta-button">{t('nav.create')} <BookOpen size={18} /></a>
                      <a href="/view-memory" className="cta-button">{t('nav.memories')} <Camera size={18} /></a>
                    </div>
                    <div className="cta-note">{t('landing.ctaButton')}</div>
                  </div>
                </section>
              </main>
            </div>
          );
        })()
      } />
      <Route path="/create-memory" element={<CreateMemory onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/view-memory" element={<ViewMemory onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/anniversary-reminders" element={<AnniversaryReminders onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/setting-page" element={<SettingPage onBack={() => window.history.back()} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />} />
    </Routes>
    </Suspense>
    </ErrorBoundary>
    </>
  );
}

export default App;
