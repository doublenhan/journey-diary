import { useState, useEffect } from 'react';
import { Heart, Calendar, Bell, Plus, X, Edit3, Trash2, ArrowLeft, Gift, Sparkles, Clock, BellRing, Download } from 'lucide-react';
import { anniversaryApi, Anniversary as ApiAnniversary } from './apis/anniversaryApi';
import { auth } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from './hooks/useLanguage';
import { useToastContext } from './contexts/ToastContext';
import { MoodTheme, themes } from './config/themes';
import VisualEffects from './components/VisualEffects';
import { useSyncStatus } from './hooks/useSyncStatus';
import SyncStatus from './components/SyncStatus';
import { EmptyState } from './components/EmptyState';
import { AnniversaryItemSkeleton } from './components/LoadingSkeleton';
import CustomDatePicker from './components/CustomDatePicker';
import './styles/AnniversaryReminders.css';
import anniversaryTimeline from "./data/anniversaryTimeline.json";

interface Anniversary extends ApiAnniversary {
  yearsSince?: number;
  daysUntil?: number;
  isUpcoming?: boolean;
  meaning?: string | null;
  milestoneTitle?: string | null;
  milestoneMeaning?: string | null;
  customTypeName?: string;
}

interface AnniversaryRemindersProps {
  onBack?: () => void;
  currentTheme: MoodTheme;
}

