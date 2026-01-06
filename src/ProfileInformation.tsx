
import { useEffect, useState } from 'react';
import { Pencil, User, Mail, Phone, LogOut, Lock, AlertTriangle } from 'lucide-react';
import { auth, db, getCollectionName } from './firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from './config/routes';
import CustomDatePicker from './components/CustomDatePicker';
import ChangePasswordModal from './components/ChangePasswordModal';
import DeleteAccountModal from './components/DeleteAccountModal';
import { SecureStorage } from './utils/secureStorage';
import { useLanguage } from './hooks/useLanguage';
import { useToastContext } from './contexts/ToastContext';
import { useAdmin } from './contexts/AdminContext';
import { WebPImage } from './components/WebPImage';
import { deleteAccount } from './apis/deleteAccountApi';

interface ProfileInformationProps {
  theme: any;
  onSyncStart?: () => void;
  onSyncSuccess?: () => void;
  onSyncError?: (message: string) => void;
}

const ProfileInformation: React.FC<ProfileInformationProps> = ({ theme, onSyncStart, onSyncSuccess, onSyncError }) => {
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToastContext();
  const { currentUserRole } = useAdmin();
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
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

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
          const userEmail = (firebaseUser.email || data.email || '').normalize('NFC');
          setProfile({
            displayName: (data.displayName || '').normalize('NFC'),
            email: userEmail,
            phone: (data.phone || '').normalize('NFC'),
            dob: data.dob || ''
          });
          setOriginalEmail(userEmail);
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

  const handleEmailBlur = () => {
    // Show confirmation modal when user finishes entering email
    if (!originalEmail && profile.email && profile.email !== originalEmail) {
      setPendingEmail(profile.email);
      setShowEmailConfirmModal(true);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!user) return;
    // Validate required fields
    if (!profile.displayName.trim() || !profile.email.trim() || !profile.phone.trim() || !profile.dob.trim()) {
      const errorMsg = 'Input all the fields required';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }
    setSaving(true);
    onSyncStart?.();
    try {
      const updateData: any = {
        displayName: profile.displayName.normalize('NFC'),
        phone: profile.phone.normalize('NFC'),
        dob: profile.dob
      };
      
      // Only save email if it was originally empty and now has value
      if (!originalEmail && profile.email) {
        updateData.email = profile.email.normalize('NFC');
      }
      
      await setDoc(doc(db, getCollectionName('users'), user.uid), updateData, { merge: true });
      
      // Update original email after successful save
      if (!originalEmail && profile.email) {
        setOriginalEmail(profile.email);
      }
      setSaving(false);
      setSuccess(true);
      setEditMode(false);
      showSuccess('Profile saved successfully! 💕');
      onSyncSuccess?.();
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      setSaving(false);
      const errorMsg = t('errors.saveProfile');
      onSyncError?.(errorMsg);
      setError(errorMsg);
      showError(errorMsg);
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

  const handleDeleteAccount = async () => {
    console.log('[ProfileInformation] handleDeleteAccount called');
    console.log('[ProfileInformation] Current user:', user?.uid, user?.email);
    try {
      console.log('[ProfileInformation] Calling deleteAccount() API...');
      await deleteAccount();
      console.log('[ProfileInformation] deleteAccount() completed successfully');
      // User will be logged out and redirected by deleteAccount()
      showSuccess(t('settings.deleteAccount.success'));
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('[ProfileInformation] Error deleting account:', error);
      if (error instanceof Error) {
        console.error('[ProfileInformation] Error message:', error.message);
        console.error('[ProfileInformation] Error stack:', error.stack);
      }
      showError(t('settings.deleteAccount.error'));
      setShowDeleteAccountModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 -m-6 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {t('profile.accountSettings')}
            </h1>
          </div>
          <p className="text-sm text-gray-600 ml-7">
            {t('profile.accountSubtitle')}
          </p>
        </div>
        
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-gray-600 font-medium">{t('profile.loading')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden sticky top-6">
                {/* Gradient Header */}
                <div className="h-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
                </div>
                
                <div className="px-6 pb-6 -mt-12">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <div className="relative group">
                      {user?.photoURL ? (
                        <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-2xl transform transition-transform group-hover:scale-105">
                          <WebPImage
                            src={user.photoURL}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            width={112}
                            height={112}
                          />
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-white shadow-2xl transform transition-transform group-hover:scale-105">
                          {(() => {
                            const name = user?.displayName || profile.displayName || user?.email || profile.email;
                            if (name) {
                              const parts = name.split(/\s|@/).filter(Boolean);
                              if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                              if (parts.length === 1) return parts[0][0].toUpperCase();
                            }
                            return 'U';
                          })()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900">
                      {user?.displayName || profile.displayName || t('profile.noName')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1.5 break-all">
                      {profile.email || t('profile.noEmail')}
                    </p>
                    
                    {currentUserRole === 'SysAdmin' && (
                      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.938l1-4H9.031z" clipRule="evenodd" />
                        </svg>
                        System Admin
                      </div>
                    )}
                    
                    {/* Edit Button */}
                    {!editMode && (
                      <button
                        type="button"
                        className="mt-6 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        onClick={() => setEditMode(true)}
                        aria-label={t('profile.editProfile')}
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 text-sm font-medium transition-all duration-200 flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Lock className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="flex-1 text-left">{t('profile.changePassword')}</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="flex-1 text-left">{isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Content - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <form className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                <div className="px-8 py-5 border-b border-gray-200/80 bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Update your personal details and contact information</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="space-y-6">
                    {/* Display Name */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        Display Name
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          name="displayName"
                          value={profile.displayName}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            editMode 
                              ? 'bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-gray-900 shadow-sm hover:shadow-md' 
                              : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500'
                          }`}
                          placeholder="Enter your name"
                          required
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div className="group">
                      <label className="flex items-center justify-between mb-2.5">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          Email Address
                        </span>
                        {originalEmail ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 flex items-center gap-1.5 border border-gray-200">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Locked
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700 border border-amber-200">Required</span>
                        )}
                      </label>
                      <div className="relative">
                        <input 
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleChange}
                          onBlur={handleEmailBlur}
                          className={`w-full px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            originalEmail 
                              ? 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500' 
                              : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-gray-900 shadow-sm hover:shadow-md'
                          }`}
                          disabled={!!originalEmail || !editMode}
                          placeholder="your@email.com"
                        />
                      </div>
                      {!originalEmail && editMode && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Cannot be changed after saving
                        </p>
                      )}
                    </div>
                    
                    {/* Phone */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        Phone Number
                      </label>
                      <div className="relative">
                        <input 
                          type="tel"
                          name="phone"
                          value={profile.phone}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            editMode 
                              ? 'bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-gray-900 shadow-sm hover:shadow-md' 
                              : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500'
                          }`}
                          placeholder="+1 (555) 000-0000"
                          required
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                    
                    {/* Date of Birth */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        Date of Birth
                      </label>
                      <div className={!editMode ? 'opacity-50 pointer-events-none' : ''}>
                        <CustomDatePicker
                          selected={profile.dob ? new Date(profile.dob) : null}
                          onChange={(date) => {
                            if (date) {
                              const formattedDate = date.toISOString().split('T')[0];
                              setProfile(prev => ({ ...prev, dob: formattedDate }));
                            }
                          }}
                          placeholder="Select your birth date"
                          required
                          maxDate={new Date()}
                          theme={theme}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-200 flex items-start gap-3 shadow-lg">
                      <div className="w-10 h-10 rounded-lg bg-red-200 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-900">Error</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  {success && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-100/50 border-2 border-green-200 flex items-start gap-3 shadow-lg">
                      <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-green-900">Success</p>
                        <p className="text-sm text-green-700 mt-1">{t('profile.savedSuccess')}</p>
                      </div>
                    </div>
                  )}
                  
                  {editMode && (
                    <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        disabled={saving}
                      >
                        {saving ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                            </svg>
                            Save Changes
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-8 py-3.5 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </form>

              {/* Danger Zone */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-red-300 overflow-hidden">
                <div className="px-8 py-5 border-b-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-700">Danger Zone</h3>
                      <p className="text-xs text-red-600 mt-0.5">Irreversible actions - proceed with extreme caution</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-gray-900 mb-2">Delete Account</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Permanently delete your account and all associated data. This action cannot be undone and will remove all your memories, settings, and personal information.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteAccountModal(true)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold transition-all duration-200 flex items-center gap-2 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Confirmation Modal */}
        {showEmailConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[bounce-in_0.5s_ease-out]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Confirm Email Address
                </h3>
                <p className="text-gray-600 text-sm">
                  Once you save this email, it <strong>cannot be changed</strong> in the future.
                </p>
              </div>

              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 mb-2">
                  <strong>Email to save:</strong>
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {pendingEmail}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEmailConfirmModal(false);
                    setPendingEmail('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setProfile((prev) => ({ ...prev, email: pendingEmail }));
                    setShowEmailConfirmModal(false);
                    setPendingEmail('');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg transition-all"
                >
                  Confirm & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal 
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          userEmail={profile.email}
          theme={theme}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          onConfirm={handleDeleteAccount}
        />
        </div>
      </div>
    );
}

export default ProfileInformation
