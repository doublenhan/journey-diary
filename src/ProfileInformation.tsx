
import { useEffect, useState } from 'react';
import { Pencil, User, Mail, Phone, Calendar } from 'lucide-react';
import { auth, db } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ProfileInformationProps {
  theme: any;
}

const ProfileInformation: React.FC<ProfileInformationProps> = ({ theme }) => {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setProfile((prev) => ({ ...prev, email: firebaseUser.email || '' }));
        // Fetch profile from Firestore
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            displayName: data.displayName || '',
            email: firebaseUser.email || '',
            phone: data.phone || '',
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
    setProfile((prev) => ({ ...prev, [name]: value }));
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
    await setDoc(doc(db, 'users', user.uid), {
      displayName: profile.displayName,
      phone: profile.phone,
      dob: profile.dob
    }, { merge: true });
    setSaving(false);
    setSuccess(true);
    setEditMode(false);
    setTimeout(() => setSuccess(false), 2000);
  };

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
          <div className="flex items-center mb-4">
            <h3 className="font-semibold mr-2" style={{ color: theme.colors.textPrimary }}>
              Profile Information
            </h3>
            {!editMode && (
              <button
                type="button"
                className="ml-2 p-1 rounded-full hover:bg-gray-100"
                style={{ color: theme.colors.primary }}
                onClick={() => setEditMode(true)}
                aria-label="Edit Profile"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {loading ? (
            <div className="text-center">Loading...</div>
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
                  {user?.displayName || profile.displayName || 'No Name'}
                </h4>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {profile.email || 'No Email'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: theme.colors.textSecondary }}>Display Name</label>
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
              <label className="block text-sm mb-1" style={{ color: theme.colors.textSecondary }}>Email</label>
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
              <label className="block text-sm mb-1" style={{ color: theme.colors.textSecondary }}>Phone Number</label>
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
              <label className="block text-sm mb-1" style={{ color: theme.colors.textSecondary }}>Date of Birth</label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 absolute left-3 text-gray-400" />
                <input 
                  type="date"
                  name="dob"
                  value={profile.dob}
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
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {editMode && (
              <button
                type="submit"
                className="px-6 py-2 rounded-full text-white font-semibold mt-2"
                style={{ background: theme.colors.buttonGradient }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            {success && <div className="text-green-600 mt-2">Saved successfully!</div>}
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
            Preferences
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Memory Reminders', desc: 'Get notified about anniversaries and special dates', checked: false },
              { label: 'Photo Backup', desc: 'Automatically backup your love memories to cloud', checked: false },
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
}

export default ProfileInformation
