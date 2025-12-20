import React, { useState } from 'react';
import { Lock, X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { useLanguage } from '../hooks/useLanguage';
import { validatePassword, passwordsMatch } from '../utils/passwordValidation';
import '../styles/ChangePasswordModal.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  theme: any;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, userEmail, theme }) => {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get password validation state
  const passwordValidation = validatePassword(newPassword);
  const passwordsMatched = passwordsMatch(newPassword, confirmPassword);
  const isNewPasswordValid = passwordValidation.isValid && passwordsMatched;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!currentPassword.trim()) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (!confirmPassword.trim()) {
      setError('Vui lòng xác nhận mật khẩu mới');
      return;
    }

    // Validate new password strength
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join('\n'));
      return;
    }

    // Check if passwords match
    if (!passwordsMatched) {
      setError(t('profile.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user || !user.email) {
        setError('Không thể xác định người dùng');
        setIsLoading(false);
        return;
      }

      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccess(true);
      setError(null);
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        setError(t('profile.currentPasswordIncorrect'));
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu không đạt yêu cầu bảo mật. Vui lòng chọn mật khẩu mạnh hơn');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            background: theme.colors.cardBg,
            border: `1px solid ${theme.colors.border}`
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: theme.colors.border }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: theme.colors.gradient }}
              >
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {t('profile.changePasswordTitle')}
                </h2>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {t('profile.changePasswordSubtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              style={{ color: theme.colors.textSecondary }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                {t('profile.currentPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: theme.colors.primary }} 
                />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: theme.colors.border,
                    '--tw-ring-color': theme.colors.primary + '33'
                  } as React.CSSProperties}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                {t('profile.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: theme.colors.primary }} 
                />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: theme.colors.border,
                    '--tw-ring-color': theme.colors.primary + '33'
                  } as React.CSSProperties}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Requirements */}
              {newPassword.length > 0 && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.05)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                    Yêu cầu mật khẩu:
                  </p>
                  <div className="space-y-1 text-xs">
                    {/* Length requirement */}
                    <div className="flex items-center gap-2">
                      {newPassword.length >= 8 ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                      ) : (
                        <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ color: newPassword.length >= 8 ? '#22c55e' : theme.colors.textSecondary }}>
                        Tối thiểu 8 ký tự ({newPassword.length})
                      </span>
                    </div>

                    {/* Uppercase requirement */}
                    <div className="flex items-center gap-2">
                      {/[A-Z]/.test(newPassword) ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                      ) : (
                        <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ color: /[A-Z]/.test(newPassword) ? '#22c55e' : theme.colors.textSecondary }}>
                        Chữ in hoa (A-Z)
                      </span>
                    </div>

                    {/* Lowercase requirement */}
                    <div className="flex items-center gap-2">
                      {/[a-z]/.test(newPassword) ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                      ) : (
                        <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ color: /[a-z]/.test(newPassword) ? '#22c55e' : theme.colors.textSecondary }}>
                        Chữ thường (a-z)
                      </span>
                    </div>

                    {/* Number requirement */}
                    <div className="flex items-center gap-2">
                      {/[0-9]/.test(newPassword) ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                      ) : (
                        <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ color: /[0-9]/.test(newPassword) ? '#22c55e' : theme.colors.textSecondary }}>
                        Số (0-9)
                      </span>
                    </div>

                    {/* Special character requirement */}
                    <div className="flex items-center gap-2">
                      {/[^A-Za-z0-9]/.test(newPassword) ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                      ) : (
                        <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ color: /[^A-Za-z0-9]/.test(newPassword) ? '#22c55e' : theme.colors.textSecondary }}>
                        Ký tự đặc biệt (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Match Status */}
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatched ? (
                  <>
                    <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                    <span style={{ color: '#22c55e' }}>Mật khẩu xác nhận khớp</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span style={{ color: '#ef4444' }}>Mật khẩu không khớp</span>
                  </>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                {t('profile.confirmNewPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: theme.colors.primary }} 
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: theme.colors.border,
                    '--tw-ring-color': theme.colors.primary + '33'
                  } as React.CSSProperties}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg text-red-600 text-sm" style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-lg text-green-600 text-sm" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                {t('profile.passwordChanged')}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border font-medium transition-colors"
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading || !currentPassword || !isNewPasswordValid}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: theme.colors.buttonGradient }}
              >
                {isLoading ? t('profile.changing') || 'Đang đổi...' : t('profile.changePasswordButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChangePasswordModal;
