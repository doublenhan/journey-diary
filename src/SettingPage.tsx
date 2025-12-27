import { useState, useEffect } from 'react';
import { Sparkles, Palette, User, Menu, X, Heart, Globe, Check, Info, Shield } from 'lucide-react';
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
import { useAdmin } from './contexts/AdminContext';

type MenuItemType = 'effects' | 'mood' | 'language' | 'account' | 'admin';

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
  const { isAdmin } = useAdmin();
  
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('mood');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(0);

  // --- Mood Theme Persistence State ---
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTheme, setSavedTheme] = useState<MoodTheme | null>(null);
  const isSaveEnabled = savedTheme !== currentTheme;
  const [effectsEnabled, setEffectsEnabled] = useState({
    fireworks: true,
    colorMorph: false,
    rippleWave: true,
    floatingBubbles: false,
    magneticCursor: true,
    gradientMesh: false
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
    if (theme.fontWeight) {
      document.body.style.fontWeight = theme.fontWeight;
    }
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

  const baseMenuItems: MenuItem[] = [
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

  // Add admin menu item only for admins
  const menuItems: MenuItem[] = isAdmin ? [
    ...baseMenuItems,
    {
      id: 'admin',
      label: t('settings.menuItems.admin'),
      icon: <Shield className="w-5 h-5" />
    }
  ] : baseMenuItems;

  // Handle menu mounted animation
  useEffect(() => {
    if (isMobileMenuOpen) {
      setTimeout(() => setMenuMounted(true), 10);
    } else {
      setMenuMounted(false);
    }
  }, [isMobileMenuOpen]);

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
            fireworks: fetchedEffects.fireworks,
            colorMorph: fetchedEffects.colorMorph,
            rippleWave: fetchedEffects.rippleWave,
            floatingBubbles: fetchedEffects.floatingBubbles,
            magneticCursor: fetchedEffects.magneticCursor,
            gradientMesh: fetchedEffects.gradientMesh
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
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                {t('settings.effects.title')}
              </h2>
              <p className="text-base" style={{ color: theme.colors.textSecondary }}>
                {t('settings.effects.subtitle')}
              </p>
            </div>

            {/* Animation Speed Control - Enhanced */}
            <div 
              className="relative p-8 rounded-3xl border-2 overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.cardBg} 0%, ${theme.colors.hoverBg} 100%)`,
                borderColor: theme.colors.border,
                boxShadow: '0 4px 24px rgba(236, 72, 153, 0.08)'
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-transparent rounded-full blur-3xl" />
              
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100">
                      <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: theme.colors.textPrimary }}>
                        {t('settings.effects.animationSpeed')}
                      </h3>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {t('settings.effects.animationSpeedDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-600">
                      {animationSpeed}
                    </div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Speed</div>
                  </div>
                </div>
                
                {/* Custom Range Slider */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={animationSpeed}
                      onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          ${theme.colors.primary} 0%, 
                          ${theme.colors.primary} ${animationSpeed}%, 
                          rgba(236, 72, 153, 0.1) ${animationSpeed}%, 
                          rgba(236, 72, 153, 0.1) 100%)`,
                        accentColor: theme.colors.primary
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-gray-400">
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Effects Grid - Card Style */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
                <h3 className="font-bold text-lg" style={{ color: theme.colors.textPrimary }}>
                  Visual Effects
                </h3>
              </div>
              
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(effectsEnabled).map(([key, enabled]) => {
                  // Icon mapping for each effect
                  const effectIcons: Record<string, JSX.Element> = {
                    fireworks: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    ),
                    colorMorph: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    ),
                    rippleWave: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ),
                    floatingBubbles: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                    ),
                    magneticCursor: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    ),
                    gradientMesh: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    )
                  };

                  return (
                    <div 
                      key={key}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden ${
                        enabled ? 'shadow-xl shadow-pink-500/20' : 'hover:shadow-lg hover:shadow-pink-500/10'
                      }`}
                      style={{ 
                        background: enabled 
                          ? `linear-gradient(135deg, ${theme.colors.cardBg} 0%, ${theme.colors.hoverBg} 100%)` 
                          : theme.colors.cardBg,
                        borderColor: enabled ? theme.colors.primary : theme.colors.border
                      }}
                      onClick={() => handleEffectToggle(key as keyof typeof effectsEnabled)}
                    >
                      {/* Animated background for enabled */}
                      {enabled && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-rose-500/5 to-pink-500/5 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
                        </>
                      )}
                      
                      <div className="relative">
                        {/* Icon and Toggle */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl transition-all duration-500 ${
                            enabled 
                              ? 'bg-gradient-to-br from-pink-100 to-rose-100 shadow-lg' 
                              : 'bg-gray-100 group-hover:bg-pink-50'
                          }`}>
                            <div className={`transition-colors duration-300 ${
                              enabled ? 'text-pink-600' : 'text-gray-500 group-hover:text-pink-500'
                            }`}>
                              {effectIcons[key] || effectIcons.particles}
                            </div>
                          </div>
                          
                          {/* Toggle Switch */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => handleEffectToggle(key as keyof typeof effectsEnabled)}
                              className="sr-only peer"
                            />
                            <div 
                              className={`w-12 h-7 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md ${
                                enabled ? 'after:shadow-pink-500/50' : ''
                              }`}
                              style={{ 
                                backgroundColor: enabled ? theme.colors.primary : '#d1d5db',
                                boxShadow: enabled ? '0 0 20px rgba(236, 72, 153, 0.3)' : 'none'
                              }}
                            />
                          </label>
                        </div>
                        
                        {/* Effect Name */}
                        <h3 className={`font-bold text-base mb-2 transition-colors duration-300 ${
                          enabled ? '' : 'group-hover:text-pink-600'
                        }`} style={{ 
                          color: enabled ? theme.colors.primary : theme.colors.textPrimary 
                        }}>
                          {key === 'fireworks' ? 'Fireworks' :
                           key === 'colorMorph' ? 'Color Morph' :
                           key === 'rippleWave' ? 'Ripple Wave' :
                           key === 'floatingBubbles' ? 'Floating Bubbles' :
                           key === 'magneticCursor' ? 'Magnetic Cursor' :
                           key === 'gradientMesh' ? 'Gradient Mesh' :
                           key.charAt(0).toUpperCase() + key.slice(1)}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                          {getEffectDescription(key as keyof typeof effectsEnabled)}
                        </p>
                        
                        {/* Status Badge */}
                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200">
                          <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${enabled ? 'text-green-700' : 'text-gray-500'}`}>
                            {enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button - Enhanced */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveEffects}
                disabled={!isEffectsSaveEnabled || isSaving}
                className={`relative px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 overflow-hidden group ${
                  isEffectsSaveEnabled 
                    ? 'hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  background: isEffectsSaveEnabled 
                    ? `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)` 
                    : theme.colors.border,
                  color: isEffectsSaveEnabled ? 'white' : theme.colors.textSecondary,
                  boxShadow: isEffectsSaveEnabled ? '0 8px 24px rgba(236, 72, 153, 0.3)' : 'none'
                }}
              >
                {isEffectsSaveEnabled && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('settings.effects.saveEffects')}
                    </>
                  )}
                </span>
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
            {/* Header with Stats */}
            <div className="relative">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                    {t('settings.language.title')}
                  </h2>
                  <p className="text-base" style={{ color: theme.colors.textSecondary }}>
                    {t('settings.language.subtitle')}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/50">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-700">{Object.values(LANGUAGES).length} Languages</span>
                </div>
              </div>
            </div>

            {/* Language Cards Grid */}
            <div className="grid md:grid-cols-2 gap-5">
              {Object.values(LANGUAGES).map((lang) => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    className={`group relative p-6 rounded-3xl border-2 transition-all duration-500 cursor-pointer overflow-hidden text-left ${
                      isSelected 
                        ? 'shadow-2xl shadow-blue-500/25 scale-[1.02]' 
                        : 'hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.01]'
                    }`}
                    style={{
                      background: isSelected 
                        ? `linear-gradient(135deg, ${theme.colors.cardBg} 0%, ${theme.colors.hoverBg} 100%)` 
                        : theme.colors.cardBg,
                      borderColor: isSelected 
                        ? '#3b82f6'
                        : theme.colors.border,
                    }}
                    onClick={() => setLanguage(lang.code)}
                  >
                    {/* Animated Background Pattern */}
                    <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'group-hover:opacity-50'}`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-3xl" />
                    </div>
                    
                    {/* Selected Indicator */}
                    {isSelected && (
                      <>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        <div className="absolute top-4 right-4 p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50 animate-bounce-in">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      </>
                    )}
                    
                    {/* Content */}
                    <div className="relative flex flex-col items-center text-center space-y-4">
                      {/* Flag Container */}
                      <div className={`relative transition-all duration-500 ${
                        isSelected ? 'scale-110' : 'group-hover:scale-105'
                      }`}>
                        {/* Glow Ring */}
                        <div className={`absolute -inset-3 rounded-full transition-all duration-500 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-blue-400/30 via-indigo-400/30 to-purple-400/30 blur-xl animate-pulse' 
                            : 'bg-gradient-to-r from-blue-400/0 via-indigo-400/0 to-purple-400/0 group-hover:from-blue-400/20 group-hover:via-indigo-400/20 group-hover:to-purple-400/20'
                        }`} style={{ animationDuration: '3s' }} />
                        
                        {/* Flag Circle */}
                        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                          isSelected 
                            ? 'bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 shadow-xl' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-blue-50 group-hover:via-indigo-50 group-hover:to-purple-50 group-hover:shadow-lg'
                        }`}>
                          <span className="text-2xl font-black tracking-tight leading-none" style={{
                            color: isSelected ? '#3b82f6' : '#6b7280'
                          }}>{lang.code.toUpperCase()}</span>
                        </div>
                      </div>
                      
                      {/* Language Info */}
                      <div className="space-y-1.5">
                        <h3 className={`font-bold text-xl transition-colors duration-300 ${
                          isSelected ? 'text-blue-700' : 'group-hover:text-blue-600'
                        }`} style={{ 
                          color: isSelected ? undefined : theme.colors.textPrimary 
                        }}>
                          {lang.nativeName}
                        </h3>
                        <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                          {lang.name}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Arrow */}
                    {!isSelected && (
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                        <div className="p-2 rounded-full bg-blue-500/10">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Auto Save Notice */}
              <div 
                className="relative p-5 rounded-2xl border-2 overflow-hidden backdrop-blur-sm"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.cardBg} 0%, ${theme.colors.hoverBg} 100%)`,
                  borderColor: theme.colors.border + '60'
                }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200/50">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h4 className="font-bold text-sm mb-1" style={{ color: theme.colors.textPrimary }}>
                      Auto-Save Enabled
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                      {t('settings.language.autoSave')}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div 
                className="relative p-5 rounded-2xl border-2 overflow-hidden backdrop-blur-sm"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.cardBg} 0%, ${theme.colors.hoverBg} 100%)`,
                  borderColor: theme.colors.border + '60'
                }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h4 className="font-bold text-sm mb-1" style={{ color: theme.colors.textPrimary }}>
                      Instant Translation
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                      All interface elements update immediately
                    </p>
                  </div>
                </div>
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
            case 'admin':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                {t('settings.admin.title')}
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                {t('settings.admin.subtitle')}
              </p>
            </div>

            <div 
              className="p-6 rounded-2xl border text-center"
              style={{ 
                background: theme.colors.cardBg,
                borderColor: theme.colors.border
              }}
            >
              <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.primary }} />
              <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
                {t('settings.admin.navigateTitle')}
              </h3>
              <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
                {t('settings.admin.navigateDescription')}
              </p>
              <a
                href="/admin"
                className="inline-block px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: theme.colors.primary,
                  color: 'white'
                }}
              >
                {t('settings.admin.openDashboard')}
              </a>
            </div>
          </div>
        );
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
        fontFamily: theme.fontFamily,
        fontWeight: theme.fontWeight
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
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl transform hover:scale-105 bg-white"
          style={{
            borderColor: theme.colors.border,
            color: theme.colors.primary
          }}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Beautiful Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Animated Backdrop */}
          <div 
            className={`fixed inset-0 bg-gradient-to-br from-black/70 via-rose-900/40 to-black/70 backdrop-blur-md z-[60] transition-all duration-700 lg:hidden ${menuMounted ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          </div>
          
          {/* Menu Panel */}
          <div className={`fixed top-0 right-0 w-[360px] max-w-[90vw] h-full bg-gradient-to-b from-white via-white to-pink-50/30 shadow-[-15px_0_60px_rgba(236,72,153,0.2)] z-[70] overflow-y-auto transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:hidden ${menuMounted ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Animated Decorative Background Pattern */}
            <div className="absolute top-0 right-0 w-full h-56 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-3xl animate-float" />
              <div className="absolute top-24 -left-12 w-36 h-36 bg-white/10 rounded-full blur-2xl animate-float-delayed" />
              <div className="absolute top-8 right-20 w-20 h-20 bg-white/20 rounded-full blur-xl animate-pulse" />
              
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-shimmer" />
              
              <div className="absolute top-10 right-16 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute top-28 right-32 w-1.5 h-1.5 bg-white/70 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
              <div className="absolute top-20 left-20 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              
              {/* Wave decoration */}
              <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-8">
                  <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-white/10"></path>
                  <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-white/10"></path>
                  <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-white/20"></path>
                </svg>
              </div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 pb-6">
              <div className={`flex items-start justify-between mb-6 transition-all duration-700 ${menuMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
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
                    <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg">Love Journal</h2>
                    <p className="text-pink-100 text-xs font-medium mt-0.5 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-pink-200 rounded-full animate-pulse" />
                      {t('settings.subtitle')}
                    </p>
                  </div>
                </div>
                <button 
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 active:scale-90 backdrop-blur-sm hover:rotate-90 group" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  aria-label="Close menu"
                >
                  <X size={22} className="text-white group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="relative z-10 px-6 py-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-gray-200/60 p-3 space-y-2 border border-gray-100/50">
                {menuItems.map((item, index) => {
                  const isActive = activeMenuItem === item.id;
                  return (
                    <button
                      key={item.id}
                      style={{ animationDelay: `${index * 100}ms` }}
                      className={`group w-full relative flex items-center gap-4 px-4 py-4 rounded-2xl font-semibold transition-all duration-500 overflow-hidden ${
                        menuMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-xl shadow-pink-500/50 scale-[1.03]' 
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:via-rose-50 hover:to-pink-50 active:scale-[0.97] hover:shadow-lg hover:shadow-pink-200/50'
                      }`}
                      onClick={() => {
                        setActiveMenuItem(item.id);
                        setTimeout(() => setIsMobileMenuOpen(false), 400);
                      }}
                    >
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-500 rounded-2xl" />
                      
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 opacity-75 blur-sm animate-pulse" style={{ animationDuration: '3s' }} />
                      )}
                      
                      <div className="relative flex items-center gap-4 w-full">
                        <div className={`relative p-3 rounded-2xl transition-all duration-500 ${
                          isActive
                            ? 'bg-white/25 shadow-inner scale-110 rotate-12' 
                            : 'bg-gradient-to-br from-pink-100 via-rose-100 to-pink-100 group-hover:scale-125 group-hover:rotate-12 shadow-lg shadow-pink-200/50'
                        }`}>
                          {isActive && (
                            <div className="absolute inset-0 bg-white/30 rounded-2xl blur-md" />
                          )}
                          <div className={`relative transition-all duration-500 ${
                            isActive ? 'text-white' : 'text-pink-600 group-hover:text-pink-700'
                          }`}>
                            {item.icon}
                          </div>
                        </div>
                        <span className="flex-1 tracking-wide relative z-10 text-left">{item.label}</span>
                        
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
                      
                      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                    </button>
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
              {onBack && (
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setTimeout(() => onBack(), 300);
                  }}
                  className="w-full mb-4 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  {t('nav.backToHome')}
                </button>
              )}
              <div className="relative bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 rounded-3xl p-5 border border-pink-200/50 shadow-xl shadow-pink-200/40 overflow-hidden group hover:shadow-2xl hover:shadow-pink-300/50 transition-all duration-500">
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
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{t('settings.footer')}</p>
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

      <div className="flex min-h-screen relative z-20">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block w-80 border-r relative overflow-hidden"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.border,
          boxShadow: '2px 0 24px rgba(236, 72, 153, 0.08), 0 0 60px rgba(251, 207, 232, 0.15)'
        }}>
          {/* Animated gradient border */}
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 via-rose-500/5 to-pink-500/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-pink-500/30 to-transparent" />
          
          {/* Decorative floating orbs */}
          <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-pink-300/20 to-rose-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-40 left-10 w-40 h-40 bg-gradient-to-tr from-rose-300/15 to-pink-400/15 rounded-full blur-3xl animate-float-delayed" />
          
          <div className="flex flex-col h-full sticky top-0 relative z-10">
            {/* Header */}
            <div className="p-6 pb-6 border-b relative overflow-hidden backdrop-blur-sm" style={{ borderColor: theme.colors.border }}>
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent blur-2xl animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
              <div className="relative flex items-center space-x-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" style={{ animationDuration: '3s' }} />
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-pink-500/40 group-hover:scale-110 transition-transform duration-500" style={{ background: theme.colors.gradient }}>
                    <Heart className="w-7 h-7 animate-pulse" style={{ color: theme.colors.textPrimary, animationDuration: '2s' }} fill="currentColor" />
                  </div>
                  {/* Animated ring */}
                  <div className="absolute -inset-1 rounded-2xl border-2 border-pink-500/30 group-hover:border-pink-500/50 transition-all duration-500 animate-[spin_8s_linear_infinite]" />
                </div>
                <div className="flex-1">
                  <h1 className="font-bold text-2xl mb-1 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600" style={{ backgroundSize: '200% auto', animation: 'gradient-shift 3s ease infinite' }}>
                    Love Journal
                  </h1>
                  <p className="text-xs flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
                    <span className="flex items-center justify-center">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping" />
                    </span>
                    <span className="font-medium">{t('settings.subtitle')}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Theme Preview */}
            <div className="px-5 pt-4 pb-4">
              <div className="relative rounded-2xl p-4 overflow-hidden border-2 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-500" style={{ 
                borderColor: theme.colors.border,
                background: `linear-gradient(135deg, ${theme.colors.cardBg} 0%, ${theme.colors.hoverBg} 100%)`,
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.08)'
              }}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/15 to-rose-500/15 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-rose-500/10 to-pink-500/10 rounded-full blur-xl" />
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
                      <Sparkles className="w-3 h-3 text-pink-500" />
                      <span>Current Theme</span>
                    </p>
                    <p className="text-lg font-bold capitalize bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-600">{currentTheme}</p>
                  </div>
                  <div className="relative group/icon">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl blur opacity-40 group-hover/icon:opacity-60 transition-opacity" />
                    <div className="relative w-12 h-12 rounded-xl shadow-lg group-hover/icon:scale-110 group-hover/icon:rotate-12 transition-all duration-500" style={{ background: theme.colors.gradient }}>
                      <div className="w-full h-full rounded-xl flex items-center justify-center">
                        <Palette className="w-6 h-6" style={{ color: theme.colors.textPrimary }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-5 pt-3 pb-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = activeMenuItem === item.id;
                return (
                  <button
                    key={item.id}
                    className={`group w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-500 relative overflow-hidden ${
                      isActive ? 'shadow-xl shadow-pink-500/10' : 'hover:shadow-lg hover:shadow-pink-500/5'
                    }`}
                    style={{
                      backgroundColor: isActive ? theme.colors.hoverBg : 'transparent',
                      color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                      transform: isActive ? 'translateX(4px) scale(1.02)' : 'scale(1)',
                      border: isActive ? '2px solid rgba(236, 72, 153, 0.15)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveMenuItem(item.id)}
                  >
                    {/* Animated gradient background for active */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/8 via-rose-500/8 to-pink-500/8 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-500 via-rose-500 to-pink-500 rounded-r-full shadow-lg shadow-pink-500/50" />
                      </>
                    )}
                    
                    {/* Icon container with glow effect */}
                    <div className={`relative p-2.5 rounded-xl transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-br from-pink-100 to-rose-100 scale-110 shadow-lg shadow-pink-500/20' 
                        : 'bg-gray-100/50 group-hover:bg-gradient-to-br group-hover:from-pink-50 group-hover:to-rose-50 group-hover:scale-110 group-hover:shadow-md'
                    }`}>
                      {isActive && <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 to-rose-400/30 rounded-xl blur" />}
                      <div className={`relative transition-all duration-500 ${
                        isActive ? 'text-pink-600' : 'text-gray-500 group-hover:text-pink-500'
                      }`}>
                        {item.icon}
                      </div>
                    </div>
                    
                    <span className="flex-1 font-semibold text-left relative z-10 text-base">{item.label}</span>
                    
                    {/* Active indicator with animation */}
                    {isActive && (
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                          <div className="absolute inset-0 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.15s' }} />
                        <div className="w-1 h-1 rounded-full bg-pink-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
                      </div>
                    )}
                    
                    {/* Hover chevron */}
                    {!isActive && (
                      <div className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Decorative Divider */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
                <div className="flex gap-1.5 relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 animate-pulse shadow-lg shadow-pink-400/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-rose-500 animate-pulse shadow-lg shadow-rose-400/50" style={{ animationDelay: '0.3s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 animate-pulse shadow-lg shadow-pink-400/50" style={{ animationDelay: '0.6s' }} />
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t relative backdrop-blur-sm" style={{ borderColor: theme.colors.border }}>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-pink-500/8 via-rose-500/3 to-transparent pointer-events-none" />
              <div className="relative flex flex-col space-y-3">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {/* Theme Card */}
                  <div className="relative group p-4 rounded-2xl bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 border-2 border-pink-200/60 hover:border-pink-300 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-pink-500/20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-300/30 to-transparent rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="w-3.5 h-3.5 text-pink-600" />
                        <div className="text-[10px] font-black text-pink-600 uppercase tracking-widest">Theme</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl leading-none">{currentTheme === 'happy' ? '😊' : currentTheme === 'calm' ? '😌' : currentTheme === 'energetic' ? '⚡' : currentTheme === 'peaceful' ? '🕊️' : currentTheme === 'passionate' ? '❤️' : '🎨'}</div>
                        <div className="text-xs font-bold capitalize text-pink-700/80">{currentTheme}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Language Card */}
                  <div className="relative group p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-2 border-blue-200/60 hover:border-blue-300 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-300/30 to-transparent rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Lang</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl leading-none">{currentLanguage === 'vi' ? '🇻🇳' : '🇬🇧'}</div>
                        <div className="text-xs font-bold capitalize text-blue-700/80">{currentLanguage === 'vi' ? 'Tiếng Việt' : 'English'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {onBack && (
                  <button 
                    onClick={onBack}
                    className="w-full text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 group relative overflow-hidden"
                    style={{ 
                      background: theme.colors.buttonGradient,
                      color: 'white'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative z-10">{t('nav.backToHome')}</span>
                  </button>
                )}
                <div className="text-center text-[10px] px-3 py-2 rounded-lg bg-gradient-to-r from-pink-50/50 to-rose-50/50 border border-pink-100/30" style={{ color: theme.colors.textSecondary }}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="w-3 h-3 text-pink-500 animate-pulse" fill="currentColor" style={{ animationDuration: '2s' }} />
                    <span className="font-semibold">Love Journal</span>
                  </div>
                  {t('settings.footer')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-6 lg:p-8 pt-20 lg:pt-8">
            <div className="transition-smooth">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingPage;
