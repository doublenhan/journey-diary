import { useState, useEffect } from 'react';
import { Sparkles, Palette, User, Menu, X, Heart } from 'lucide-react';
import { auth } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserTheme, getUserTheme } from './apis/userThemeApi';
import { MoodTheme } from './config/themes';
import { settingThemes } from './config/settingThemes';

import VisualEffects from './components/VisualEffects';
import ProfileInformation from './ProfileInformation';
import MoodTracking from './MoodTracking';
import { useSyncStatus } from './hooks/useSyncStatus';
import SyncStatus from './components/SyncStatus';
import './styles/SettingPage.css';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { useCurrentUserId } from './hooks/useCurrentUserId';

type MenuItemType = 'effects' | 'mood' | 'account';

interface SettingPageProps {
  onBack?: () => void;
  currentTheme: MoodTheme;
  setCurrentTheme: (theme: MoodTheme) => void;
}

interface MenuItem {
  id: MenuItemType;
  label: string;
  icon: React.ReactNode;
}

interface Memory {
  id: string;
  title: string;
  location: string;
  description: string;
  date: string;
  year: number;
  images: string[];
  mood?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'dating' | 'wedding' | 'birthday' | 'child_birth' | 'child_birthday' | 'anniversary' | 'custom';
  description?: string;
  location?: string;
  icon?: React.ReactNode;
  color: string;
}

