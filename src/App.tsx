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
import './styles/PageLoader.css';
import './styles/transitions.css';
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
              </header>

              {/* Mobile Menu - Outside header to avoid stacking context issues */}
              {mobileMenuOpen && (
                <>
                  {/* Animated Backdrop with blur */}
                  <div 
                    className={`fixed inset-0 bg-gradient-to-br from-black/70 via-rose-900/40 to-black/70 backdrop-blur-md z-[60] transition-all duration-700 ${menuMounted ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    {/* Animated gradient orbs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
                  </div>
                  
                  {/* Menu Panel */}
                  <div className={`fixed top-0 right-0 w-[360px] max-w-[90vw] h-full bg-gradient-to-b from-white via-white to-pink-50/30 shadow-[-15px_0_60px_rgba(236,72,153,0.2)] z-[70] overflow-y-auto transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${menuMounted ? 'translate-x-0' : 'translate-x-full'}`}>
                    {/* Animated Decorative Background Pattern */}
                    <div className="absolute top-0 right-0 w-full h-56 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 overflow-hidden">
                      {/* Floating animated orbs */}
                      <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-3xl animate-float" />
                      <div className="absolute top-24 -left-12 w-36 h-36 bg-white/10 rounded-full blur-2xl animate-float-delayed" />
                      <div className="absolute top-8 right-20 w-20 h-20 bg-white/20 rounded-full blur-xl animate-pulse" />
                      
                      {/* Animated gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-shimmer" />
                      
                      {/* Sparkles effect */}
                      <div className="absolute top-10 right-16 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                      <div className="absolute top-28 right-32 w-1.5 h-1.5 bg-white/70 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
                      <div className="absolute top-20 left-20 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                      
                      {/* Wave decoration at bottom */}
                      <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-8">
                          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-white/10"></path>
                          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-white/10"></path>
                          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-white/20"></path>
                        </svg>
                      </div>
                    </div>

                    {/* Header */}
                    <div className="relative z-10 p-6 pb-8">
                      <div className={`flex items-start justify-between mb-8 transition-all duration-700 ${menuMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                        <div className="flex items-center gap-3">
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="relative w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                              <Heart className="w-8 h-8 text-pink-500 animate-pulse" fill="currentColor" style={{ animationDuration: '2s' }} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-3 border-white rounded-full shadow-lg">
                              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping" />
                            </div>
                          </div>
                          <div>
                            <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg">{t('landing.heroHighlight')}</h2>
                            <p className="text-pink-100 text-xs font-medium mt-0.5 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 bg-pink-200 rounded-full animate-pulse" />
                              Lưu giữ khoảnh khắc yêu thương
                            </p>
                          </div>
                        </div>
                        <button 
                          className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 active:scale-90 backdrop-blur-sm hover:rotate-90 group" 
                          onClick={() => setMobileMenuOpen(false)} 
                          aria-label="Close menu"
                        >
                          <X size={22} className="text-white group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        </button>
                      </div>
                      
                      {/* User Stats */}
                      <div className={`flex gap-2 transition-all duration-700 delay-100 ${menuMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex-1 bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 text-center">
                          <div className="text-white text-2xl font-bold">{years.length}</div>
                          <div className="text-pink-100 text-[10px] font-medium">Năm</div>
                        </div>
                        <div className="flex-1 bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 text-center">
                          <div className="text-white text-2xl font-bold">
                            {Object.values(memoriesByYear).reduce((acc, memories) => acc + memories.length, 0)}
                          </div>
                          <div className="text-pink-100 text-[10px] font-medium">Kỷ niệm</div>
                        </div>
                        <div className="flex-1 bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 text-center">
                          <div className="text-white text-2xl font-bold">
                            {Object.values(memoriesByYear).flat().reduce((acc, m) => acc + (m.images?.length || 0), 0)}
                          </div>
                          <div className="text-pink-100 text-[10px] font-medium">Hình ảnh</div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Links */}
                    <nav className="relative z-10 px-6 py-4">
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-gray-200/60 p-3 space-y-2 border border-gray-100/50">
                        {[
                          { href: '/create-memory', icon: BookOpen, label: t('nav.create'), delay: '0ms', badge: '+', isBadgePlus: true },
                          { href: '/view-memory', icon: Camera, label: t('nav.memories'), delay: '100ms', badge: Object.values(memoriesByYear).reduce((acc, memories) => acc + memories.length, 0).toString() },
                          { href: '/anniversary-reminders', icon: Bell, label: t('nav.anniversary'), delay: '200ms', badge: years.length.toString() },
                          { href: '/setting-page', icon: Download2, label: t('nav.settings'), delay: '300ms' }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = window.location.pathname === item.href;
                          return (
                            <a 
                              key={item.href}
                              href={item.href}
                              style={{ animationDelay: item.delay }}
                              className={`group relative flex items-center gap-4 px-4 py-4 rounded-2xl font-semibold transition-all duration-500 overflow-hidden ${
                                menuMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                              } ${
                                isActive
                                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-xl shadow-pink-500/50 scale-[1.03]' 
                                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:via-rose-50 hover:to-pink-50 active:scale-[0.97] hover:shadow-lg hover:shadow-pink-200/50'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                setTimeout(() => window.location.href = item.href, 400);
                                setMobileMenuOpen(false);
                              }}
                            >
                              {/* Ripple effect overlay */}
                              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-500 rounded-2xl" />
                              
                              {/* Animated border glow for active item */}
                              {isActive && (
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 opacity-75 blur-sm animate-pulse" style={{ animationDuration: '3s' }} />
                              )}
                              
                              <div className="relative flex items-center gap-4 w-full">
                                <div className={`relative p-3 rounded-2xl transition-all duration-500 ${
                                  isActive
                                    ? 'bg-white/25 shadow-inner scale-110 rotate-12' 
                                    : 'bg-gradient-to-br from-pink-100 via-rose-100 to-pink-100 group-hover:scale-125 group-hover:rotate-12 shadow-lg shadow-pink-200/50'
                                }`}>
                                  {/* Icon glow */}
                                  {isActive && (
                                    <div className="absolute inset-0 bg-white/30 rounded-2xl blur-md" />
                                  )}
                                  <Icon 
                                    size={22} 
                                    className={`relative transition-all duration-500 ${
                                      isActive ? 'text-white' : 'text-pink-600 group-hover:text-pink-700'
                                    }`} 
                                    strokeWidth={2.5} 
                                  />
                                </div>
                                <span className="flex-1 tracking-wide relative z-10">{item.label}</span>
                                
                                {/* Badge or Indicator */}
                                {item.badge && !isActive && (
                                  <div className="relative z-10 min-w-[28px] h-7 px-2.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30">
                                    <span className="text-white text-sm font-bold leading-none">{item.badge}</span>
                                  </div>
                                )}
                                
                                {isActive ? (
                                  <div className="flex items-center gap-1.5 relative z-10">
                                    <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDuration: '1s' }} />
                                    <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.15s' }} />
                                    <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.3s' }} />
                                  </div>
                                ) : (
                                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 group-hover:scale-150 transition-transform" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Shine effect on hover */}
                              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                            </a>
                          );
                        })}
                      </div>
                      
                      {/* Decorative divider */}
                      <div className="flex items-center gap-3 my-6 px-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                      </div>
                    </nav>

                    {/* Footer */}
                    <div className={`relative z-10 mt-auto pt-4 pb-6 px-6 transition-all duration-700 delay-300 ${menuMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <div className="relative bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 rounded-3xl p-5 border border-pink-200/50 shadow-xl shadow-pink-200/40 overflow-hidden group hover:shadow-2xl hover:shadow-pink-300/50 transition-all duration-500">
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-100/50 via-transparent to-rose-100/50 animate-shimmer" />
                        
                        <div className="relative flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="relative w-12 h-12 bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-pink-500/40 group-hover:scale-110 transition-transform duration-500">
                              <Heart className="w-6 h-6 text-white animate-pulse" fill="currentColor" style={{ animationDuration: '2s' }} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">Made with Love</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">Version 3.0.0 • Premium</p>
                          </div>
                          <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

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
                        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-pink-100 to-rose-100">
                          {heroImages.length > 0 ? (
                            <LazyImage
                              src={heroImages[heroIndex]}
                              alt="Love Memory"
                              className="w-full h-full object-cover"
                              priority={true}
                              transformations="f_auto,q_auto,w_800"
                              enableBlur={true}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <Heart className="w-24 h-24 text-pink-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">{t('landing.noMemories')}</p>
                              </div>
                            </div>
                          )}
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

                {/* Beautiful Memories Timeline Section */}
                <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cream-50 via-pink-50 to-orange-50">
                  <div className="max-w-5xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                          {t('landing.timelineTitle')}
                        </span>
                      </h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {t('landing.timelineSubtitle')}
                      </p>
                    </div>

                    {timelineLoading ? (
                      <div className="text-center py-12">
                        <div className="inline-block w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                      </div>
                    ) : timelineMemories.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">{t('landing.noMemories')}</p>
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
                            <span>{t('landing.viewFullJourney')}</span>
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
                            {t('landing.exploreAllMemories')}
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