function AnniversaryReminders({ onBack, currentTheme }: AnniversaryRemindersProps) {
  const { syncStatus, lastSyncTime, errorMessage, startSync, syncSuccess, syncError } = useSyncStatus();
  const { t, currentLanguage } = useLanguage();
  const { success, error } = useToastContext();
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAnniversary, setEditingAnniversary] = useState<Anniversary | null>(null);
  const [newAnniversary, setNewAnniversary] = useState({
    title: '',
    date: '',
    type: 'custom' as AnniversaryType,
    reminderDays: 1,
    isNotificationEnabled: true,
    customTypeName: ''
  });

  type AnniversaryType =
    | 'custom'
    | 'first_date'
    | 'engagement'
    | 'wedding'
    | 'first_meeting'
    | 'proposal'
    | 'honeymoon'
    | 'birthday'
    | 'valentine';
  type FloatingHeart = { id: number; x: number; y: number };
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  // Custom confirm delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Firebase Auth state
  const [userId, setUserId] = useState<string | null>(null);

  // Load anniversaries from Firestore with FE cache (10min TTL)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setAnniversaries([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    const cacheKey = `anniversariesCache_${userId}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    // Helper function to process anniversary data
    const processAnniversaries = (data: any[]) => {
      const today = new Date();
      const processed = data.map((anniversary) => {
        const anniversaryDate = new Date(anniversary.date);
        const thisYearDate = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        if (thisYearDate < today) thisYearDate.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const yearsSince = today.getFullYear() - anniversaryDate.getFullYear();
        
        // Find closest milestone (not exceeding yearsSince)
        const milestone = anniversaryTimeline
          .filter(t => t.years <= yearsSince)
          .sort((a, b) => b.years - a.years)[0];
        
        return {
          ...anniversary,
          yearsSince: yearsSince > 0 ? yearsSince : 0,
          daysUntil,
          isUpcoming: daysUntil <= anniversary.reminderDays,
          meaning: milestone ? milestone.meaning : null,
          milestoneTitle: milestone ? milestone.title : null,
          milestoneMeaning: milestone ? milestone.meaning : null
        };
      });
      return processed.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));
    };
    
    // Try to load from cache first (instant load)
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { anniversaries: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          // Cache is fresh, use it immediately (no loading state)
          setAnniversaries(processAnniversaries(cachedData));
          syncSuccess(); // Show success immediately
          return; // Skip Firebase fetch
        }
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }
    
    // No cache or cache expired, fetch from Firebase
    setLoading(true);
    startSync();
    
    anniversaryApi.getAll(userId)
      .then((data) => {
        const processed = processAnniversaries(data);
        setAnniversaries(processed);
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({ anniversaries: data, timestamp: Date.now() }));
        syncSuccess();
        success('Dữ liệu kỷ niệm được tải thành công');
      })
      .catch((error) => {
        console.error('Error fetching anniversaries:', error);
        const errorMsg = error.message || 'Không thể tải dữ liệu';
        syncError(errorMsg);
        error(errorMsg);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Hàm tạo file iCalendar (.ics) để lưu vào calendar
  const generateICS = (anniversary: Anniversary): string => {
    const eventDate = new Date(anniversary.date);
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    
    // Định dạng ngày tháng cho iCalendar (YYYYMMDD)
    const formattedDate = `${year}${month}${day}`;
    
    // Tạo unique identifier cho event
    const uid = `anniversary-${anniversary.id}-${year}@lovediaryapp`;
    
    // Tạo nội dung ICS
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Love Diary//Nhật Ký Tình Yêu//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${formattedDate}`,
      `DTEND;VALUE=DATE:${formattedDate}`,
      `UID:${uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${anniversary.title}`,
      `DESCRIPTION:${anniversary.type === 'custom' ? 'Kỷ niệm tùy chỉnh' : 'Kỷ niệm quan trọng'}`,
      `RRULE:FREQ=YEARLY`,
      `ALARM:-PT${anniversary.reminderDays}D`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return icsContent;
  };

  // Hàm lưu event vào calendar (download file .ics)
  const handleSaveToCalendar = (anniversary: Anniversary) => {
    try {
      const icsContent = generateICS(anniversary);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Đặt tên file
      const fileName = `${anniversary.title.replace(/\s+/g, '_')}_${anniversary.date}.ics`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Hiển thị thông báo thành công
      alert(`✅ Sự kiện "${anniversary.title}" đã sẵn sàng để lưu vào calendar!`);
    } catch (err) {
      alert('❌ Không thể tạo file calendar. Vui lòng thử lại.');
    }
  };

  const getAnniversaryIcon = (type: string) => {
    switch (type) {
      case 'first_date':
        return <Heart className="w-6 h-6" />;
      case 'engagement':
        return <Sparkles className="w-6 h-6" />;
      case 'wedding':
        return <Gift className="w-6 h-6" />;
      case 'first_meeting':
        return <Calendar className="w-6 h-6 text-blue-400" />;
      case 'proposal':
        return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'honeymoon':
        return <Gift className="w-6 h-6 text-pink-400" />;
      case 'birthday':
        return <Gift className="w-6 h-6 text-yellow-400" />;
      case 'valentine':
        return <Heart className="w-6 h-6 text-red-400" />;
      case 'custom':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <Calendar className="w-6 h-6" />;
    }
  };

  const getAnniversaryColor = (type: string) => {
    switch (type) {
      case 'first_date':
        return 'from-pink-400 to-rose-400';
      case 'engagement':
        return 'from-purple-400 to-pink-400';
      case 'wedding':
        return 'from-red-400 to-pink-400';
      case 'first_meeting':
        return 'from-blue-400 to-blue-200';
      case 'proposal':
        return 'from-purple-400 to-purple-200';
      case 'honeymoon':
        return 'from-pink-400 to-yellow-200';
      case 'birthday':
        return 'from-yellow-400 to-yellow-200';
      case 'valentine':
        return 'from-red-400 to-pink-200';
      default:
        return 'from-blue-400 to-purple-400';
    }
  };

  const getAnniversaryTypeName = (anniversary: Anniversary) => {
    if (anniversary.type === 'custom' && anniversary.customTypeName) {
      return anniversary.customTypeName;
    }
    
    const typeMap: Record<string, string> = {
      'first_date': t('anniversary.types.firstDate'),
      'engagement': t('anniversary.types.engagement'),
      'wedding': t('anniversary.types.wedding'),
      'first_meeting': t('anniversary.types.firstMeet'),
      'proposal': t('anniversary.types.proposal'),
      'honeymoon': t('anniversary.types.honeymoon'),
      'birthday': t('anniversary.types.birthday'),
      'valentine': t('anniversary.types.valentine'),
      'custom': t('anniversary.types.custom')
    };
    
    return typeMap[anniversary.type] || t('anniversary.title');
  };

  // Format date to always show the correct day regardless of timezone
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    // Parse date string directly to avoid timezone offset
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  // Get milestone title in current language
  const getMilestoneTitle = (anniversary: Anniversary): string => {
    if (!anniversary.milestoneTitle) return '';
    
    // Find closest milestone (not exceeding yearsSince)
    const yearsSince = anniversary.yearsSince || 0;
    const milestone = anniversaryTimeline
      .filter(t => t.years <= yearsSince)
      .sort((a, b) => b.years - a.years)[0];
    
    if (!milestone) return anniversary.milestoneTitle;
    
    // Return Vietnamese if language is 'vi', else English
    return currentLanguage === 'vi' && milestone.titleVi ? milestone.titleVi : milestone.title;
  };

  // Get milestone meaning in current language
  const getMilestoneMeaning = (anniversary: Anniversary): string => {
    if (!anniversary.milestoneMeaning) return '';
    
    // Find closest milestone (not exceeding yearsSince)
    const yearsSince = anniversary.yearsSince || 0;
    const milestone = anniversaryTimeline
      .filter(t => t.years <= yearsSince)
      .sort((a, b) => b.years - a.years)[0];
    
    if (!milestone) return anniversary.milestoneMeaning;
    
    // Return Vietnamese if language is 'vi', else English
    return currentLanguage === 'vi' && milestone.meaningVi ? milestone.meaningVi : milestone.meaning;
  };

  const getDurationString = (fromDate: Date, toDate: Date) => {
    let years = toDate.getFullYear() - fromDate.getFullYear();
    let months = toDate.getMonth() - fromDate.getMonth();
    let days = toDate.getDate() - fromDate.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    const result: string[] = [];
    if (years > 0) result.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) result.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) result.push(`${days} day${days !== 1 ? 's' : ''}`);
    return result.length ? result.join(', ') : 'Today';
  };

  // Add new anniversary to Firestore
  const handleAddAnniversary = async () => {
    if (loading) return; // Prevent duplicate submissions
    if (!newAnniversary.title || !newAnniversary.date || !userId) return;
    setLoading(true);
    startSync(); // Start sync status
    
    // Create optimistic anniversary
    const optimisticId = `temp-${Date.now()}`;
    let formattedDate = newAnniversary.date;
    if (newAnniversary.date) {
      const [year, month, day] = newAnniversary.date.split('-');
      if (year && month && day) {
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        formattedDate = `${year}-${mm}-${dd}`;
      }
    }
    
    const now = new Date();
    const anniversaryDate = new Date(formattedDate);
    const thisYearDate = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
    if (thisYearDate < now) thisYearDate.setFullYear(now.getFullYear() + 1);
    const daysUntil = Math.ceil((thisYearDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const yearsSince = now.getFullYear() - anniversaryDate.getFullYear();
    
    const optimisticAnniversary: Anniversary = {
      id: optimisticId,
      userId: userId,
      title: newAnniversary.title,
      date: formattedDate,
      type: newAnniversary.type as AnniversaryType,
      reminderDays: newAnniversary.reminderDays,
      isNotificationEnabled: newAnniversary.isNotificationEnabled,
      yearsSince: yearsSince > 0 ? yearsSince : 0,
      daysUntil,
      isUpcoming: daysUntil <= newAnniversary.reminderDays,
      meaning: null,
      milestoneTitle: null,
      milestoneMeaning: null
    };
    
    // Optimistically update UI
    const updatedAnniversaries = [...anniversaries, optimisticAnniversary].sort(
      (a, b) => (a.daysUntil || 0) - (b.daysUntil || 0)
    );
    setAnniversaries(updatedAnniversaries);
    syncSuccess(); // Show sync success immediately
    setShowAddForm(false);
    
    const formData = { ...newAnniversary };
    setNewAnniversary({
      title: '',
      date: '',
      type: 'custom',
      reminderDays: 1,
      isNotificationEnabled: true,
      customTypeName: ''
    });
    
    try {
      const { title, date, type, reminderDays, isNotificationEnabled } = formData;
      const safeType = type as AnniversaryType;
      const safeReminderDays = Number.isFinite(reminderDays) ? reminderDays : 1;

      const payload: any = {
        title: title || '',
        date: formattedDate || '',
        type: safeType,
        reminderDays: safeReminderDays,
        isNotificationEnabled: !!isNotificationEnabled
      };

      // Only include customTypeName if type is 'custom'
      if (safeType === 'custom' && formData.customTypeName) {
        payload.customTypeName = formData.customTypeName;
      }

      await anniversaryApi.add(userId, payload);
      
      // Clear cache to force fresh data on next load
      const cacheKey = `anniversariesCache_${userId}`;
      localStorage.removeItem(cacheKey);
      
      // Reload from API to get real data
      const data = await anniversaryApi.getAll(userId);
      const processed = data.map((anniversary) => {
        const anniversaryDate = new Date(anniversary.date);
        const thisYearDate = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        if (thisYearDate < now) thisYearDate.setFullYear(now.getFullYear() + 1);
        const daysUntil = Math.ceil((thisYearDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const yearsSince = now.getFullYear() - anniversaryDate.getFullYear();
        // Find closest milestone (not exceeding yearsSince)
        const milestone = anniversaryTimeline
          .filter(t => t.years <= yearsSince)
          .sort((a, b) => b.years - a.years)[0];
        return {
          ...anniversary,
          yearsSince: yearsSince > 0 ? yearsSince : 0,
          daysUntil,
          isUpcoming: daysUntil <= anniversary.reminderDays,
          meaning: milestone ? milestone.meaning : null,
          milestoneTitle: milestone ? milestone.title : null,
          milestoneMeaning: milestone ? milestone.meaning : null
        };
      });
      processed.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));
      setAnniversaries(processed);
      success('Kỷ niệm mới được thêm thành công');
    } catch (err) {
      // Rollback on error
      const rolledBack = anniversaries.filter(a => a.id !== optimisticId);
      setAnniversaries(rolledBack);
      const errorMsg = err instanceof Error ? err.message : 'Lỗi thêm kỷ niệm';
      syncError(errorMsg);
      error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAnniversary = (anniversary: Anniversary) => {
    setEditingAnniversary(anniversary);
    setNewAnniversary({
      title: anniversary.title,
      date: anniversary.date,
      type: anniversary.type,
      reminderDays: anniversary.reminderDays,
      isNotificationEnabled: anniversary.isNotificationEnabled,
      customTypeName: anniversary.customTypeName || ''
    });
    setShowAddForm(true);
  };

  // Update anniversary in Firestore
  const handleUpdateAnniversary = async () => {
    if (!editingAnniversary || !newAnniversary.title || !newAnniversary.date || !userId) return;
    setLoading(true);
    startSync(); // Start sync status
    try {
      // Format date to ensure YYYY-MM-DD format
      let formattedDate = newAnniversary.date;
      if (newAnniversary.date && newAnniversary.date.includes('-')) {
        const [year, month, day] = newAnniversary.date.split('-');
        if (year && month && day) {
          const mm = String(month).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          formattedDate = `${year}-${mm}-${dd}`;
        }
      }

      // Build payload to avoid undefined values
      const updatePayload: any = {
        title: newAnniversary.title,
        date: formattedDate,
        type: newAnniversary.type,
        reminderDays: newAnniversary.reminderDays,
        isNotificationEnabled: newAnniversary.isNotificationEnabled
      };

      // Only include customTypeName if type is 'custom' and has value
      if (newAnniversary.type === 'custom' && newAnniversary.customTypeName) {
        updatePayload.customTypeName = newAnniversary.customTypeName;
      }

      await anniversaryApi.update(
        editingAnniversary.id,
        updatePayload
      );
      syncSuccess(); // Show sync success
      setEditingAnniversary(null);
      setShowAddForm(false);
      setNewAnniversary({
        title: '',
        date: '',
        type: 'custom',
        reminderDays: 1,
        isNotificationEnabled: true,
        customTypeName: ''
      });
      // Reload anniversaries
      const data = await anniversaryApi.getAll(userId);
      const today = new Date();
      const processed = data.map((anniversary) => {
        const anniversaryDate = new Date(anniversary.date);
        const thisYearDate = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        if (thisYearDate < today) thisYearDate.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const yearsSince = today.getFullYear() - anniversaryDate.getFullYear();
        // Find closest milestone (not exceeding yearsSince)
        const milestone = anniversaryTimeline
          .filter(t => t.years <= yearsSince)
          .sort((a, b) => b.years - a.years)[0];
        return {
          ...anniversary,
          yearsSince: yearsSince > 0 ? yearsSince : 0,
          daysUntil,
          isUpcoming: daysUntil <= anniversary.reminderDays,
          meaning: milestone ? milestone.meaning : null,
          milestoneTitle: milestone ? milestone.title : null,
          milestoneMeaning: milestone ? milestone.meaning : null
        };
      });
      processed.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));
      setAnniversaries(processed);
      success('Kỷ niệm được cập nhật thành công');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi cập nhật kỷ niệm';
      syncError(errorMsg);
      error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete anniversary from Firestore
  // Show custom confirm modal, then delete if confirmed
  const handleDeleteAnniversary = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  // Actually perform the delete after confirm
  const confirmDeleteAnniversary = async () => {
    if (!userId || !deleteId) return;
    setShowDeleteConfirm(false);
    
    // Store deleted anniversary for rollback
    const deletedAnniversary = anniversaries.find(a => a.id === deleteId);
    if (!deletedAnniversary) return;
    
    // Optimistically remove from UI
    const optimisticAnniversaries = anniversaries.filter(a => a.id !== deleteId);
    setAnniversaries(optimisticAnniversaries);
    syncSuccess(); // Show success immediately
    
    setLoading(true);
    startSync(); // Start sync status
    try {
      await anniversaryApi.remove(deleteId);
      
      // Clear cache to force fresh data on next load
      const cacheKey = `anniversariesCache_${userId}`;
      localStorage.removeItem(cacheKey);
      
      // Reload from API to confirm
      const data = await anniversaryApi.getAll(userId);
      const today = new Date();
      const processed = data.map((anniversary) => {
        const anniversaryDate = new Date(anniversary.date);
        const thisYearDate = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        if (thisYearDate < today) thisYearDate.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const yearsSince = today.getFullYear() - anniversaryDate.getFullYear();
        // Find closest milestone (not exceeding yearsSince)
        const milestone = anniversaryTimeline
          .filter(t => t.years <= yearsSince)
          .sort((a, b) => b.years - a.years)[0];
        return {
          ...anniversary,
          yearsSince: yearsSince > 0 ? yearsSince : 0,
          daysUntil,
          isUpcoming: daysUntil <= anniversary.reminderDays,
          meaning: milestone ? milestone.meaning : null,
          milestoneTitle: milestone ? milestone.title : null,
          milestoneMeaning: milestone ? milestone.meaning : null
        };
      });
      processed.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));
      setAnniversaries(processed);
      success('Anniversary deleted successfully');
    } catch (err) {
      // Rollback on error - restore deleted item
      const rolledBack = [...anniversaries, deletedAnniversary].sort(
        (a, b) => (a.daysUntil || 0) - (b.daysUntil || 0)
      );
      setAnniversaries(rolledBack);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete anniversary';
      syncError(errorMsg);
      error(errorMsg);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  // Toggle notification in Firestore
  const toggleNotification = async (id: string) => {
    const ann = anniversaries.find(a => a.id === id);
    if (!ann) return;
    setLoading(true);
    try {
      await anniversaryApi.update(id, { isNotificationEnabled: !ann.isNotificationEnabled });
      // Reload anniversaries
      if (!userId) return;
      const data = await anniversaryApi.getAll(userId);
      const today = new Date();
      const processed = data.map((anniversary) => {
        const anniversaryDate = new Date(anniversary.date);
        const thisYearDate = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        if (thisYearDate < today) thisYearDate.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const yearsSince = today.getFullYear() - anniversaryDate.getFullYear();
        return {
          ...anniversary,
          yearsSince: yearsSince > 0 ? yearsSince : 0,
          daysUntil,
          isUpcoming: daysUntil <= anniversary.reminderDays
        };
      });
      processed.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));
      setAnniversaries(processed);
    } catch (err) {
      alert('Failed to update notification.');
    } finally {
      setLoading(false);
    }
  };

  const createFloatingHearts = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const hearts: FloatingHeart[] = [];
    for (let i = 0; i < 8; i++) {
      let x = rect.left + Math.random() * rect.width;
      let y = rect.top + Math.random() * rect.height;
      if (!isFinite(x) || x < 0) x = 0;
      if (!isFinite(y) || y < 0) y = 0;
      hearts.push({
        id: Date.now() + i,
        x,
        y
      });
    }
    setFloatingHearts(hearts);
    setTimeout(() => {
      setFloatingHearts([]);
    }, 2000);
  };

  const upcomingAnniversaries = anniversaries.filter(ann => ann.isUpcoming);
  const otherAnniversaries = anniversaries.filter(ann => !ann.isUpcoming);

  const theme = themes[currentTheme];
  
  // Default visual effects settings
  const effectsEnabled = {
    particles: true,
    hearts: true,
    transitions: true,
    glow: true,
    fadeIn: true,
    slideIn: true
  };
  const animationSpeed = 50;

  return (
    <div className="anniversary-reminders-page" style={{ background: theme.background, color: theme.textPrimary }}>
      {/* Visual Effects */}
      <VisualEffects 
        effectsEnabled={effectsEnabled}
        animationSpeed={animationSpeed}
        theme={{ colors: { primary: theme.textPrimary } }}
      />

      {/* Sync Status Indicator */}
      <SyncStatus 
        status={syncStatus}
        lastSyncTime={lastSyncTime}
        errorMessage={errorMessage || undefined}
      />
      {/* Header */}
      <header className="anniversary-header">
        <div className="anniversary-header-container">
          <div className="anniversary-header-content">
            <button 
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 active:shadow-inner"
              title="Quay Lại"
            >
              <ArrowLeft className="w-5 h-5 text-pink-600" />
            </button>
            
            <div className="header-logo">
              <div className="header-logo-icon">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="header-logo-text">Love Journal</span>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="add-button"
            >
              <Plus className="w-5 h-5" />
              <span className="add-button-text">{t('anniversary.addNew')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="anniversary-main">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            {t('anniversary.title')}
          </h1>
          <p className="page-subtitle">
            {t('anniversary.subtitle')}
          </p>
        </div>

        {/* Upcoming Anniversaries */}
        {upcomingAnniversaries.length > 0 && (
          <section className="upcoming-section">
            <div className="section-header">
              <div className="section-title-container">
                <BellRing className="w-6 h-6 text-pink-500 animate-pulse" />
                <h2 className="section-title">{t('anniversary.comingSoon')}</h2>
              </div>
              <div className="upcoming-count">
                {upcomingAnniversaries.length} {t('anniversary.daysRemaining')}
              </div>
            </div>
            
            <div className="anniversaries-grid">
              {upcomingAnniversaries.map((anniversary, index) => (
                <div 
                  key={anniversary.id}
                  className="anniversary-card upcoming-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={createFloatingHearts}
                >
                  {/* Card Header */}
                  <div className="card-header">
                    <div className={`anniversary-icon bg-gradient-to-r ${getAnniversaryColor(anniversary.type)}`}>
                      {getAnniversaryIcon(anniversary.type)}
                    </div>
                    <div className="card-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNotification(anniversary.id);
                        }}
                        className={`notification-toggle ${anniversary.isNotificationEnabled ? 'active' : ''}`}
                        title="Bật/Tắt thông báo"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveToCalendar(anniversary);
                        }}
                        className="save-calendar-button"
                        title="Lưu sự kiện vào calendar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAnniversary(anniversary);
                        }}
                        className="edit-button"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnniversary(anniversary.id);
                        }}
                        className="delete-button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="card-content">
    <h3 className="anniversary-title">{anniversary.title}</h3>
    <div className="anniversary-type-badge" title={getAnniversaryTypeName(anniversary)}>
      {getAnniversaryTypeName(anniversary)}
    </div>
    <div className="anniversary-fields-even">
      <div className="anniversary-date">
        <Calendar className="w-4 h-4" />
        <span>{formatDate(anniversary.date)}</span>
      </div>
      <div className="years-badge">
        {(() => {
          const anniversaryDate = new Date(anniversary.date);
          const now = new Date();
          return getDurationString(anniversaryDate, now);
        })()}
      </div>
      <div className="days-until">
        <Clock className="w-4 h-4" />
        <span className="days-count">{anniversary.daysUntil}</span>
        <span className="days-text">days to go</span>
      </div>
    </div>
                    {/* Always show milestone info if milestoneTitle or milestoneMeaning exists */}
                    {(anniversary.milestoneTitle || anniversary.milestoneMeaning) && (
                      <div className="milestone-info" style={{background:'#FEF9C3',borderRadius:8,padding:'8px 12px',marginTop:8,marginBottom:8}}>
                        {anniversary.milestoneTitle && (
                          <span style={{fontWeight:600}}>{getMilestoneTitle(anniversary)}</span>
                        )}
                        {anniversary.milestoneMeaning && (
                          <span style={{float:'right',fontWeight:400}}>{getMilestoneMeaning(anniversary)}</span>
                        )}
                      </div>
                    )}
                    {anniversary.isNotificationEnabled && (
                      <div className="reminder-info">
                        <Bell className="w-4 h-4" />
                        <span>Nhắc nhở được đặt {anniversary.reminderDays} ngày trước</span>
                      </div>
                    )}
                  </div>

                  {/* Upcoming Glow Effect */}
                  <div className="upcoming-glow"></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Anniversaries */}
        <section className="all-anniversaries-section">
          <div className="section-header">
            <div className="section-title-container">
              <Heart className="w-6 h-6 text-pink-500" />
              <h2 className="section-title">{t('anniversary.allAnniversaries')}</h2>
            </div>
            <div className="total-count">
              {anniversaries.length} {t('common.all')}
            </div>
          </div>
          
          {loading ? (
            <div className="anniversaries-grid">
              <AnniversaryItemSkeleton />
              <AnniversaryItemSkeleton />
              <AnniversaryItemSkeleton />
              <AnniversaryItemSkeleton />
            </div>
          ) : otherAnniversaries.length > 0 ? (
            <div className="anniversaries-grid">
              {otherAnniversaries.map((anniversary, index) => (
              <div 
                key={anniversary.id}
                className="anniversary-card"
                style={{ animationDelay: `${(upcomingAnniversaries.length + index) * 0.1}s` }}
                onClick={createFloatingHearts}
              >
                {/* Card Header */}
                <div className="card-header">
                  <div className={`anniversary-icon bg-gradient-to-r ${getAnniversaryColor(anniversary.type)}`}>
                    {getAnniversaryIcon(anniversary.type)}
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNotification(anniversary.id);
                      }}
                      className={`notification-toggle ${anniversary.isNotificationEnabled ? 'active' : ''}`}
                      title="Thông Báo"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToCalendar(anniversary);
                      }}
                      className="save-calendar-button"
                      title="Lưu sự kiện vào calendar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAnniversary(anniversary);
                      }}
                      className="edit-button"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnniversary(anniversary.id);
                      }}
                      className="delete-button"
                      title="Xóa Sự Kiện"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-content">
                  <h3 className="anniversary-title">{anniversary.title}</h3>
                  <div className="anniversary-type-badge" title={getAnniversaryTypeName(anniversary)}>
                    {getAnniversaryTypeName(anniversary)}
                  </div>
                  <div className="anniversary-date">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(anniversary.date)}</span>
                  </div>
                  
                  <div className="anniversary-details">
                    <div className="anniversary-details-row">
                      <div className="years-badge">
                        {(() => {
                          const anniversaryDate = new Date(anniversary.date);
                          const now = new Date();
                          return getDurationString(anniversaryDate, now);
                        })()}
                      </div>
                      <div className="days-until">
                        <Clock className="w-4 h-4" />
                        <span className="days-count">{anniversary.daysUntil}</span>
                        <span className="days-text">ngày nữa</span>
                      </div>
                    </div>
                  </div>

                  {/* Always show milestone info if milestoneTitle or milestoneMeaning exists */}
                  {(anniversary.milestoneTitle || anniversary.milestoneMeaning) && (
                    <div className="milestone-info" style={{background:'#FEF9C3',borderRadius:8,padding:'8px 12px',marginTop:8,marginBottom:8}}>
                      {anniversary.milestoneTitle && (
                        <span style={{fontWeight:600}}>{getMilestoneTitle(anniversary)}</span>
                      )}
                      {anniversary.milestoneMeaning && (
                        <span style={{float:'right',fontWeight:400}}>{getMilestoneMeaning(anniversary)}</span>
                      )}
                    </div>
                  )}
                  {anniversary.isNotificationEnabled && (
                    <div className="reminder-info">
                      <Bell className="w-4 h-4" />
                      <span>Reminder set for {anniversary.reminderDays} day{anniversary.reminderDays !== 1 ? 's' : ''} before</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          ) : null}
        </section>

        {/* Empty State */}
        {anniversaries.length === 0 && !loading && (
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState
              icon="📅"
              title="Chưa Có Kỷ Niệm Nào"
              description="Thêm ngày đặc biệt đầu tiên của bạn để bắt đầu theo dõi những khoảnh khắc quan trọng trong mối quan hệ của bạn!"
              actionLabel="Thêm Ngày Đặc Biệt Đầu Tiên"
              onAction={() => setShowAddForm(true)}
            />
          </div>
        )}
      </main>

      {/* Add/Edit Anniversary Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAnniversary ? 'Chỉnh Sửa Kỷ Niệm' : 'Thêm Kỷ Niệm Mới'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAnniversary(null);
                  setNewAnniversary({
                    title: '',
                    date: '',
                    type: 'custom',
                    reminderDays: 1,
                    isNotificationEnabled: true,
                    customTypeName: ''
                  });
                }}
                className="modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="modal-content">

              <div className="form-group">
                <label className="form-label">
                  Tên Kỷ Niệm
                </label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={newAnniversary.title}
                    onChange={(e) => setNewAnniversary(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="ví dụ: Kỷ Niệm Ngày Đầu Tiên"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-gray-900 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all"
                  />
                </div>
              </div>


              <div className="form-group">
                <label className="form-label">
                  Ngày Tháng
                </label>
                <CustomDatePicker
                  selected={newAnniversary.date ? new Date(newAnniversary.date) : null}
                  onChange={(date) => setNewAnniversary(prev => ({ 
                    ...prev, 
                    date: date ? date.toISOString().split('T')[0] : '' 
                  }))}
                  placeholder="Select anniversary date"
                  required
                />
              </div>


              <div className="form-group">
                <label className="form-label">
                  Loại Kỷ Niệm
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500 pointer-events-none z-10" />
                  <select
                    value={newAnniversary.type}
                    onChange={(e) => setNewAnniversary(prev => ({ ...prev, type: e.target.value as AnniversaryType }))}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-gray-900 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all appearance-none"
                  >
                    <option value="custom">Tùy Chỉnh</option>
                    <option value="first_date">Hẹn Hò Lần Đầu</option>
                    <option value="engagement">Đính Hôn</option>
                    <option value="wedding">Đám Cưới</option>
                    <option value="first_meeting">Gặp Nhau Lần Đầu</option>
                    <option value="proposal">Cầu Hôn</option>
                    <option value="honeymoon">Tuần Trăng Mật</option>
                    <option value="birthday">Sinh Nhật</option>
                    <option value="valentine">Lễ Tình Nhân</option>
                  </select>
                </div>
              </div>

              {newAnniversary.type === 'custom' && (
                <div className="form-group">
                  <label className="form-label">
                    Tên Loại Kỷ Niệm (Tùy Chỉnh)
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500 pointer-events-none z-10" />
                    <input
                      type="text"
                      value={newAnniversary.customTypeName}
                      onChange={(e) => setNewAnniversary(prev => ({ ...prev, customTypeName: e.target.value }))}
                      placeholder="vd: Kỷ Niệm Ngày Đầu Tiên"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-gray-900 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Nhắc Nhở Tôi
                </label>
                <div className="relative">
                  <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 pointer-events-none z-10" />
                  <select
                    value={newAnniversary.reminderDays}
                    onChange={(e) => setNewAnniversary(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-gray-900 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all appearance-none"
                  >
                    <option value={1}>1 ngày trước</option>
                    <option value={3}>3 ngày trước</option>
                    <option value={7}>1 tuần trước</option>
                    <option value={14}>2 tuần trước</option>
                    <option value={30}>1 tháng trước</option>
                  </select>
                </div>
              </div>


              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newAnniversary.isNotificationEnabled}
                    onChange={(e) => setNewAnniversary(prev => ({ ...prev, isNotificationEnabled: e.target.checked }))}
                    className="checkbox-input"
                  />
                  <BellRing className="w-4 h-4 mr-1 inline text-pink-500" />
                  <span className="checkbox-text">Bật Thông Báo</span>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAnniversary(null);
                  setNewAnniversary({
                    title: '',
                    date: '',
                    type: 'custom',
                    reminderDays: 1,
                    isNotificationEnabled: true,
                    customTypeName: ''
                  });
                }}
                className="cancel-button"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (editingAnniversary) {
                    handleUpdateAnniversary();
                  } else {
                    handleAddAnniversary();
                  }
                }}
                disabled={!newAnniversary.title || !newAnniversary.date}
                className="save-button"
              >
                {editingAnniversary ? 'Cập Nhật' : 'Thêm'} Kỷ Niệm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-container delete-confirm-modal">
            <div className="modal-header">
              <h2 className="modal-title">Xác Nhận Xóa</h2>
            </div>
            <div className="modal-content">
              <p className="delete-confirm-text">Bạn có chắc chắn muốn xóa kỷ niệm này không?</p>
            </div>
            <div className="modal-actions delete-confirm-actions">
              <button
                className="cancel-button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                className="delete-confirm-button"
                onClick={confirmDeleteAnniversary}
                disabled={loading}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hearts */}
      {floatingHearts.map(heart => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: heart.x,
            top: heart.y,
          }}
        >
          <Heart className="w-6 h-6 fill-current text-pink-500" />
        </div>
      ))}
    </div>
  );
}

export default AnniversaryReminders;