// Sample memory data
const sampleMemories: Memory[] = [
  {
    id: '1',
    title: 'First Date at Central Park',
    location: 'New York, NY',
    description: 'Our magical first date walking through Central Park in spring. The cherry blossoms were in full bloom.',
    date: '2023-04-15',
    year: 2023,
    images: ['https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&cs=tinysrgb&w=800'],
    mood: '😊'
  },
  {
    id: '2',
    title: 'Beach Sunset Proposal',
    location: 'Malibu, CA',
    description: 'The moment you said yes as the sun painted the sky in shades of pink and gold.',
    date: '2023-08-20',
    year: 2023,
    images: [
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    mood: '💖'
  },
  {
    id: '3',
    title: 'Cozy Winter Cabin',
    location: 'Aspen, CO',
    description: 'Our first winter getaway together, snuggled by the fireplace with hot cocoa.',
    date: '2023-12-24',
    year: 2023,
    images: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'],
    mood: '🌙'
  },
  {
    id: '4',
    title: 'Paris Anniversary',
    location: 'Paris, France',
    description: 'Celebrating our one year anniversary in the city of love. Dinner at the Eiffel Tower.',
    date: '2024-04-15',
    year: 2024,
    images: [
      'https://images.pexels.com/photos/1461974/pexels-photo-1461974.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1461975/pexels-photo-1461975.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1461976/pexels-photo-1461976.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    mood: '💖'
  },
  {
    id: '5',
    title: 'Hiking Adventure',
    location: 'Grand Canyon, AZ',
    description: 'Conquering new heights together and watching the sunrise over the canyon.',
    date: '2024-06-10',
    year: 2024,
    images: ['https://images.pexels.com/photos/1562058/pexels-photo-1562058.jpeg?auto=compress&cs=tinysrgb&w=800'],
    mood: '😊'
  }
];

function SettingPage({ onBack, currentTheme, setCurrentTheme }: SettingPageProps) {
  // Use cache for real memories/photos
  const { userId: cacheUserId, loading: cacheLoading } = useCurrentUserId();
  const { memoriesByYear, years, isLoading: memoriesLoading, error: memoriesError } = useMemoriesCache(cacheUserId, cacheLoading);
  const { syncStatus, lastSyncTime, errorMessage, startSync, syncSuccess, syncError } = useSyncStatus();
  
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('mood');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(50);

  // --- Mood Theme Persistence State ---
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTheme, setSavedTheme] = useState<MoodTheme | null>(null);
  const isSaveEnabled = savedTheme !== currentTheme;
  const [effectsEnabled, setEffectsEnabled] = useState({
    particles: true,
    hearts: false,
    transitions: true,
    glow: false,
    fadeIn: true,
    slideIn: false
  });

  const theme = settingThemes[currentTheme];

  // Apply theme globally to document body
  useEffect(() => {
    if (!theme) return;
    document.body.style.background = theme.colors.background;
    document.body.style.fontFamily = theme.fontFamily;
    // Optionally set other CSS variables for global use
    document.body.style.setProperty('--primary-color', theme.colors.primary);
    document.body.style.setProperty('--secondary-color', theme.colors.secondary);
    document.body.style.setProperty('--accent-color', theme.colors.accent);
    document.body.style.setProperty('--card-bg', theme.colors.cardBg);
    document.body.style.setProperty('--text-primary', theme.colors.textPrimary);
    document.body.style.setProperty('--text-secondary', theme.colors.textSecondary);
    document.body.style.setProperty('--border-color', theme.colors.border);
    document.body.style.setProperty('--gradient', theme.colors.gradient);
    document.body.style.setProperty('--button-gradient', theme.colors.buttonGradient);
    document.body.style.setProperty('--hover-bg', theme.colors.hoverBg);
  }, [theme]);

  const menuItems: MenuItem[] = [
    {
      id: 'effects',
      label: 'Hiệu Ứng',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'mood',
      label: 'Theo Dõi Tâm Trạng',
      icon: <Palette className="w-5 h-5" />
    },
    {
      id: 'account',
      label: 'Cài Đặt Tài Khoản',
      icon: <User className="w-5 h-5" />
    }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const fetchedTheme = await getUserTheme(user.uid);
        if (fetchedTheme && ["happy","calm","romantic","energetic","peaceful","passionate"].includes(fetchedTheme)) {
          setCurrentTheme(fetchedTheme as MoodTheme);
          setSavedTheme(fetchedTheme as MoodTheme);
        }
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleThemeChange = (newTheme: MoodTheme) => {
    setCurrentTheme(newTheme);
  };

  // Save theme to Firestore
  const handleSaveTheme = async () => {
    if (!userId) return;
    setIsSaving(true);
    startSync();
    try {
      await saveUserTheme(userId, currentTheme);
      setSavedTheme(currentTheme);
      syncSuccess();
    } catch (error) {
      syncError('Lỗi lưu theme. Vui lòng thử lại.');
      console.error('Error saving theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get userId and load theme from Firestore on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const fetchedTheme = await getUserTheme(user.uid);
        if (fetchedTheme && ["happy","calm","romantic","energetic","peaceful","passionate"].includes(fetchedTheme)) {
          setCurrentTheme(fetchedTheme as MoodTheme);
          setSavedTheme(fetchedTheme as MoodTheme);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Function to toggle visual effects
  const handleEffectToggle = (effectType: keyof typeof effectsEnabled) => {
    setEffectsEnabled(prev => ({
      ...prev,
      [effectType]: !prev[effectType]
    }));
  };

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'effects':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                Hiệu Ứng Hình Ảnh & Hoạt Hình
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Tùy chỉnh trải nghiệm hình ảnh của bạn với các hiệu ứng và chuyển tiếp.
              </p>
            </div>

            {/* Animation Speed Control */}
            <div 
              className="p-6 rounded-2xl border"
              style={{ 
                background: theme.colors.cardBg,
                borderColor: theme.colors.border
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
                Tốc Độ Chuyển Động Hiệu Ứng
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${theme.colors.primary} 0%, ${theme.colors.primary} ${animationSpeed}%, ${theme.colors.border} ${animationSpeed}%, ${theme.colors.border} 100%)`,
                    accentColor: theme.colors.primary
                  }}
                />
                <div className="text-center">
                </div>
              </div>
            </div>
            
            {/* Effects Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(effectsEnabled).map(([key, enabled]) => (
                <div 
                  key={key}
                  className="p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg"
                  style={{ 
                    background: theme.colors.cardBg,
                    borderColor: theme.colors.border
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium" style={{ color: theme.colors.textPrimary }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleEffectToggle(key as keyof typeof effectsEnabled)}
                        className="sr-only peer"
                      />
                      <div 
                        className="w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                        style={{ 
                          backgroundColor: enabled ? theme.colors.primary : theme.colors.border
                        }}
                      />
                    </label>
                  </div>
                  
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {getEffectDescription(key as keyof typeof effectsEnabled)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'mood':
        return (
          <MoodTracking
            theme={{ ...theme, allThemes: settingThemes }}
            currentTheme={currentTheme as string}
            handleThemeChange={handleThemeChange as (theme: string) => void}
            onSaveTheme={handleSaveTheme}
            isSaveEnabled={isSaveEnabled}
            isSaving={isSaving}
          />
        );
      
      case 'account':
        return <ProfileInformation theme={theme} />;
      
      default:
        return <div>Menu</div>;
    }
  };

  // Get description for each effect type
  const getEffectDescription = (effectType: keyof typeof effectsEnabled): string => {
    const descriptions: Record<keyof typeof effectsEnabled, string> = {
      particles: "Các hạt nổi trong nền để tạo hiệu ứng xung quanh tinh tế",
      hearts: "Trái tim nổi hoạt hình để tạo vẻ lãng mạn",
      transitions: "Chuyển tiếp mượt mà giữa các trang và thành phần",
      glow: "Hiệu ứng phát sáng tinh tế xung quanh các phần tử quan trọng",
      fadeIn: "Các phần tử biến mất một cách duyên dáng khi chúng xuất hiện",
      slideIn: "Các phần tử trượt vào từ cạnh khi chúng xuất hiện"
    };
    
    return descriptions[effectType];
  };

  return (
    <div 
      className="min-h-screen transition-theme relative overflow-hidden"
      style={{ 
        background: theme.colors.background,
        fontFamily: theme.fontFamily
      }}
    >
      {/* Visual Effects */}
      <VisualEffects 
        effectsEnabled={effectsEnabled}
        animationSpeed={animationSpeed}
        theme={theme}
      />

      {/* Sync Status Indicator */}
      <SyncStatus 
        status={syncStatus}
        lastSyncTime={lastSyncTime}
        errorMessage={errorMessage || undefined}
      />

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="btn-icon"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
            color: theme.colors.primary
          }}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex min-h-screen relative z-20">
        {/* Sidebar */}
        <div className={`
          sidebar transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.border
        }}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: theme.colors.gradient }}>
                  <Heart className="w-5 h-5" style={{ color: theme.colors.textPrimary }} />
                </div>
                <div>
                  <h1 className="font-bold text-lg" style={{ color: theme.colors.textPrimary }}>
                    Love Journal
                  </h1>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    Cài Đặt
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeMenuItem === item.id ? 'active-menu-item' : ''
                  }`}
                  style={{
                    backgroundColor: activeMenuItem === item.id ? theme.colors.hoverBg : 'transparent',
                    color: activeMenuItem === item.id ? theme.colors.primary : theme.colors.textSecondary,
                  }}
                  onClick={() => setActiveMenuItem(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t" style={{ borderColor: theme.colors.border }}>
              <div className="flex flex-col items-center space-y-2">
                {onBack && (
                  <button 
                    onClick={onBack}
                    className="text-sm px-4 py-2 rounded-full transition-colors duration-300 mb-2"
                    style={{ 
                      background: theme.colors.buttonGradient,
                      color: 'white'
                    }}
                  >
                    Quay Lại Trang Chủ
                  </button>
                )}
                <div className="text-center text-xs" style={{ color: theme.colors.textSecondary }}>
                  Được tạo với tình yêu cho bạn
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="main-content">
          <div className="content-wrapper">
            <div className={`transition-smooth ${effectsEnabled.fadeIn ? 'animate-fade-in' : ''}`}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingPage;
