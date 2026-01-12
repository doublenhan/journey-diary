import { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, Download, X, ChevronLeft, ChevronRight, Settings, Palette, ChevronDown, FileJson, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchMemories } from '../services/firebaseMemoriesService';
import { Memory as FirebaseMemory } from '../services/firebaseMemoriesService';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useToastContext } from '../contexts/ToastContext';
import { useLanguage } from '../hooks/useLanguage';
import { saveCalendarSettings, loadCalendarSettings } from '../apis/calendarApi';

interface MonthData {
  month: number;
  year: number;
  name: string;
  photos: string[];
  memoryIds?: string[];
}

type PhotoLayout = 'minimalist' | 'classic' | 'gallery' | 'collage';

interface ColorTheme {
  id: string;
  name: string;
  gradient: string;
  accent: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'brown',
    name: 'Warm Brown',
    gradient: 'from-[#8B7355] via-[#A0826D] to-[#8B7355]',
    accent: '#D4A574'
  },
  {
    id: 'pink',
    name: 'Romantic Pink',
    gradient: 'from-rose-400 via-pink-400 to-rose-400',
    accent: '#FDA4AF'
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    gradient: 'from-blue-400 via-sky-400 to-blue-400',
    accent: '#93C5FD'
  },
  {
    id: 'green',
    name: 'Fresh Green',
    gradient: 'from-emerald-400 via-teal-400 to-emerald-400',
    accent: '#6EE7B7'
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    gradient: 'from-purple-400 via-violet-400 to-purple-400',
    accent: '#C4B5FD'
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    gradient: 'from-orange-400 via-amber-400 to-orange-400',
    accent: '#FCD34D'
  }
];

