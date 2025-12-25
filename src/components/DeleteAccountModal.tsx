/**
 * DeleteAccountModal - Modal xác nhận xóa tài khoản vĩnh viễn
 * Features:
 * - Text input yêu cầu nhập "DELETE MY ACCOUNT"
 * - Checkbox confirmation
 * - Submit button disable cho đến khi đủ điều kiện
 * - Loading state
 * - Responsive mobile/desktop
 */

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const { t } = useLanguage();
  const [confirmText, setConfirmText] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const REQUIRED_TEXT = 'DELETE MY ACCOUNT';
  const isValid = confirmText === REQUIRED_TEXT && isChecked;

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;
    
    setIsLoading(true);
    try {
      await onConfirm();
      // Modal sẽ đóng khi user logout
    } catch (error) {
      setIsLoading(false);
      console.error('Delete account error:', error);
    }
  };

  const handleClose = () => {
    if (isLoading) return; // Prevent close while loading
    setConfirmText('');
    setIsChecked(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-red-100 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-600">
                {t('settings.deleteAccount.title')}
              </h2>
            </div>
            {!isLoading && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-red-800">
              {t('settings.deleteAccount.warning')}
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              <li>{t('settings.deleteAccount.warningPoint1')}</li>
              <li>{t('settings.deleteAccount.warningPoint2')}</li>
              <li>{t('settings.deleteAccount.warningPoint3')}</li>
            </ul>
          </div>

          {/* Grace Period Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">⏳ {t('settings.deleteAccount.gracePeriod')}:</span>
              <br />
              {t('settings.deleteAccount.gracePeriodDesc')}
            </p>
          </div>

          {/* Confirmation Text Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('settings.deleteAccount.confirmLabel')}
            </label>
            <div className="space-y-1">
              <div className="bg-gray-100 rounded-lg px-3 py-2 border border-gray-300">
                <code className="text-sm font-mono text-gray-800">{REQUIRED_TEXT}</code>
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isLoading}
                placeholder={t('settings.deleteAccount.confirmPlaceholder')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
              />
              {confirmText && confirmText !== REQUIRED_TEXT && (
                <p className="text-xs text-red-600">
                  {t('settings.deleteAccount.confirmError')}
                </p>
              )}
            </div>
          </div>

          {/* Checkbox Confirmation */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="understand-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              disabled={isLoading}
              className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed"
            />
            <label
              htmlFor="understand-checkbox"
              className="text-sm text-gray-700 cursor-pointer select-none"
            >
              {t('settings.deleteAccount.checkboxLabel')}
            </label>
          </div>

          {/* Final Warning */}
          <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-medium">
              ⚠️ {t('settings.deleteAccount.finalWarning')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('settings.deleteAccount.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('settings.deleteAccount.deleting')}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span>{t('settings.deleteAccount.confirm')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
