
import { useEffect, useState } from 'react';
import { Pencil, User, Mail, Phone, Calendar, LogOut, Lock } from 'lucide-react';
import { auth, db, getCollectionName } from './firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from './components/CustomDatePicker';
import ChangePasswordModal from './components/ChangePasswordModal';
import { SecureStorage } from './utils/secureStorage';
import { useLanguage } from './hooks/useLanguage';

interface ProfileInformationProps {
  theme: any;
  onSyncStart?: () => void;
  onSyncSuccess?: () => void;
  onSyncError?: (message: string) => void;
}

const ProfileInformation: React.FC<ProfileInformationProps> = ({ theme, onSyncStart, onSyncSuccess, onSyncError }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phone: '',
    dob: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setProfile((prev) => ({ ...prev, email: (firebaseUser.email || '').normalize('NFC') }));
        // Fetch profile from Firestore
        const docRef = doc(db, getCollectionName('users'), firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            displayName: (data.displayName || '').normalize('NFC'),
            email: (firebaseUser.email || '').normalize('NFC'),
            phone: (data.phone || '').normalize('NFC'),
            dob: data.dob || ''
          });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Normalize to NFC to prevent Unicode decomposition
    const normalizedValue = value.normalize('NFC');
    setProfile((prev) => ({ ...prev, [name]: normalizedValue }));
  };

  const handleSave = async () => {
    setError(null);
    if (!user) return;
    // Validate required fields
    if (!profile.displayName.trim() || !profile.email.trim() || !profile.phone.trim() || !profile.dob.trim()) {
      setError('Input all the fields required');
      return;
    }
    setSaving(true);
    onSyncStart?.();
    try {
      await setDoc(doc(db, getCollectionName('users'), user.uid), {
        displayName: profile.displayName.normalize('NFC'),
        phone: profile.phone.normalize('NFC'),
        dob: profile.dob
      }, { merge: true });
      setSaving(false);
      setSuccess(true);
      setEditMode(false);
      onSyncSuccess?.();
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      setSaving(false);
      onSyncError?.(t('errors.saveProfile'));
      setError(t('errors.saveProfile'));
      console.error('Error saving profile:', error);
    }
  };

  // 🔐 Security: Logout handler with cleanup
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear secure storage
      SecureStorage.clearRemembered();
      
      // Clear other sensitive data
      localStorage.removeItem('userIdSession');
      localStorage.removeItem('currentTheme');
      sessionStorage.clear();
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Redirect to login
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setError(t('errors.logoutFailed'));
      setIsLoggingOut(false);
    }
  };

  return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            {t('profile.accountSettings')}
          </h2>
          <p style={{ color: theme.colors.textSecondary }}>
            {t('profile.accountSubtitle')}
          </p>
        </div>
        <div 
          className="p-6 rounded-2xl border"
          style={{ 
            background: theme.colors.cardBg,
            borderColor: theme.colors.border
          }}
        >
          <div className="flex items-center mb-4">
            <h3 className="font-semibold mr-2" style={{ color: theme.colors.textPrimary }}>
              {t('profile.title')}
            </h3>
            {!editMode && (
              <button
                type="button"
                className="ml-2 p-1 rounded-full hover:bg-gray-100"
                style={{ color: theme.colors.primary }}
                onClick={() => setEditMode(true)}
                aria-label={t('profile.editProfile')}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {loading ? (
            <div className="text-center">{t('profile.loading')}</div>
          ) : (
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div className="flex items-center space-x-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover"
                  style={{ backgroundColor: theme.colors.gradient }}
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl"
                  style={{ backgroundColor: theme.colors.gradient }}
                >
                  {(() => {
                    const name = user?.displayName || profile.displayName || user?.email || profile.email;
                    if (name) {
                      const parts = name.split(/\s|@/).filter(Boolean);
                      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                      if (parts.length === 1) return parts[0][0].toUpperCase();
                    }
                    return 'User';
                  })()}
                </div>
              )}
              <div>
                <h4 className="font-medium" style={{ color: theme.colors.textPrimary }}>
                  {user?.displayName || profile.displayName || t('profile.noName')}
                </h4>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {profile.email || t('profile.noEmail')}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: theme.colors.textSecondary }}>{t('profile.displayName')}</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3 text-gray-400" />
                <input 
                  type="text"
                  name="displayName"
                  value={profile.displayName}
                  onChange={handleChange}
                  className={`form-input w-full pl-9${!editMode ? ' bg-gray-100 cursor-not-allowed' : ''}`}
                  style={{ 
                    borderColor: theme.colors.border,
                    '--tw-ring-color': theme.colors.primary + '33'
                  } as React.CSSProperties}
                  required
                  disabled={!editMode}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: theme.colors.textSecondary }}>{t('profile.email')}</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-gray-400" />
                <input 
                  type="email"
                  name="email"
                  value={profile.email}
                  className="form-input w-full pl-9 bg-gray-100 cursor-not-allowed"
                  style={{ 
                    borderColor: theme.colors.border,
                    '--tw-ring-color': theme.colors.primary + '33'
                  } as React.CSSProperties}
                  disabled
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: theme.colors.textSecondary }}>{t('profile.phone')}</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 absolute left-3 text-gray-400" />
                <input 
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className={`form-input w-full pl-9${!editMode ? ' bg-gray-100 cursor-not-allowed' : ''}`}
                  style={{ 
                    borderColor: theme.colors.border,
                    '--tw-ring-color': theme.colors.primary + '33'
                  } as React.CSSProperties}
                  required
                  disabled={!editMode}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: theme.colors.textSecondary }}>{t('profile.dateOfBirth')}</label>
              <div className={!editMode ? 'opacity-50 pointer-events-none' : ''}>
                <CustomDatePicker
                  selected={profile.dob ? new Date(profile.dob) : null}
                  onChange={(date) => {
                    if (date) {
                      const formattedDate = date.toISOString().split('T')[0];
                      setProfile(prev => ({ ...prev, dob: formattedDate }));
                    }
                  }}
                  placeholder={t('profile.selectDateOfBirth')}
                  required
                  maxDate={new Date()}
                  theme={theme}
                />
              </div>
            </div>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {editMode && (
              <button
                type="submit"
                className="px-6 py-2 rounded-full text-white font-semibold mt-2"
                style={{ background: theme.colors.buttonGradient }}
                disabled={saving}
              >
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
            )}
            {success && <div className="text-green-600 mt-2">{t('profile.savedSuccess')}</div>}
          </form>
          )}
        </div>
        <div 
          className="p-6 rounded-2xl border"
          style={{ 
            background: theme.colors.cardBg,
            borderColor: theme.colors.border
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
            {t('profile.preferences')}
          </h3>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {t('profile.preferencesComingSoon')}
          </p>
        </div>

        {/* 🔐 Security Section */}
        <div 
          className="p-6 rounded-2xl border mt-6"
          style={{ 
            background: theme.colors.cardBg,
            borderColor: theme.colors.border
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
            {t('profile.security')}
          </h3>

          {/* Change Password Button */}
          <div className="mb-6">
            <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
              {t('profile.changePasswordSubtitle')}
            </p>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: theme.colors.buttonGradient }}
            >
              <Lock className="w-4 h-4" />
              {t('profile.changePassword')}
            </button>
          </div>

          {/* Logout Button */}
          <div className="border-t" style={{ borderColor: theme.colors.border }}>
            <p className="text-sm mt-4 mb-3" style={{ color: theme.colors.textSecondary }}>
              {t('profile.logoutInfo')}
            </p>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
            </button>
          </div>
        </div>

        {/* Change Password Modal */}
        <ChangePasswordModal 
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          userEmail={profile.email}
          theme={theme}
        />
      </div>

    );
}

export default ProfileInformation
