import { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import {
  Heart, BookOpen, Camera, Bell, Download as Download2,
  Menu, X, Instagram, Twitter, Facebook,
  Mail, Phone, MapPin
} from 'lucide-react';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import { useLanguage } from './hooks/useLanguage';
import { useToastContext } from './contexts/ToastContext';
import { useStatusGuard } from './hooks/useStatusGuard';
import { fetchMemories } from './services/firebaseMemoriesService';
import { MoodTheme, themes, isValidTheme } from './config/themes';
import { getUserTheme } from './apis/userThemeApi';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageTransition } from './components/PageTransition';
import { LazyImage } from './components/LazyImage';
import { GallerySkeleton } from './components/GallerySkeleton';
import { ToastContainer } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import './styles/App.css';
import './styles/PageLoader.css';
import './styles/transitions.css';
import './styles/Toast.css';
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

const AdminDashboard = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/AdminDashboard'
));

const MigrationTool = lazy(() => import(
  /* webpackChunkName: "migration" */
  './pages/MigrationTool'
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
  sortOrder?: 'asc' | 'desc';
  userId?: string;
};

// Note: fetchCloudinaryImages is deprecated in V3.0
// Use fetchMemories from firebaseMemoriesService instead
// This interface is kept for backward compatibility only

function App() {
  const navigate = useNavigate();
  const { userId, loading } = useCurrentUserId();
  const { t } = useLanguage();
  const { toasts, removeToast } = useToastContext();
  const { error: showError } = useToastContext();
  
  // Monitor user status in real-time and auto-logout if suspended/removed
  useStatusGuard();

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

  // Health check removed - no longer needed to stay within Vercel function limit

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

  // Fetch theme from Firebase when user logs in
  useEffect(() => {
    if (loading || !userId) return;
    
    (async () => {
      try {
        const fetchedTheme = await getUserTheme(userId);
        if (fetchedTheme && isValidTheme(fetchedTheme)) {
          setCurrentThemeState(fetchedTheme);
          localStorage.setItem('currentTheme', fetchedTheme);
        }
      } catch (error) {
        console.error('Failed to fetch user theme:', error);
      }
    })();
  }, [userId, loading]);

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

  const features = useMemo(() => [
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
  ], [t]);

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  
  // Timeline state - 5 random memories for storytelling
  const [timelineMemories, setTimelineMemories] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

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
      if (!userId) {
        setGalleryLoading(false);
        return;
      }
      
      try {
        setGalleryLoading(true);
        // Fetch recent memories with photos
        const memories = await fetchMemories({ 
          userId, 
          limit: 10 // Get more memories to ensure we have 6+ photos
        });
        
        // Extract all photo URLs from memories
        const allPhotos: string[] = [];
        memories.forEach(memory => {
          if (memory.photos && memory.photos.length > 0) {
            memory.photos.forEach(photo => {
              // Build Cloudinary URL from publicId
              const url = photo.startsWith('http') 
                ? photo 
                : `https://res.cloudinary.com/dhelefhv1/image/upload/${photo}`;
              allPhotos.push(url);
            });
          }
        });
        
        // Limit to 6 images for gallery
        setGalleryImages(allPhotos.slice(0, 6));
      } catch (e) {
        console.error('Failed to fetch gallery images:', e);
        showError('Failed to load gallery images');
        setGalleryImages([]);
      } finally {
        setGalleryLoading(false);
      }
    }
    fetchImages();
  }, [userId]);

  // Fetch timeline memories - 5 random curated moments
  useEffect(() => {
    async function fetchTimelineMemories() {
      if (!userId) {
        setTimelineLoading(false);
        return;
      }
      
      try {
        setTimelineLoading(true);
        // Fetch more memories to have a good selection pool
        const memories = await fetchMemories({ 
          userId, 
          limit: 20
        });
        
        // Filter memories that have at least one photo and a description
        const memoriesWithPhotos = memories.filter(mem => 
          mem.photos && mem.photos.length > 0 && mem.description
        );
        
        // Randomly select 5 memories
        const shuffled = [...memoriesWithPhotos].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);
        
        // Format timeline data
        const timelineData = selected.map(mem => ({
          id: mem.id,
          date: mem.date,
          image: mem.photos[0].startsWith('http') 
            ? mem.photos[0]
            : `https://res.cloudinary.com/dhelefhv1/image/upload/${mem.photos[0]}`,
          caption: mem.description.length > 100 
            ? mem.description.substring(0, 100) + '...'
            : mem.description,
          mood: mem.mood || 'romantic'
        }));
        
        setTimelineMemories(timelineData);
      } catch (e) {
        console.error('Failed to fetch timeline memories:', e);
        setTimelineMemories([]);
      } finally {
        setTimelineLoading(false);
      }
    }
    fetchTimelineMemories();
  }, [userId]);

  return (
    <>
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
    <PageTransition>
    <Routes>
      <Route path="/" element={<LoginPage currentTheme={currentTheme} />} />
      <Route path="/landing" element={
        (() => {
          const theme = themes[currentTheme];
          return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
              {/* Header */}
              <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-xl">
                        <Heart className="w-6 h-6 text-white" fill="white" />
                      </div>
                      <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
                        {t('landing.heroHighlight')}
                      </span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                      <a href="/create-memory" className="text-gray-700 font-medium hover:text-red-600 transition-colors">
                        {t('nav.create')}
                      </a>
                      <a href="/view-memory" className="text-gray-700 font-medium hover:text-red-600 transition-colors">
                        {t('nav.memories')}
                      </a>
                      <a href="/anniversary-reminders" className="text-gray-700 font-medium hover:text-red-600 transition-colors">
                        {t('nav.anniversary')}
                      </a>
                      <a href="/setting-page" className="text-gray-700 font-medium hover:text-red-600 transition-colors">
                        {t('nav.settings')}
                      </a>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button 
                      className="md:hidden flex items-center justify-center w-10 h-10 text-gray-700 hover:text-red-600 transition-all hover:scale-110"
                      onClick={() => setMobileMenuOpen(true)} 
                      aria-label="Open menu"
                    >
                      <Menu size={28} />
                    </button>
                  </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className={`fixed inset-0 bg-black/50 z-[999] transition-opacity duration-300 ${menuMounted ? 'opacity-100' : 'opacity-0'}`}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close menu"
                    />
                    
                    {/* Menu Panel */}
                    <div className={`fixed top-0 right-0 w-80 max-w-[80vw] h-full bg-gradient-to-br from-pink-50 to-rose-100 shadow-2xl z-[1001] overflow-y-auto transition-transform duration-300 ${menuMounted ? 'translate-x-0' : 'translate-x-full'}`}>
                      <div className="p-6 flex flex-col gap-5">
                        {/* Close Button */}
                        <button 
                          className="self-end p-2 hover:bg-white/50 rounded-lg transition-colors" 
                          onClick={() => setMobileMenuOpen(false)} 
                          aria-label="Close menu"
                        >
                          <X size={28} className="text-gray-700" />
                        </button>

                        {/* Menu Links */}
                        <a 
                          href="/create-memory" 
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${window.location.pathname === '/create-memory' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-700 hover:bg-white/50'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setTimeout(() => window.location.href = '/create-memory', 300);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <BookOpen size={20} />
                          {t('nav.create')}
                        </a>
                        
                        <a 
                          href="/view-memory" 
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${window.location.pathname === '/view-memory' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-700 hover:bg-white/50'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setTimeout(() => window.location.href = '/view-memory', 300);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Camera size={20} />
                          {t('nav.memories')}
                        </a>
                        
                        <a 
                          href="/anniversary-reminders" 
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${window.location.pathname === '/anniversary-reminders' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-700 hover:bg-white/50'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setTimeout(() => window.location.href = '/anniversary-reminders', 300);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Bell size={20} />
                          {t('nav.anniversary')}
                        </a>
                        
                        <a 
                          href="/setting-page" 
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${window.location.pathname === '/setting-page' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-700 hover:bg-white/50'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setTimeout(() => window.location.href = '/setting-page', 300);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Download2 size={20} />
                          {t('nav.settings')}
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </header>

              {/* Main Content */}
              <main>
                {/* Hero Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                      {/* Hero Content */}
                      <div className="text-center lg:text-left space-y-6 lg:pr-8">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                          {t('landing.heroTitle')}
                          <br />
                          <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                            {t('landing.heroHighlight')}
                          </span>
                        </h1>
                        
                        <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                          {t('landing.heroSubtitle')}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                          <a 
                            href="/create-memory" 
                            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          >
                            {t('landing.getStarted')}
                          </a>
                          <a 
                            href="/view-memory" 
                            className="inline-flex items-center justify-center px-8 py-4 rounded-full border-2 border-pink-300 text-gray-700 font-semibold hover:bg-pink-50 hover:border-pink-400 transition-all duration-300"
                          >
                            {t('nav.memories')}
                          </a>
                        </div>
                      </div>

                      {/* Hero Image */}
                      <div className="relative">
                        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                          <LazyImage
                            src={heroImages.length > 0 ? heroImages[heroIndex] : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800"}
                            alt="Love Memory"
                            className="w-full h-full object-cover"
                            priority={true}
                            transformations="f_auto,q_auto,w_800"
                            enableBlur={true}
                          />
                        </div>
                        {/* Decorative Elements */}
                        <div className="absolute -top-4 -left-4 w-24 h-24 bg-pink-200 rounded-full blur-3xl opacity-60 animate-pulse" />
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Features Section */}
                <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                  <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-12 lg:mb-16">
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                          {t('landing.featuresTitle')}
                        </span>
                      </h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {t('landing.featuresTitle')}
                      </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                      {features.map((feature, idx) => (
                        <div 
                          key={idx}
                          className="group relative p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                        >
                          {/* Icon */}
                          <div className="w-14 h-14 mb-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                            {feature.icon}
                          </div>
                          
                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {feature.title}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-gray-600 leading-relaxed">
                            {feature.description}
                          </p>

                          {/* Decorative dot */}
                          <div className="absolute top-4 right-4 w-2 h-2 bg-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Gallery Section - Redesigned Grid Layout */}
                <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-pink-50">
                  <div className="max-w-7xl mx-auto">
                    {galleryLoading ? (
                      <GallerySkeleton />
                    ) : (
                      <>
                        {/* Section Header */}
                        <div className="text-center mb-12 lg:mb-16">
                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
                              {t('landing.galleryTitle')}
                            </span>
                          </h2>
                          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            {t('landing.gallerySubtitle')}
                          </p>
                        </div>

                        {/* Gallery Grid */}
                        {galleryImages.length === 0 ? (
                          <div className="text-center py-16">
                            <p className="text-gray-400 text-lg">{t('landing.emptyState')}</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {galleryImages.slice(0, 6).map((img, idx) => (
                              <div
                                key={idx}
                                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                              >
                                {/* Image */}
                                <LazyImage
                                  src={img}
                                  alt={`Memory ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                  transformations="f_auto,q_auto,w_600"
                                  enableBlur={true}
                                />
                                
                                {/* Hover Overlay with Heart */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                  <Heart 
                                    className="w-12 h-12 text-white transform scale-0 group-hover:scale-100 transition-transform duration-500 delay-100" 
                                    fill="white"
                                  />
                                </div>

                                {/* Decorative Corner */}
                                <div className="absolute top-3 right-3 w-3 h-3 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </section>

                {/* Beautiful Memories Timeline Section */}
                <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cream-50 via-pink-50 to-orange-50">
                  <div className="max-w-5xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                          Beautiful Memories
                        </span>
                      </h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        A small selection of moments from our journey together
                      </p>
                    </div>

                    {timelineLoading ? (
                      <div className="text-center py-12">
                        <div className="inline-block w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                      </div>
                    ) : timelineMemories.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No memories to display yet</p>
                      </div>
                    ) : (
                      <>
                        {/* Timeline Container */}
                        <div className="relative">
                          {/* Vertical Line - Desktop */}
                          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-200 via-rose-300 to-pink-200 transform -translate-x-1/2" />
                          
                          {/* Vertical Line - Mobile */}
                          <div className="lg:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-200 via-rose-300 to-pink-200" />

                          {/* Timeline Items */}
                          <div className="space-y-12 lg:space-y-16">
                            {timelineMemories.map((memory, idx) => {
                              const isLeft = idx % 2 === 0;
                              const formattedDate = new Date(memory.date).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              });

                              return (
                                <div key={memory.id} className="relative">
                                  {/* Desktop Layout - Alternating Left/Right */}
                                  <div className={`hidden lg:grid lg:grid-cols-2 lg:gap-12 items-center ${isLeft ? '' : 'lg:grid-flow-dense'}`}>
                                    {/* Content Side */}
                                    <div className={`${isLeft ? 'lg:text-right lg:pr-8' : 'lg:col-start-2 lg:text-left lg:pl-8'} opacity-0 animate-fade-in-up`} style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'forwards' }}>
                                      {/* Date Badge */}
                                      <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 text-rose-700 font-semibold text-sm mb-4 shadow-sm`}>
                                        {formattedDate}
                                      </div>
                                      
                                      {/* Caption */}
                                      <p className="text-gray-700 leading-relaxed italic">
                                        "{memory.caption}"
                                      </p>
                                    </div>

                                    {/* Image Side */}
                                    <div className={`${isLeft ? 'lg:col-start-2' : 'lg:col-start-1'} opacity-0 animate-fade-in-up`} style={{ animationDelay: `${idx * 100 + 50}ms`, animationFillMode: 'forwards' }}>
                                      <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                                        <img
                                          src={memory.image}
                                          alt={`Memory from ${formattedDate}`}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        {/* Subtle overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                      </div>
                                    </div>

                                    {/* Timeline Dot */}
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-4 border-white shadow-lg" />
                                    </div>
                                  </div>

                                  {/* Mobile Layout - Single Column */}
                                  <div className="lg:hidden flex gap-6">
                                    {/* Timeline Dot - Mobile */}
                                    <div className="flex-shrink-0">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-4 border-white shadow-lg mt-2" />
                                    </div>

                                    {/* Content - Mobile */}
                                    <div className="flex-1 opacity-0 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'forwards' }}>
                                      {/* Date Badge */}
                                      <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 text-rose-700 font-semibold text-sm mb-4 shadow-sm">
                                        {formattedDate}
                                      </div>
                                      
                                      {/* Image */}
                                      <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 mb-4">
                                        <img
                                          src={memory.image}
                                          alt={`Memory from ${formattedDate}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                      </div>

                                      {/* Caption */}
                                      <p className="text-gray-700 leading-relaxed italic">
                                        "{memory.caption}"
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* End Dot */}
                          <div className="relative mt-12 flex justify-center lg:justify-center">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 shadow-md" />
                          </div>
                        </div>

                        {/* CTA at Bottom */}
                        <div className="text-center mt-16">
                          <a 
                            href="/view-memory" 
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-pink-300 text-gray-700 font-semibold hover:bg-pink-50 hover:border-pink-400 hover:shadow-lg transition-all duration-300 group"
                          >
                            <span>View Full Journey</span>
                            <svg 
                              className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </a>
                          <p className="text-sm text-gray-500 mt-4">
                            Explore all memories from your journey
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600">
                  <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                      {t('landing.ctaTitle')}
                    </h2>
                    <p className="text-lg sm:text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
                      {t('landing.ctaSubtitle')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                      <a 
                        href="/create-memory" 
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-rose-600 font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                      >
                        {t('nav.create')}
                        <BookOpen size={18} />
                      </a>
                      <a 
                        href="/view-memory" 
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-rose-600 transition-all duration-300"
                      >
                        {t('nav.memories')}
                        <Camera size={18} />
                      </a>
                    </div>

                    <p className="text-sm text-pink-100">
                      {t('landing.ctaButton')}
                    </p>
                  </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-7xl mx-auto">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                      {/* Brand */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Heart className="w-6 h-6 text-pink-500" fill="currentColor" />
                          <span className="text-lg font-bold text-white">{t('landing.heroHighlight')}</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Lưu giữ những khoảnh khắc yêu thương của bạn mãi mãi.
                        </p>
                      </div>

                      {/* Quick Links */}
                      <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <div className="space-y-2">
                          <a href="/create-memory" className="block text-sm hover:text-pink-400 transition-colors">
                            {t('nav.create')}
                          </a>
                          <a href="/view-memory" className="block text-sm hover:text-pink-400 transition-colors">
                            {t('nav.memories')}
                          </a>
                          <a href="/anniversary-reminders" className="block text-sm hover:text-pink-400 transition-colors">
                            {t('nav.anniversary')}
                          </a>
                        </div>
                      </div>

                      {/* Contact */}
                      <div>
                        <h3 className="text-white font-semibold mb-4">Contact</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-pink-500" />
                            <span>support@lovememory.com</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-pink-500" />
                            <span>+84 123 456 789</span>
                          </div>
                        </div>
                      </div>

                      {/* Social */}
                      <div>
                        <h3 className="text-white font-semibold mb-4">Follow Us</h3>
                        <div className="flex gap-3">
                          <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-500 flex items-center justify-center transition-colors">
                            <Facebook size={18} />
                          </a>
                          <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-500 flex items-center justify-center transition-colors">
                            <Instagram size={18} />
                          </a>
                          <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-500 flex items-center justify-center transition-colors">
                            <Twitter size={18} />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Copyright */}
                    <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
                      © 2025 Love Memory. All rights reserved.
                    </div>
                  </div>
                </footer>
              </main>
            </div>
          );
        })()
      } />
      <Route path="/create-memory" element={<CreateMemory onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/view-memory" element={<ViewMemory onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/anniversary-reminders" element={<AnniversaryReminders onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/setting-page" element={<SettingPage onBack={() => window.history.back()} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="SysAdmin">
            <AdminDashboard onBack={() => window.history.back()} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/migration" 
        element={
          <ProtectedRoute requiredRole="SysAdmin">
            <MigrationTool onBack={() => window.history.back()} />
          </ProtectedRoute>
        } 
      />
    </Routes>
    </PageTransition>
    </Suspense>
    </ErrorBoundary>
    </>
  );
}

export default App;
