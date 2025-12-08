import { useState, useEffect } from 'react';
import { Sparkles, Palette, User, Menu, X, Heart, Globe, Check, Info } from 'lucide-react';
import { auth } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserTheme, getUserTheme } from './apis/userThemeApi';
import { saveUserEffects, getUserEffects, EffectsSettings } from './apis/userEffectsApi';
import { MoodTheme } from './config/themes';
import { settingThemes } from './config/settingThemes';
import { LANGUAGES } from './config/languages';
import { useLanguage } from './hooks/useLanguage';

import VisualEffects from './components/VisualEffects';
import ProfileInformation from './ProfileInformation';
import MoodTracking from './MoodTracking';
import { useSyncStatus } from './hooks/useSyncStatus';
import SyncStatus from './components/SyncStatus';
import './styles/SettingPage.css';

type MenuItemType = 'effects' | 'mood' | 'language' | 'account';

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

function SettingPage({ onBack, currentTheme, setCurrentTheme }: SettingPageProps) {
  const { syncStatus, lastSyncTime, errorMessage, startSync, syncSuccess, syncError } = useSyncStatus();
  const { t, currentLanguage, setLanguage } = useLanguage();
  
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
  const [savedEffects, setSavedEffects] = useState<EffectsSettings | null>(null);
  const isEffectsSaveEnabled = savedEffects ? 
    JSON.stringify({ ...effectsEnabled, animationSpeed }) !== JSON.stringify(savedEffects) : false;

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
      label: t('settings.menuItems.effects'),
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'mood',
      label: t('settings.menuItems.mood'),
      icon: <Palette className="w-5 h-5" />
    },
    {
      id: 'language',
      label: t('settings.menuItems.language'),
      icon: <Globe className="w-5 h-5" />
    },
    {
      id: 'account',
      label: t('settings.menuItems.account'),
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
      syncError(t('notification.themeError'));
      console.error('Error saving theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save effects to Firestore
  const handleSaveEffects = async () => {
    if (!userId) return;
    setIsSaving(true);
    startSync();
    try {
      const effectsData: EffectsSettings = {
        ...effectsEnabled,
        animationSpeed
      };
      await saveUserEffects(userId, effectsData);
      setSavedEffects(effectsData);
      syncSuccess();
    } catch (error) {
      syncError(t('notification.effectsError'));
      console.error('Error saving effects:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get userId and load theme + effects from Firestore on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const fetchedTheme = await getUserTheme(user.uid);
        if (fetchedTheme && ["happy","calm","romantic","energetic","peaceful","passionate"].includes(fetchedTheme)) {
          setCurrentTheme(fetchedTheme as MoodTheme);
          setSavedTheme(fetchedTheme as MoodTheme);
        }
        
        // Load effects settings
        const fetchedEffects = await getUserEffects(user.uid);
        if (fetchedEffects) {
          setEffectsEnabled({
            particles: fetchedEffects.particles,
            hearts: fetchedEffects.hearts,
            transitions: fetchedEffects.transitions,
            glow: fetchedEffects.glow,
            fadeIn: fetchedEffects.fadeIn,
            slideIn: fetchedEffects.slideIn
          });
          setAnimationSpeed(fetchedEffects.animationSpeed);
          setSavedEffects(fetchedEffects);
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
                {t('settings.effects.title')}
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                {t('settings.effects.subtitle')}
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
                {t('settings.effects.animationSpeed')}
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

            {/* Save Effects Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveEffects}
                disabled={!isEffectsSaveEnabled || isSaving}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  background: isEffectsSaveEnabled ? theme.colors.primary : theme.colors.border,
                  color: isEffectsSaveEnabled ? 'white' : theme.colors.textSecondary
                }}
              >
                {isSaving ? t('common.loading') : t('settings.effects.saveEffects')}
              </button>
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
      
      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                {t('settings.language.title')}
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                {t('settings.language.subtitle')}
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
                {t('settings.language.selectLanguage')}
              </h3>
              
              <div className="space-y-3">
                {Object.values(LANGUAGES).map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      currentLanguage === lang.code ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: currentLanguage === lang.code 
                        ? theme.colors.hoverBg 
                        : 'transparent',
                      borderColor: currentLanguage === lang.code 
                        ? theme.colors.primary 
                        : theme.colors.border,
                      border: '2px solid',
                    }}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                          {lang.nativeName}
                        </p>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {lang.name}
                        </p>
                      </div>
                    </div>
                    {currentLanguage === lang.code && (
                      <Check className="w-5 h-5" style={{ color: theme.colors.primary }} />
                    )}
                  </button>
                ))}
              </div>

              <div 
                className="mt-4 p-4 rounded-lg flex items-start gap-2"
                style={{ backgroundColor: theme.colors.hoverBg }}
              >
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {t('settings.language.autoSave')}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'account':
        return <ProfileInformation 
          theme={theme} 
          onSyncStart={startSync}
          onSyncSuccess={syncSuccess}
          onSyncError={syncError}
        />;
      
      default:
        return <div>Menu</div>;
    }
  };

  // Get description for each effect type
  const getEffectDescription = (effectType: keyof typeof effectsEnabled): string => {
    const descriptionKey = `settings.effects.effectTypes.${effectType}` as const;
    return t(descriptionKey);
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
                    {t('settings.subtitle')}
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
                    {t('nav.backToHome')}
                  </button>
                )}
                <div className="text-center text-xs" style={{ color: theme.colors.textSecondary }}>
                  {t('settings.footer')}
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