export default function Calendar() {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState<MonthData[]>([]);
  const [memories, setMemories] = useState<FirebaseMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [availablePhotos, setAvailablePhotos] = useState<FirebaseMemory[]>([]);
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1-12 = months
  
  // Customization states
  const [showSettings, setShowSettings] = useState(false);
  const [calendarTheme, setCalendarTheme] = useState<ColorTheme>(COLOR_THEMES[0]);
  const [calendarTitle, setCalendarTitle] = useState('FAMILY');
  const [calendarSubtitle, setCalendarSubtitle] = useState('Calendar');
  const [calendarDescription, setCalendarDescription] = useState('');
  const [photoLayout, setPhotoLayout] = useState<PhotoLayout>('minimalist');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Custom color states
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customGradient, setCustomGradient] = useState({
    from: '#8B7355',
    to: '#A0826D'
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      // Check if it's a touch device (mobile/tablet including iPad)
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check user agent for mobile/tablet devices
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
      
      // Consider it mobile if it's either touch device or mobile user agent
      const isMobileDevice = isTouchDevice || isMobileUA;
      
      setIsMobile(isMobileDevice);
      if (isMobileDevice) {
        setShowMobileWarning(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Close export menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-dropdown')) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const loadCalendar = async () => {
    console.log('🔵 loadCalendar called for year:', selectedYear);
    const userId = auth.currentUser?.uid;
    console.log('👤 Current user ID:', userId);
    if (!userId) {
      console.log('⚠️ No user logged in');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load memories
      const fetchedMemories = await fetchMemories({ userId });
      const validMemories = fetchedMemories.filter(m => m.photos && m.photos.length > 0);
      setMemories(validMemories);
      
      // Try to load saved calendar settings
      const savedSettings = await loadCalendarSettings(userId, selectedYear);
      console.log('📅 Loaded calendar settings:', savedSettings);
      
      if (savedSettings) {
        // Restore saved settings
        console.log('🔄 Restoring settings - themeId:', savedSettings.themeId, 'customGradient:', savedSettings.customGradient);
        setCalendarTitle(savedSettings.title);
        setCalendarSubtitle(savedSettings.subtitle);
        setCalendarDescription(savedSettings.description);
        setPhotoLayout(savedSettings.photoLayout);
        setCoverPhoto(savedSettings.coverPhoto || '');
        
        // If months array is empty, initialize with 12 empty months
        if (savedSettings.months && savedSettings.months.length > 0) {
          setCalendarData(savedSettings.months);
        } else {
          console.log('⚠️ Saved months array is empty, initializing...');
          const data: MonthData[] = MONTHS.map((name, index) => ({
            month: index,
            year: selectedYear,
            name,
            photos: []
          }));
          setCalendarData(data);
        }
        
        if (savedSettings.customGradient) {
          setUseCustomColor(true);
          setCustomGradient(savedSettings.customGradient);
        } else {
          setUseCustomColor(false);
          const theme = COLOR_THEMES.find(t => t.id === savedSettings.themeId);
          if (theme) {
            setCalendarTheme(theme);
          } else {
            // Fallback to default theme if not found
            setCalendarTheme(COLOR_THEMES[0]);
          }
        }
      } else {
        // Initialize empty calendar
        const data: MonthData[] = MONTHS.map((name, index) => ({
          month: index,
          year: selectedYear,
          name,
          photos: []
        }));
        setCalendarData(data);
      }
    } catch (err) {
      console.error('Error loading calendar:', err);
      error(t('calendar.loadError'));
      
      // Initialize empty calendar on error
      const data: MonthData[] = MONTHS.map((name, index) => ({
        month: index,
        year: selectedYear,
        name,
        photos: []
      }));
      setCalendarData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect triggered - selectedYear:', selectedYear);
    
    // Wait for Firebase auth to be ready
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Auth state changed - user:', user?.uid);
      if (user) {
        loadCalendar();
      } else {
        console.log('⚠️ No authenticated user');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [selectedYear]);

  const saveCalendar = async (coverPhotoOverride?: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const settingsToSave = {
        year: selectedYear,
        themeId: useCustomColor ? 'custom' : calendarTheme.id,
        photoLayout: photoLayout,
        customGradient: useCustomColor ? customGradient : undefined,
        title: calendarTitle,
        subtitle: calendarSubtitle,
        description: calendarDescription,
        coverPhoto: coverPhotoOverride !== undefined ? coverPhotoOverride : coverPhoto,
        months: calendarData
      };
      console.log('💾 Saving calendar settings:', settingsToSave);
      await saveCalendarSettings(userId, settingsToSave);
      success(t('calendar.saveSuccess'));
    } catch (err) {
      console.error('Error saving calendar:', err);
      error(t('calendar.saveError'));
    }
  };



  const handlePhotoSelect = (photo: string, memoryId: string) => {
    if (selectedMonth === null) return;
    
    // Handle cover page separately
    if (selectedMonth === -1) {
      setCoverPhoto(photo);
      setSelectedMonth(null);
      success(t('calendar.photoAdded').replace('{month}', 'Cover'));
      saveCalendar(photo); // Pass photo directly to save immediately
      return;
    }
    
    const updated = [...calendarData];
    
    const maxPhotos = {
      minimalist: 1,
      classic: 2,
      gallery: 4,
      collage: 3
    }[photoLayout];
    
    // Add photo if not at max capacity
    if (!updated[selectedMonth].photos) {
      updated[selectedMonth].photos = [];
    }
    if (!updated[selectedMonth].memoryIds) {
      updated[selectedMonth].memoryIds = [];
    }
    
    if (updated[selectedMonth].photos.length < maxPhotos) {
      updated[selectedMonth].photos.push(photo);
      updated[selectedMonth].memoryIds?.push(memoryId);
      setCalendarData(updated);
      
      // Close modal only if max photos reached
      if (updated[selectedMonth].photos.length >= maxPhotos) {
        setSelectedMonth(null);
      }
      
      const monthName = MONTHS[selectedMonth];
      success(t('calendar.photoAdded').replace('{month}', monthName));
      saveCalendar(); // Auto-save after adding photo
    }
  };

  const handleRemovePhoto = (monthIndex: number, photoIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...calendarData];
    updated[monthIndex].photos.splice(photoIndex, 1);
    updated[monthIndex].memoryIds?.splice(photoIndex, 1);
    setCalendarData(updated);
    saveCalendar();
  };

  const downloadAsJSON = () => {
    const exportData = {
      year: selectedYear,
      themeId: useCustomColor ? 'custom' : calendarTheme.id,
      customGradient: useCustomColor ? customGradient : undefined,
      title: calendarTitle,
      subtitle: calendarSubtitle,
      description: calendarDescription,
      coverPhoto: coverPhoto,
      months: calendarData
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-${selectedYear}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    success(t('calendar.export.success'));
  };

  const downloadAsPDF = () => {
    // Use browser's print dialog which can save as PDF
    setShowExportMenu(false);
    window.print();
    success(t('calendar.export.pdf'));
  };

  const applyTheme = (theme: ColorTheme) => {
    setUseCustomColor(false);
    setCalendarTheme(theme);
    success(t('calendar.settings.themeChanged').replace('{theme}', t(`calendar.themes.${theme.id}`)));
  };

  const getCurrentGradient = () => {
    if (useCustomColor) {
      return null; // Will use inline style instead
    }
    return calendarTheme.gradient;
  };

  const getGradientStyle = () => {
    if (useCustomColor) {
      return {
        backgroundImage: `linear-gradient(to bottom right, ${customGradient.from}, ${customGradient.to})`
      };
    }
    return {};
  };

  const nextPage = () => {
    if (currentPage < 12) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const renderCoverPage = () => (
    <div 
      className={`relative w-full h-full ${useCustomColor ? '' : `bg-gradient-to-br ${getCurrentGradient()}`} rounded-lg shadow-2xl overflow-hidden`}
      style={getGradientStyle()}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
      
      <div className="relative h-full flex flex-col items-center justify-center p-4 md:p-12 text-white">
        {/* Title */}
        <div className="text-center mb-6 md:mb-12">
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-4 opacity-80">
            {calendarTitle.split('').join(' ')}
          </p>
          <h1 className="text-3xl md:text-7xl font-serif italic mb-1 md:mb-2">{calendarSubtitle}</h1>
          <p className="text-2xl md:text-5xl font-light">{selectedYear}</p>
          {calendarDescription && (
            <p className="text-sm md:text-lg mt-3 md:mt-6 opacity-90 max-w-md mx-auto text-center px-4">{calendarDescription}</p>
          )}
        </div>

        {/* Photo placeholder with polaroid style */}
        <div 
          onClick={() => {
            setSelectedMonth(-1); // Special index for cover
            setAvailablePhotos(memories);
          }}
          className="group relative bg-white p-2 md:p-4 pb-4 md:pb-8 shadow-xl transform rotate-2 hover:rotate-0 transition-all cursor-pointer hover:scale-105"
        >
          {coverPhoto ? (
            <img 
              src={coverPhoto} 
              alt="Cover" 
              className="w-32 h-32 md:w-56 md:h-56 object-contain"
            />
          ) : (
            <div className="w-32 h-32 md:w-56 md:h-56 bg-gray-200 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-xs md:text-sm">
              Click to add photo
            </span>
          </div>
        </div>

        {/* Decorative grid pattern */}
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 opacity-20">
          <svg width="40" height="40" className="md:w-[60px] md:h-[60px]" viewBox="0 0 60 60" fill="none">
            {[...Array(5)].map((_, i) => 
              [...Array(5)].map((_, j) => (
                <rect key={`${i}-${j}`} x={i * 12} y={j * 12} width="8" height="8" fill="white" />
              ))
            )}
          </svg>
        </div>
      </div>
    </div>
  );

  const renderPhotosForLayout = (month: MonthData, monthIndex: number) => {
    const handleClick = () => {
      setSelectedMonth(monthIndex);
      setAvailablePhotos(memories);
    };

    const photos = month.photos || [];
    
    // Minimalist: 1 large photo
    if (photoLayout === 'minimalist') {
      return (
        <div className="relative">
          <div onClick={handleClick} className="group relative bg-white p-2 md:p-4 pb-4 md:pb-8 shadow-2xl transform -rotate-3 hover:rotate-0 transition-all cursor-pointer hover:scale-105">
            {photos[0] ? (
              <img src={photos[0]} alt={month.name} className="w-48 h-48 md:w-96 md:h-96 lg:w-[32rem] lg:h-[32rem] object-contain" />
            ) : (
              <div className="w-48 h-48 md:w-96 md:h-96 lg:w-[32rem] lg:h-[32rem] bg-gray-200 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
              <span className="text-gray-800 opacity-0 group-hover:opacity-100 font-medium text-sm">
                {photos[0] ? t('calendar.changePhoto') : t('calendar.addPhoto')}
              </span>
            </div>
          </div>
          {photos[0] && (
            <button
              onClick={(e) => handleRemovePhoto(monthIndex, 0, e)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }
    
    // Classic: 2 photos side by side
    if (photoLayout === 'classic') {
      return (
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {[0, 1].map((idx) => (
            <div key={idx} className="relative">
              <div onClick={handleClick} className="group relative bg-white p-1.5 md:p-3 pb-3 md:pb-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer">
                {photos[idx] ? (
                  <img src={photos[idx]} alt={`${month.name} ${idx + 1}`} className="w-full h-32 md:h-56 lg:h-72 object-contain" />
                ) : (
                  <div className="w-full h-32 md:h-56 lg:h-72 bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                  </div>
                )}
              </div>
              {photos[idx] && (
                <button
                  onClick={(e) => handleRemovePhoto(monthIndex, idx, e)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    // Gallery: 4 photos grid
    if (photoLayout === 'gallery') {
      return (
        <div className="grid grid-cols-2 gap-1.5 md:gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="relative">
              <div onClick={handleClick} className="group relative bg-white p-1 md:p-2 pb-2 md:pb-4 shadow-lg hover:shadow-xl transition-all cursor-pointer">
                {photos[idx] ? (
                  <img src={photos[idx]} alt={`${month.name} ${idx + 1}`} className="w-full h-24 md:h-40 lg:h-56 object-contain" />
                ) : (
                  <div className="w-full h-24 md:h-40 lg:h-56 bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                  </div>
                )}
              </div>
              {photos[idx] && (
                <button
                  onClick={(e) => handleRemovePhoto(monthIndex, idx, e)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    // Collage: 3 photos mixed layout
    if (photoLayout === 'collage') {
      return (
        <div className="space-y-2 md:space-y-4">
          <div className="relative">
            <div onClick={handleClick} className="bg-white p-1.5 md:p-3 pb-3 md:pb-6 shadow-xl transform -rotate-2 cursor-pointer">
              {photos[0] ? (
                <img src={photos[0]} alt={`${month.name} 1`} className="w-full h-32 md:h-56 lg:h-72 object-contain" />
              ) : (
                <div className="w-full h-32 md:h-56 lg:h-72 bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
              )}
            </div>
            {photos[0] && (
              <button
                onClick={(e) => handleRemovePhoto(monthIndex, 0, e)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg z-10"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:gap-3">
            {[1, 2].map((idx) => (
              <div key={idx} className="relative">
                <div onClick={handleClick} className="bg-white p-1 md:p-2 pb-2 md:pb-4 shadow-lg transform rotate-1 cursor-pointer">
                  {photos[idx] ? (
                    <img src={photos[idx]} alt={`${month.name} ${idx + 1}`} className="w-full h-24 md:h-40 lg:h-52 object-contain" />
                  ) : (
                    <div className="w-full h-24 md:h-40 lg:h-52 bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                {photos[idx] && (
                  <button
                    onClick={(e) => handleRemovePhoto(monthIndex, idx, e)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderMonthPage = (monthIndex: number) => {
    console.log('📄 Rendering month page:', monthIndex, 'calendarData:', calendarData);
    const month = calendarData[monthIndex];
    console.log('📅 Month data:', month);
    if (!month) {
      console.log('⚠️ No month data found for index:', monthIndex);
      return null;
    }

    const daysInMonth = getDaysInMonth(monthIndex, selectedYear);
    const firstDay = getFirstDayOfMonth(monthIndex, selectedYear);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    const photos = month.photos || [];
    const handleClick = () => {
      setSelectedMonth(monthIndex);
      setAvailablePhotos(memories);
    };

    return (
      <div 
        className={`relative w-full h-full ${useCustomColor ? '' : `bg-gradient-to-br ${getCurrentGradient()}`} rounded-lg shadow-2xl overflow-hidden`}
        style={getGradientStyle()}
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-1/2 h-full opacity-30">
          <div className="absolute top-8 left-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative h-full p-4 md:p-8 flex flex-col">
          {/* Month Header */}
          <div className="mb-3 md:mb-6">
            <div className="flex items-baseline gap-2 md:gap-3">
              <span className="text-2xl md:text-4xl font-light text-white/90">{String(monthIndex + 1).padStart(2, '0')}.</span>
              <h2 className="text-3xl md:text-5xl font-serif italic text-white">{month.name}</h2>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:hidden flex-1 flex flex-col gap-4">
            {/* Single Main Photo for Mobile */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative max-w-full">
                <div onClick={handleClick} className="bg-white p-3 pb-6 shadow-2xl transform -rotate-1 hover:rotate-0 transition-all cursor-pointer">
                  {photos[0] ? (
                    <img src={photos[0]} alt={month.name} className="w-full max-h-[280px] object-contain" />
                  ) : (
                    <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                {photos[0] && (
                  <button
                    onClick={(e) => handleRemovePhoto(monthIndex, 0, e)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mini Calendar Grid for Mobile */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-white/70 text-[10px] font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((i) => (
                  <div key={`blank-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const isToday = 
                    new Date().getDate() === day && 
                    new Date().getMonth() === monthIndex && 
                    new Date().getFullYear() === selectedYear;
                  
                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center text-[10px] font-light border border-white/20 ${
                        isToday ? 'bg-white/30 text-white font-semibold' : 'text-white/90'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid flex-1 grid-cols-2 gap-8">
            {/* Left Side - Photos based on layout */}
            <div className="flex items-center justify-center">
              {renderPhotosForLayout(month, monthIndex)}
            </div>

            {/* Right Side - Calendar Grid */}
            <div className="flex flex-col justify-center">
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-white/70 text-sm font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar dates */}
              <div className="grid grid-cols-7 gap-2">
                {blanks.map((i) => (
                  <div key={`blank-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const isToday = 
                    new Date().getDate() === day && 
                    new Date().getMonth() === monthIndex && 
                    new Date().getFullYear() === selectedYear;
                  
                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center text-sm font-light border border-white/20 hover:bg-white/10 transition-all cursor-default ${
                        isToday ? 'bg-white/20 text-white font-semibold' : 'text-white/90'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Decorative grid pattern */}
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 opacity-10">
            <svg width="30" height="30" className="md:w-[40px] md:h-[40px]" viewBox="0 0 40 40" fill="none">
              {[...Array(4)].map((_, i) => 
                [...Array(4)].map((_, j) => (
                  <rect key={`${i}-${j}`} x={i * 10} y={j * 10} width="6" height="6" fill="white" />
                ))
              )}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
      {/* Print-only view - All pages */}
      <div className="print-calendar-container hidden print:block">
        {/* Cover Page */}
        <div className="print-page">
          {renderCoverPage()}
        </div>
        
        {/* All Month Pages */}
        {MONTHS.map((_, index) => (
          <div key={index} className="print-page">
            {renderMonthPage(index)}
          </div>
        ))}
      </div>

      {/* Mobile Warning Modal */}
      {showMobileWarning && isMobile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-amber-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('calendar.mobileWarning.title')}
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t('calendar.mobileWarning.message')}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => navigate('/landing')}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  {t('calendar.mobileWarning.goBack')}
                </button>
              </div>
              
              <button
                onClick={() => setShowMobileWarning(false)}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {t('calendar.mobileWarning.continueAnyway')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/landing')}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('calendar.back')}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            title={t('calendar.customize')}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{t('calendar.customize')}</span>
          </button>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setCurrentPage(0);
            }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <div className="relative export-dropdown">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('calendar.exportButton')}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <button
                  onClick={downloadAsJSON}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 text-gray-700"
                >
                  <FileJson className="w-4 h-4" />
                  <span>{t('calendar.export.json')}</span>
                </button>
                <button
                  onClick={downloadAsPDF}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 text-gray-700"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('calendar.export.pdfPrint')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Book */}
      {loading ? (
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-12 text-center no-print">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('calendar.loading')}</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto no-print">
          {/* Spiral Binding Effect */}
          <div className="flex justify-center mb-2">
            <div className="flex gap-2 md:gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-400 shadow-inner" />
              ))}
            </div>
          </div>

          {/* Calendar Page */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="aspect-[16/10] relative">
              {currentPage === 0 ? renderCoverPage() : renderMonthPage(currentPage - 1)}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between no-print">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-white rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{t('calendar.previous')}</span>
            </button>

            <div className="text-center">
              <p className="text-xs md:text-sm text-gray-600">
                {currentPage === 0 ? t('calendar.cover') : `${MONTHS[currentPage - 1]} ${selectedYear}`}
              </p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1">
                {t('calendar.page').replace('{current}', String(currentPage + 1)).replace('{total}', '13')}
              </p>
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === 12}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-white rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <span className="hidden sm:inline">{t('calendar.next')}</span>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Photo Selection Modal */}
      {selectedMonth !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMonth(null)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedMonth === -1 ? t('calendar.selectPhotoForCover') : t('calendar.selectPhotoFor').replace('{month}', MONTHS[selectedMonth])}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const maxPhotos = { minimalist: 1, classic: 2, gallery: 4, collage: 3 }[photoLayout];
                    const currentPhotos = selectedMonth >= 0 ? (calendarData[selectedMonth]?.photos?.length || 0) : 0;
                    return `${currentPhotos} / ${maxPhotos} ${t('calendar.chooseAnyPhoto')}`;
                  })()}
                </p>
              </div>
              <button
                onClick={() => setSelectedMonth(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {availablePhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availablePhotos.map((memory) => (
                    memory.photos.map((photo, photoIndex) => (
                      <button
                        key={`${memory.id}-${photoIndex}`}
                        onClick={() => handlePhotoSelect(photo, memory.id)}
                        className="group relative aspect-square rounded-xl overflow-hidden hover:ring-4 ring-amber-500 transition-all shadow-lg hover:shadow-xl"
                      >
                        <img
                          src={photo}
                          alt={memory.title || 'Memory'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-3">
                          <div className="text-white text-left">
                            <p className="text-sm font-medium truncate">
                              {memory.title || 'Untitled'}
                            </p>
                            <p className="text-xs opacity-80">
                              {memory.date ? new Date(memory.date).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <ImageIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">{t('calendar.noPhotos')}</p>
                  <p className="text-sm text-gray-500 mt-2">{t('calendar.noPhotosDesc')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">{t('calendar.settings.title')}</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-6">
              {/* Title Settings */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('calendar.settings.titleLabel')}
                </label>
                <input
                  type="text"
                  value={calendarTitle}
                  onChange={(e) => setCalendarTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder={t('calendar.settings.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('calendar.settings.subtitleLabel')}
                </label>
                <input
                  type="text"
                  value={calendarSubtitle}
                  onChange={(e) => setCalendarSubtitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder={t('calendar.settings.subtitlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('calendar.settings.descriptionLabel')}
                </label>
                <textarea
                  value={calendarDescription}
                  onChange={(e) => setCalendarDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  placeholder={t('calendar.settings.descriptionPlaceholder')}
                />
              </div>

              {/* Photo Layout Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <label className="block text-sm font-semibold text-gray-700">
                    {t('calendar.settings.photoLayout')}
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['minimalist', 'classic', 'gallery', 'collage'] as PhotoLayout[]).map((layout) => (
                    <button
                      key={layout}
                      onClick={() => setPhotoLayout(layout)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        photoLayout === layout
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {t(`calendar.layouts.${layout}`)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <label className="block text-sm font-semibold text-gray-700">
                    {t('calendar.settings.colorTheme')}
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => applyTheme(theme)}
                      className={`group relative p-4 rounded-xl border-2 transition-all ${
                        !useCustomColor && calendarTheme.id === theme.id
                          ? 'border-purple-600 ring-4 ring-purple-100'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${theme.gradient} mb-2 shadow-md`} />
                      <p className="text-sm font-medium text-gray-900">{t(`calendar.themes.${theme.id}`)}</p>
                      {!useCustomColor && calendarTheme.id === theme.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Color Option */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomColor}
                      onChange={(e) => setUseCustomColor(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">{t('calendar.settings.useCustomColor')}</span>
                  </label>

                  {useCustomColor && (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('calendar.settings.gradientFrom')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={customGradient.from}
                            onChange={(e) => setCustomGradient({...customGradient, from: e.target.value})}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customGradient.from}
                            onChange={(e) => setCustomGradient({...customGradient, from: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="#8B7355"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('calendar.settings.gradientTo')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={customGradient.to}
                            onChange={(e) => setCustomGradient({...customGradient, to: e.target.value})}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customGradient.to}
                            onChange={(e) => setCustomGradient({...customGradient, to: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="#A0826D"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('calendar.settings.preview')}</p>
                <div 
                  className={`w-full h-48 rounded-xl ${useCustomColor ? '' : `bg-gradient-to-br ${getCurrentGradient()}`} p-6 flex flex-col items-center justify-center text-white shadow-xl`}
                  style={getGradientStyle()}
                >
                  <p className="text-xs uppercase tracking-widest mb-2 opacity-80">
                    {calendarTitle.split('').join(' ')}
                  </p>
                  <h3 className="text-4xl font-serif italic mb-1">{calendarSubtitle}</h3>
                  <p className="text-2xl font-light">{selectedYear}</p>
                  {calendarDescription && (
                    <p className="text-sm mt-3 opacity-90 text-center max-w-xs">{calendarDescription}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all font-medium"
              >
                {t('calendar.settings.close')}
              </button>
              <button
                onClick={() => {
                  saveCalendar();
                  setShowSettings(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                {t('calendar.settings.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
