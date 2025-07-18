import React, { useState } from 'react';
import { Sun, Moon, Heart, Sparkles, Palette, CalendarDays, User, Menu, X, Clock, Calendar } from 'lucide-react';
import EventsPageComponent from './components/EventsPage';
import EventModal from './components/EventModal';
import VisualEffects from './components/VisualEffects';
import './styles/SettingPage.css';

type MenuItemType = 'effects' | 'mood' | 'account' | 'events';
type MoodTheme = 'happy' | 'calm' | 'romantic';
type GalleryMode = 'memories' | 'journey';

interface SettingPageProps {
  onBack?: () => void;
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
  icon: React.ReactNode;
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

function SettingPage({ onBack }: SettingPageProps) {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('mood');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<MoodTheme>('romantic');
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
      icon: <Heart className="w-5 h-5" />,
      color: '#ec4899'
    },
    {
      id: '2',
      title: 'Our Wedding Day',
      date: '2024-08-20',
      type: 'wedding',
      description: 'The most magical day of our lives, surrounded by family and friends',
      location: 'Malibu Beach, CA',
      icon: <Heart className="w-5 h-5" />,
      color: '#f59e0b'
    }
  ]);
  const [effectsEnabled, setEffectsEnabled] = useState({
    particles: true,
    hearts: false,
    transitions: true,
    glow: false,
    fadeIn: true,
    slideIn: false
  });

  const theme = themes[currentTheme];

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

  const handleThemeChange = (newTheme: MoodTheme) => {
    setCurrentTheme(newTheme);
  };

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
    const memoriesByYear = groupMemoriesByYear(sampleMemories);
    
    return (
      <div className="space-y-8">
        {Object.entries(memoriesByYear)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, memories]) => (
            <div key={year}>
              <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ color: theme.colors.textPrimary }}>
                <Calendar className="w-6 h-6 mr-2" style={{ color: theme.colors.primary }} />
                {year}
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {memories.map((memory) => (
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
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  };

  const renderJourneyLayout = () => {
    const sortedMemories = [...sampleMemories].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return (
      <div className="relative">
        {/* Timeline Line */}
        <div 
          className="timeline-line"
          style={{ backgroundColor: theme.colors.border }}
        />
        
        <div className="space-y-12">
          {sortedMemories.map((memory, index) => (
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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                Mood Tracking & Gallery Display
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Choose your mood theme and customize how your love memories are displayed.
              </p>
            </div>
            
            {/* Theme Selection */}
            <div 
              className="p-6 rounded-2xl border"
              style={{ 
                background: theme.colors.cardBg,
                borderColor: theme.colors.border
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
                Mood Themes
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(themes).map(([moodKey, moodTheme]) => (
                  <div
                    key={moodKey}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                      currentTheme === moodKey ? 'ring-2' : ''
                    }`}
                    style={{
                      background: moodTheme.colors.gradient,
                      borderColor: moodTheme.colors.border,
                      '--tw-ring-color': moodTheme.colors.primary
                    } as React.CSSProperties}
                    onClick={() => handleThemeChange(moodKey as MoodTheme)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="mr-2">{moodTheme.emoji}</span>
                        <span style={{ color: moodTheme.colors.textPrimary }}>{moodTheme.name}</span>
                      </div>
                      {moodTheme.icon}
                    </div>
                    
                    <div className="flex space-x-2 mt-2">
                      {['primary', 'secondary', 'accent'].map(colorKey => (
                        <div
                          key={colorKey}
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: moodTheme.colors[colorKey as keyof typeof moodTheme.colors] }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery Display Mode Toggle */}
            <div 
              className="p-6 rounded-2xl border"
              style={{ 
                background: theme.colors.cardBg,
                borderColor: theme.colors.border
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
                Gallery Display Mode
              </h3>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                    {galleryMode === 'memories' ? 'Photo Grid' : 'Journey Timeline'}
                  </span>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {galleryMode === 'memories' 
                      ? 'View memories organized by year' 
                      : 'View your relationship as a timeline journey'}
                  </p>
                </div>
                <button
                  onClick={() => setGalleryMode(galleryMode === 'memories' ? 'journey' : 'memories')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ 
                    backgroundColor: galleryMode === 'journey' ? theme.colors.primary : theme.colors.border,
                    '--tw-ring-color': theme.colors.primary + '33'
                  } as React.CSSProperties}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                      galleryMode === 'journey' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Gallery Preview */}
              <div className="border rounded-xl p-4" style={{ borderColor: theme.colors.border }}>
                <h4 className="font-medium mb-4" style={{ color: theme.colors.textPrimary }}>
                  Preview:                 </h4>
                <div className="max-h-96 overflow-y-auto">
                  {galleryMode === 'memories' ? renderMemoriesLayout() : renderJourneyLayout()}
                </div>
              </div>
            </div>
          </div>
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
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                Account Settings
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Manage your profile and preferences.
              </p>
            </div>
            
            <div 
              className="p-6 rounded-2xl border"
              style={{ 
                background: theme.colors.cardBg,
                borderColor: theme.colors.border
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
                Profile Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl"
                    style={{ backgroundColor: theme.colors.gradient }}
                  >
                    S&M
                  </div>
                  <div>
                    <h4 className="font-medium" style={{ color: theme.colors.textPrimary }}>
                      Sarah & Michael
                    </h4>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Together since April 15, 2023
                    </p>
                  </div>
                </div>
                <div>
                  <input 
                    type="text" 
                    defaultValue="Sarah & Michael" 
                    className="form-input"
                    style={{ 
                      borderColor: theme.colors.border,
                      '--tw-ring-color': theme.colors.primary + '33'
                    } as React.CSSProperties}
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    defaultValue="sarah.michael@lovejournal.com" 
                    className="form-input"
                    style={{ 
                      borderColor: theme.colors.border,
                      '--tw-ring-color': theme.colors.primary + '33'
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
            
            <div 
              className="p-6 rounded-2xl border"
              style={{ 
                background: theme.colors.cardBg,
                borderColor: theme.colors.border
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
                Preferences
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Memory Reminders', desc: 'Get notified about anniversaries and special dates', checked: true },
                  { label: 'Photo Backup', desc: 'Automatically backup your love memories to cloud', checked: true },
                  { label: 'Mood Insights', desc: 'Receive weekly insights about your relationship mood', checked: false },
                  { label: 'Share Memories', desc: 'Allow sharing memories with friends and family', checked: false }
                ].map((pref, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-medium" style={{ color: theme.colors.textPrimary }}>
                        {pref.label}
                      </h4>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {pref.desc}
                      </p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      style={{ 
                        backgroundColor: pref.checked ? theme.colors.primary : theme.colors.border,
                        '--tw-ring-color': theme.colors.primary + '33'
                      } as React.CSSProperties}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                          pref.checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
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
