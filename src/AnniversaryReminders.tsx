import { useState, useEffect } from 'react';
import { Heart, Calendar, Bell, Plus, X, Edit3, Trash2, ArrowLeft, Gift, Sparkles, Clock, BellRing } from 'lucide-react';
import { anniversaryApi, Anniversary as ApiAnniversary } from './apis/anniversaryApi';
import { auth } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
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
  currentTheme: 'happy' | 'calm' | 'romantic';
}

const themes = {
  happy: {
    background: 'linear-gradient(135deg, #FFFDE4 0%, #FFF 50%, #FEF08A 100%)',
    cardBg: '#fff',
    textPrimary: '#78350f',
    border: '#FEF08A',
  },
  calm: {
    background: 'linear-gradient(135deg, #EEF2FF 0%, #FFF 50%, #E0E7FF 100%)',
    cardBg: '#fff',
    textPrimary: '#3730a3',
    border: '#E0E7FF',
  },
  romantic: {
    background: 'linear-gradient(135deg, #FDF2F8 0%, #FFF 50%, #FCE7F3 100%)',
    cardBg: '#fff',
    textPrimary: '#831843',
    border: '#FCE7F3',
  }
};

function AnniversaryReminders({ onBack, currentTheme }: AnniversaryRemindersProps) {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAnniversary, setEditingAnniversary] = useState<Anniversary | null>(null);
  const [newAnniversary, setNewAnniversary] = useState({
    title: '',
    date: '',
    type: 'custom' as AnniversaryType,
    reminderDays: 1,
    isNotificationEnabled: true
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
    setLoading(true);
    const cacheKey = `anniversariesCache_${userId}`;
    const cache = localStorage.getItem(cacheKey);
    let cacheValid = false;
    if (cache) {
      try {
        const { anniversaries, timestamp } = JSON.parse(cache);
        if (Array.isArray(anniversaries) && timestamp && Date.now() - timestamp < 10 * 60 * 1000) {
          const today = new Date();
          const processed = anniversaries.map((anniversary: any) => {
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
          processed.sort((a: any, b: any) => (a.daysUntil || 0) - (b.daysUntil || 0));
          setAnniversaries(processed);
          setLoading(false);
          cacheValid = true;
        }
      } catch {}
    }
    if (!cacheValid) {
      anniversaryApi.getAll(userId)
        .then((data) => {
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
          // Save to cache
          localStorage.setItem(cacheKey, JSON.stringify({ anniversaries: data, timestamp: Date.now() }));
        })
        .finally(() => setLoading(false));
    }
  }, [userId]);

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

  // Format date to always show the correct day regardless of timezone
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Always parse as local date (no timezone offset)
    // This works for yyyy-mm-dd and yyyy/mm/dd
    let date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) {
      // fallback to Date constructor
      date = new Date(dateString);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    try {
      const { title, date, type, reminderDays, isNotificationEnabled } = newAnniversary;
      let formattedDate = date;
      if (date) {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          formattedDate = `${d.getFullYear()}-${mm}-${dd}`;
        }
      }

      const safeType = type as AnniversaryType;
      const safeReminderDays = Number.isFinite(reminderDays) ? reminderDays : 1;

      // Only include fields defined in Omit<Anniversary, 'id' | 'userId'>
      const payload = {
        title: title || '',
        date: formattedDate || '',
        type: safeType,
        reminderDays: safeReminderDays,
        isNotificationEnabled: !!isNotificationEnabled
      };

      await anniversaryApi.add(userId, payload);
      setShowAddForm(false);
      setNewAnniversary({
        title: '',
        date: '',
        type: 'custom',
        reminderDays: 1,
        isNotificationEnabled: true
      });

      // Hiển thị tất cả sự kiện thuộc userId sau khi thêm mới
      const data = await anniversaryApi.getAll(userId);
      const now = new Date();
      const processed = data.map((anniversary) => {
        const anniversaryDate = new Date(anniversary.date);
        const thisYearDate = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        if (thisYearDate < now) thisYearDate.setFullYear(now.getFullYear() + 1);
        const daysUntil = Math.ceil((thisYearDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const yearsSince = now.getFullYear() - anniversaryDate.getFullYear();
        const milestone = anniversaryTimeline.find(t => t.years === yearsSince);
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
    } catch (err) {
      // Log error for debugging
      console.error('Failed to add anniversary:', err);
      alert('Failed to add anniversary.');
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
      isNotificationEnabled: anniversary.isNotificationEnabled
    });
    setShowAddForm(true);
  };

  // Update anniversary in Firestore
  const handleUpdateAnniversary = async () => {
    if (!editingAnniversary || !newAnniversary.title || !newAnniversary.date || !userId) return;
    setLoading(true);
    try {
      // Allow all types for update
      await anniversaryApi.update(
        editingAnniversary.id,
        newAnniversary as Partial<Omit<ApiAnniversary, 'id' | 'userId'>>
      );
      setEditingAnniversary(null);
      setShowAddForm(false);
      setNewAnniversary({
        title: '',
        date: '',
        type: 'custom',
        reminderDays: 1,
        isNotificationEnabled: true
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
      alert('Failed to update anniversary.');
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
    setLoading(true);
    setShowDeleteConfirm(false);
    try {
      await anniversaryApi.remove(deleteId);
      // Reload anniversaries
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
      alert('Failed to delete anniversary.');
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
  return (
    <div className="anniversary-reminders-page" style={{ background: theme.background, color: theme.textPrimary }}>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      )}
      {/* Header */}
      <header className="anniversary-header">
        <div className="anniversary-header-container">
          <div className="anniversary-header-content">
            <button 
              onClick={onBack}
              className="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="back-button-text">Back</span>
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
              <span className="add-button-text">Add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="anniversary-main">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            Anniversary
            <span className="gradient-text"> Reminders</span>
          </h1>
          <p className="page-subtitle">
            Never miss a special moment - keep track of all your important relationship milestones
          </p>
        </div>

        {/* Upcoming Anniversaries */}
        {upcomingAnniversaries.length > 0 && (
          <section className="upcoming-section">
            <div className="section-header">
              <div className="section-title-container">
                <BellRing className="w-6 h-6 text-pink-500 animate-pulse" />
                <h2 className="section-title">Coming Soon</h2>
              </div>
              <div className="upcoming-count">
                {upcomingAnniversaries.length} upcoming
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
                      >
                        <Bell className="w-4 h-4" />
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
                          <span style={{fontWeight:600}}>{anniversary.milestoneTitle}</span>
                        )}
                        {anniversary.milestoneMeaning && (
                          <span style={{float:'right',fontWeight:400}}>{anniversary.milestoneMeaning}</span>
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
              <h2 className="section-title">All Anniversaries</h2>
            </div>
            <div className="total-count">
              {anniversaries.length} total
            </div>
          </div>
          
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
                    >
                      <Bell className="w-4 h-4" />
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
                        <span className="days-text">days to go</span>
                      </div>
                    </div>
                  </div>

                  {/* Always show milestone info if milestoneTitle or milestoneMeaning exists */}
                  {(anniversary.milestoneTitle || anniversary.milestoneMeaning) && (
                    <div className="milestone-info" style={{background:'#FEF9C3',borderRadius:8,padding:'8px 12px',marginTop:8,marginBottom:8}}>
                      {anniversary.milestoneTitle && (
                        <span style={{fontWeight:600}}>{anniversary.milestoneTitle}</span>
                      )}
                      {anniversary.milestoneMeaning && (
                        <span style={{float:'right',fontWeight:400}}>{anniversary.milestoneMeaning}</span>
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
        </section>

        {/* Empty State */}
        {anniversaries.length === 0 && (
          <div className="empty-state">
            <Heart className="empty-state-icon" />
            <h3 className="empty-state-title">No anniversaries yet</h3>
            <p className="empty-state-text">Add your first anniversary to start tracking your special moments!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="empty-state-button"
            >
              <Plus className="w-5 h-5" />
              Add Anniversary
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit Anniversary Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAnniversary ? 'Edit Anniversary' : 'Add New Anniversary'}
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
                    isNotificationEnabled: true
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
                  <Heart className="w-4 h-4 mr-1 inline text-pink-400" /> Anniversary Title
                </label>
                <div className="input-icon-wrapper">
                  <input
                    type="text"
                    value={newAnniversary.title}
                    onChange={(e) => setNewAnniversary(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., First Date Anniversary"
                    className="form-input"
                    style={{ paddingLeft: '10px' }}
                  />
                </div>
              </div>


              <div className="form-group">
                <label className="form-label">
                  <Calendar className="w-4 h-4 mr-1 inline text-blue-400" /> Date
                </label>
                <div className="input-icon-wrapper">
                  <input
                    type="date"
                    value={newAnniversary.date}
                    onChange={(e) => setNewAnniversary(prev => ({ ...prev, date: e.target.value }))}
                    className="form-input"              
                    style={{ paddingLeft: '10px' }}
                  />
                </div>
              </div>


              <div className="form-group">
                <label className="form-label">
                  <Gift className="w-4 h-4 mr-1 inline text-yellow-500" /> Anniversary Type
                </label>
                <div className="input-icon-wrapper">
                  <select
                    value={newAnniversary.type}
                    onChange={(e) => setNewAnniversary(prev => ({ ...prev, type: e.target.value as AnniversaryType }))}
                    className="form-select"
                  >
                    <option value="custom">Custom</option>
                    <option value="first_date">First Date</option>
                    <option value="engagement">Engagement</option>
                    <option value="wedding">Wedding</option>
                    <option value="first_meeting">First Meeting</option>
                    <option value="proposal">Proposal</option>
                    <option value="honeymoon">Honeymoon</option>
                    <option value="birthday">Birthday</option>
                    <option value="valentine">Valentine</option>
                  </select>
                </div>
              </div>


              <div className="form-group">
                <label className="form-label">
                  <Bell className="w-4 h-4 mr-1 inline text-purple-500" /> Remind me
                </label>
                <div className="input-icon-wrapper">
                  <select
                    value={newAnniversary.reminderDays}
                    onChange={(e) => setNewAnniversary(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                    className="form-select"
                  >
                    <option value={1}>1 day before</option>
                    <option value={3}>3 days before</option>
                    <option value={7}>1 week before</option>
                    <option value={14}>2 weeks before</option>
                    <option value={30}>1 month before</option>
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
                  <span className="checkbox-text">Enable notifications</span>
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
                    isNotificationEnabled: true
                  });
                }}
                className="cancel-button"
              >
                Cancel
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
                {editingAnniversary ? 'Update' : 'Add'} Anniversary
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
              <h2 className="modal-title">Confirm Delete</h2>
            </div>
            <div className="modal-content">
              <p className="delete-confirm-text">Are you sure you want to delete this anniversary?</p>
            </div>
            <div className="modal-actions delete-confirm-actions">
              <button
                className="cancel-button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-button"
                onClick={confirmDeleteAnniversary}
                disabled={loading}
              >
                Delete
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