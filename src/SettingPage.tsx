import { useState, useEffect } from 'react';
import { Sun, Moon, Heart, Sparkles, Palette, CalendarDays, User, Menu, X, Clock, Calendar } from 'lucide-react';
import { auth } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserTheme, getUserTheme } from './apis/userThemeApi';

import EventsPageComponent from './components/EventsPage';
import EventModal from './components/EventModal';
import VisualEffects from './components/VisualEffects';
import ProfileInformation from './ProfileInformation';
import MoodTracking from './MoodTracking';
import './styles/SettingPage.css';
import { useMemoriesCache } from './hooks/useMemoriesCache';
import { useCurrentUserId } from './hooks/useCurrentUserId';

type MenuItemType = 'effects' | 'mood' | 'account' | 'events';
type MoodTheme = 'happy' | 'calm' | 'romantic';
type GalleryMode = 'memories' | 'journey';

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

interface ThemeConfig {
  name: string;
  icon: React.ReactNode;
  emoji: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    gradient: string;
    buttonGradient: string;
    hoverBg: string;
  };
  fontFamily: string;
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

const themes: Record<MoodTheme, ThemeConfig> = {
  happy: {
    name: 'Happy',
    icon: <Sun className="w-5 h-5" />,
    emoji: '😊',
    colors: {
      primary: 'rgb(251, 191, 36)',
      secondary: 'rgb(252, 211, 77)',
      accent: 'rgb(245, 158, 11)',
      background: 'linear-gradient(135deg, rgb(254, 249, 195) 0%, rgb(255, 255, 255) 50%, rgb(254, 240, 138) 100%)',
      cardBg: 'rgb(255, 255, 255)',
      textPrimary: 'rgb(120, 53, 15)',
      textSecondary: 'rgb(146, 64, 14)',
      border: 'rgb(254, 240, 138)',
      gradient: 'linear-gradient(135deg, rgb(254, 249, 195), rgb(254, 240, 138))',
      buttonGradient: 'linear-gradient(135deg, rgb(251, 191, 36), rgb(245, 158, 11))',
      hoverBg: 'rgb(254, 249, 195)',
    },
    fontFamily: 'ui-rounded, system-ui, sans-serif'
  },
  calm: {
    name: 'Calm',
    icon: <Moon className="w-5 h-5" />,
    emoji: '🌙',
    colors: {
      primary: 'rgb(99, 102, 241)',
      secondary: 'rgb(129, 140, 248)',
      accent: 'rgb(79, 70, 229)',
      background: 'linear-gradient(135deg, rgb(238, 242, 255) 0%, rgb(255, 255, 255) 50%, rgb(224, 231, 255) 100%)',
      cardBg: 'rgb(255, 255, 255)',
      textPrimary: 'rgb(55, 48, 163)',
      textSecondary: 'rgb(67, 56, 202)',
      border: 'rgb(224, 231, 255)',
      gradient: 'linear-gradient(135deg, rgb(238, 242, 255), rgb(224, 231, 255))',
      buttonGradient: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(79, 70, 229))',
      hoverBg: 'rgb(238, 242, 255)',
    },
    fontFamily: 'ui-serif, Georgia, serif'
  },
  romantic: {
    name: 'Romantic',
    icon: <Heart className="w-5 h-5" />,
    emoji: '💖',
    colors: {
      primary: 'rgb(236, 72, 153)',
      secondary: 'rgb(244, 114, 182)',
      accent: 'rgb(219, 39, 119)',
      background: 'linear-gradient(135deg, rgb(253, 242, 248) 0%, rgb(255, 255, 255) 50%, rgb(252, 231, 243) 100%)',
      cardBg: 'rgb(255, 255, 255)',
      textPrimary: 'rgb(131, 24, 67)',
      textSecondary: 'rgb(157, 23, 77)',
      border: 'rgb(252, 231, 243)',
      gradient: 'linear-gradient(135deg, rgb(253, 242, 248), rgb(252, 231, 243))',
      buttonGradient: 'linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119))',
      hoverBg: 'rgb(253, 242, 248)',
    },
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
  }
};

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
  // Restore icons for events after initialization
  useEffect(() => {
    setEvents(prevEvents => prevEvents.map(event => {
      if (!event.icon && (event.type === 'dating' || event.type === 'wedding')) {
        return { ...event, icon: <Heart className="w-5 h-5" /> };
      }
      return event;
    }));
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('mood');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [galleryMode, setGalleryMode] = useState<GalleryMode>('memories');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Started Dating',
      date: '2023-04-15',
      type: 'dating',
      description: 'The day we became official and started our beautiful journey together',
      location: 'Central Park, New York',
      color: '#ec4899'
    },
    {
      id: '2',
      title: 'Our Wedding Day',
      date: '2024-08-20',
      type: 'wedding',
      description: 'The most magical day of our lives, surrounded by family and friends',
      location: 'Malibu Beach, CA',
      color: '#f59e0b'
    }
  ]);

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

  const theme = themes[currentTheme];

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
      label: 'Effects',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'mood',
      label: 'Mood Tracking',
      icon: <Palette className="w-5 h-5" />
    },
    {
      id: 'events',
      label: 'Special Events',
      icon: <CalendarDays className="w-5 h-5" />
    },
    {
      id: 'account',
      label: 'Account Settings',
      icon: <User className="w-5 h-5" />
    }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const fetchedTheme = await getUserTheme(user.uid);
        if (fetchedTheme && ["happy","calm","romantic"].includes(fetchedTheme)) {
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
    try {
      await saveUserTheme(userId, currentTheme);
      setSavedTheme(currentTheme);
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
        if (fetchedTheme && ["happy","calm","romantic"].includes(fetchedTheme)) {
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

  const handleAddEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const handleUpdateEvent = (id: string, eventData: Omit<Event, 'id'>) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...eventData, id } : event
    ));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const groupMemoriesByYear = (memories: Memory[]) => {
    return memories.reduce((acc, memory) => {
      if (!acc[memory.year]) {
        acc[memory.year] = [];
      }
      acc[memory.year].push(memory);
      return acc;
    }, {} as Record<number, Memory[]>);
  };

  const renderMemoriesLayout = () => {
    // Use cached memories
    return (
      <div className="space-y-8">
        {memoriesLoading && <div>Loading memories...</div>}
        {memoriesError && <div className="text-red-500">{memoriesError}</div>}
        {!memoriesLoading && !memoriesError && years.length > 0 && (
          Object.entries(memoriesByYear)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([year, memories]) => (
              <div key={year}>
                <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ color: theme.colors.textPrimary }}>
                  <Calendar className="w-6 h-6 mr-2" style={{ color: theme.colors.primary }} />
                  {year}
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {(memories as any[]).map((memory: any) => (
                    <div
                      key={memory.id}
                      className="memory-card"
                      style={{
                        backgroundColor: theme.colors.cardBg,
                        borderColor: theme.colors.border
                      }}
                    >
                      {/* Image Gallery */}
                      <div className="relative h-48 bg-gray-100">
                        {Array.isArray(memory.images) && memory.images.length > 0 && (
                          <div className="memory-images grid grid-cols-2 gap-2 mt-2">
                            {memory.images.map((img: any, idx: number) => (
                              <img
                                key={idx}
                                src={img.secure_url || img}
                                alt={`Memory ${idx + 1}`}
                                className="rounded-lg shadow"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="p-4">
                        <div className="memory-title font-bold text-lg mb-2">{memory.title}</div>
                        <div className="memory-date text-xs text-pink-500 mb-2">
                          <Calendar className="w-4 h-4 inline-block mr-1" />
                          {memory.date}
                        </div>
                        <div className="memory-location text-xs text-gray-500 mb-2">{memory.location}</div>
                        <div className="memory-description mb-2">{memory.description || memory.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    );
  };

  const renderJourneyLayout = () => {
    // Use cached memories for journey layout
    const allMemories: any[] = years.flatMap((y: string) => memoriesByYear[y] || []);
    const sortedMemories = allMemories.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return (
      <div className="relative">
        {/* Timeline Line */}
        <div 
          className="timeline-line"
          style={{ backgroundColor: theme.colors.border }}
        />
        
        <div className="space-y-12">
          {sortedMemories.map((memory: any, index: number) => (
            <div key={memory.id} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Content Card */}
              <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                <div
                  className="memory-card"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border
                  }}
                >
                  <div className="memory-title font-bold text-lg mb-2">{memory.title}</div>
                  <div className="memory-date text-xs text-pink-500 mb-2">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    {memory.date}
                  </div>
                  <div className="memory-location text-xs text-gray-500 mb-2">{memory.location}</div>
                  <div className="memory-description mb-2">{memory.description || memory.text}</div>
                  {Array.isArray(memory.images) && memory.images.length > 0 && (
                    <div className="memory-images grid grid-cols-2 gap-2 mt-2">
                      {memory.images.map((img: any, idx: number) => (
                        <img
                          key={idx}
                          src={img.secure_url || img}
                          alt={`Memory ${idx + 1}`}
                          className="rounded-lg shadow"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Timeline Node */}
              <div className="timeline-node" style={{ 
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.primary
              }}>
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              </div>
              
              {/* Date Badge */}
              <div className={`w-5/12 ${index % 2 === 0 ? 'pl-8' : 'pr-8'} flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div 
                  className="px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ background: theme.colors.buttonGradient }}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  {memory.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'effects':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                Visual Effects & Animations
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Customize your visual experience with beautiful effects and transitions.
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
                Animation Speed
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
            theme={{ ...theme, allThemes: themes }}
            currentTheme={currentTheme as string}
            handleThemeChange={handleThemeChange as (theme: string) => void}
            galleryMode={galleryMode as string}
            setGalleryMode={setGalleryMode as (mode: string) => void}
            renderMemoriesLayout={renderMemoriesLayout}
            renderJourneyLayout={renderJourneyLayout}
            onSaveTheme={handleSaveTheme}
            isSaveEnabled={isSaveEnabled}
            isSaving={isSaving}
          />
        );

      case 'events':
        return (
          <EventsPageComponent 
            theme={theme}
            events={events}
            onAddEvent={() => setIsEventModalOpen(true)}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      
      case 'account':
        return <ProfileInformation theme={theme} />;
      
      default:
        return <div>Select a menu item</div>;
    }
  };

  // Get description for each effect type
  const getEffectDescription = (effectType: keyof typeof effectsEnabled): string => {
    const descriptions: Record<keyof typeof effectsEnabled, string> = {
      particles: "Floating particles in the background for a subtle ambient effect",
      hearts: "Animated floating hearts for a romantic touch",
      transitions: "Smooth transitions between pages and components",
      glow: "Subtle glow effects around important elements",
      fadeIn: "Elements gracefully fade in when they appear",
      slideIn: "Elements slide in from the side when they appear"
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
                    Settings
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
                    Back to Home
                  </button>
                )}
                <div className="text-center text-xs" style={{ color: theme.colors.textSecondary }}>
                  Made with <Heart className="w-3 h-3 inline-block mx-1" style={{ color: theme.colors.primary }} /> for you
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

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={handleCloseModal}
        onSave={handleAddEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        theme={theme}
        editingEvent={editingEvent}
      />
    </div>
  );
}

export default SettingPage;
