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

  // ✅ Gọi API health check từ serverless Vercel
  useEffect(() => {
    fetch('/api/cloudinary/health')
      .then(res => res.json())
      .then(data => {
        console.log('✅ API /health ok:', data);
      })
      .catch(err => {
        console.error('❌ API /health error:', err);
      });
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
        <div className="landing-page">
          {/* phần landing giữ nguyên như trước, không thay đổi */}
        </div>
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
