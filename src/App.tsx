import { useState, useEffect, useRef } from 'react';
import {
  Heart, BookOpen, Camera, Bell, Download as Download2,
  FileText, Menu, X, Instagram, Twitter, Facebook,
  Mail, Phone, MapPin
} from 'lucide-react';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { useCurrentUserId } from './hooks/useCurrentUserId';
import CreateMemory from './CreateMemory';
import ViewMemory from './ViewMemory';
import JourneyTracker from './JourneyTracker';
import AnniversaryReminders from './AnniversaryReminders';
import PDFExport from './PDFExport';
import SettingPage from './SettingPage';
import LoginPage from './LoginPage';
import './styles/App.css';
import { Routes, Route, useNavigate } from 'react-router-dom';

type FetchCloudinaryOptions = {
  folder?: string;
  tags?: string[];
  maxResults?: number;
  nextCursor?: string;
  sortBy?: string;
  sortOrder?: string;
};

async function fetchCloudinaryImages(options: FetchCloudinaryOptions = {}) {
  const params = new URLSearchParams();
  if (options.folder) params.append('folder', options.folder);
  if (options.tags && options.tags.length) params.append('tags', options.tags.join(','));
  if (options.maxResults !== undefined) params.append('max_results', options.maxResults.toString());
  if (options.nextCursor) params.append('next_cursor', options.nextCursor);
  if (options.sortBy) params.append('sort_by', options.sortBy);
  if (options.sortOrder) params.append('sort_order', options.sortOrder);
  const res = await fetch(`/api/cloudinary/images?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch images');
  return await res.json();
}

type MoodTheme = 'happy' | 'calm' | 'romantic';

function App() {
  const navigate = useNavigate();
  const { userId, loading } = useCurrentUserId();

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
  const [currentTheme, setCurrentThemeState] = useState<MoodTheme>(() => {
    const stored = localStorage.getItem('currentTheme');
    return (stored === 'happy' || stored === 'calm' || stored === 'romantic') ? stored : 'romantic';
  });

  const setCurrentTheme = (theme: MoodTheme) => {
    setCurrentThemeState(theme);
    localStorage.setItem('currentTheme', theme);
  };

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Love Journaling",
      description: "Write and preserve your most precious romantic memories with our beautiful journaling interface."
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Photo Memories",
      description: "Upload and organize your favorite photos together, creating a visual timeline of your love story."
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Anniversary Reminders",
      description: "Never miss important dates with smart reminders for anniversaries, birthdays, and special moments."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "PDF Export",
      description: "Transform your digital memories into beautiful PDF books that you can print and treasure forever."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Mood Tracking",
      description: "Track your relationship's journey with mood indicators and relationship milestone celebrations."
    },
    {
      icon: <Download2 className="w-8 h-8" />,
      title: "Cloud Sync",
      description: "Keep your memories safe with automatic cloud backup and sync across all your devices."
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
        const res = await fetchCloudinaryImages({ maxResults: 20 });
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
    <Routes>
      <Route path="/" element={<LoginPage currentTheme={currentTheme} />} />
      <Route path="/landing" element={
        (() => {
          const themes = {
            happy: {
              background: 'linear-gradient(135deg, #FFFDE4 0%, #FFF 50%, #FEF08A 100%)',
              textPrimary: '#78350f',
            },
            calm: {
              background: 'linear-gradient(135deg, #EEF2FF 0%, #FFF 50%, #E0E7FF 100%)',
              textPrimary: '#3730a3',
            },
            romantic: {
              background: 'linear-gradient(135deg, #FDF2F8 0%, #FFF 50%, #FCE7F3 100%)',
              textPrimary: '#831843',
            }
          };
          const theme = themes[currentTheme];
          return (
            <div className="landing-page" style={{ background: theme.background, color: theme.textPrimary }}>
              <header className="header">
                <div className="header-container">
                  <div className="header-content">
                    <div className="logo">
                      <Heart className="logo-icon" />
                      <span className="logo-text">Love Journey</span>
                    </div>
                    <nav className="nav-desktop">
                      <a href="/create-memory" className="nav-link">Create Memory</a>
                      <a href="/view-memory" className="nav-link">View Memories</a>
                      <a href="/journey-tracker" className="nav-link">Journey Tracker</a>
                      <a href="/anniversary-reminders" className="nav-link">Anniversary Reminders</a>
                      <a href="/setting-page" className="nav-link">Settings</a>
                    </nav>
                    <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                      <Menu size={28} />
                    </button>
                  </div>
                </div>
                {mobileMenuOpen && (
                  <div className="mobile-menu">
                    <div className="mobile-menu-content">
                      <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                        <X size={28} />
                      </button>
                      <a href="/create-memory" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                        <span className="mobile-menu-link-row">
                          <BookOpen size={20} className="mobile-menu-link-icon" />
                          Create Memory
                        </span>
                      </a>
                      <a href="/view-memory" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                        <span className="mobile-menu-link-row">
                          <Camera size={20} className="mobile-menu-link-icon" />
                          View Memories
                        </span>
                      </a>
                      <a href="/journey-tracker" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                        <span className="mobile-menu-link-row">
                          <Heart size={20} className="mobile-menu-link-icon" />
                          Journey Tracker
                        </span>
                      </a>
                      <a href="/anniversary-reminders" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                        <span className="mobile-menu-link-row">
                          <Bell size={20} className="mobile-menu-link-icon" />
                          Anniversary Reminders
                        </span>
                      </a>
                      <a href="/setting-page" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                        <span className="mobile-menu-link-row">
                          <Download2 size={20} className="mobile-menu-link-icon" />
                          Settings
                        </span>
                      </a>
                    </div>
                  </div>
                )}
              </header>
              <main>
                <section className="hero-section">
                  <div className="hero-container">
                    <div className="hero-grid">
                      <div className="hero-content">
                        <h1 className="hero-title">
                          Welcome to <span className="hero-title-highlight">Love Journey</span>
                        </h1>
                        <p className="hero-description">
                          Preserve your memories, celebrate your love.
                        </p>
                        <div className="hero-buttons">
                          <a href="/create-memory" className="hero-button-primary">Start Your Memory</a>
                          <a href="/view-memory" className="hero-button-secondary">View Memories</a>
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
                        <span className="features-title-highlight">Features</span>
                      </h2>
                      <p className="features-description">
                        Everything you need to make your love story unforgettable.
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
                <section className="gallery-section">
                  <div className="gallery-container">
                    <div className="gallery-header">
                      <h2 className="gallery-title">
                        <span className="gallery-title-highlight">Gallery</span>
                      </h2>
                      <p className="gallery-description">
                        A glimpse into the beautiful moments you can save.
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
                          <div style={{width:'100%',textAlign:'center',padding:'2rem',color:'#aaa'}}>No images found.</div>
                        ) : (
                          galleryImages.map((img, idx) => (
                            <div
                              className="gallery-item"
                              key={idx}
                            >
                              <img src={img} alt="Memory" className="gallery-image" />
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
                    <h2 className="cta-title">Start Your Love Journey Today!</h2>
                    <p className="cta-description">Create, cherish, and relive your most precious memories together.</p>
                    <div className="cta-buttons">
                      <a href="/create-memory" className="cta-button">Create Memory <BookOpen size={18} /></a>
                      <a href="/view-memory" className="cta-button">View Memories <Camera size={18} /></a>
                    </div>
                    <div className="cta-note">No account required to start saving memories!</div>
                  </div>
                </section>
              </main>
            </div>
          );
        })()
      } />
      <Route path="/create-memory" element={<CreateMemory onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/view-memory" element={<ViewMemory onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/journey-tracker" element={<JourneyTracker onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/anniversary-reminders" element={<AnniversaryReminders onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/pdf-export" element={<PDFExport onBack={() => window.history.back()} currentTheme={currentTheme} />} />
      <Route path="/setting-page" element={<SettingPage onBack={() => window.history.back()} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />} />
    </Routes>
  );
}

export default App;
