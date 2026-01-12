/**
 * CoupleSettingsPage Component
 * 
 * Manage couple settings and disconnect
 */

import { useState } from 'react';
import { Heart, Settings as SettingsIcon, UserMinus, AlertTriangle, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '../../hooks/useCouple';
import { useLanguage } from '../../hooks/useLanguage';
import { CoupleStatusBadge } from './CoupleStatusBadge';

interface CoupleSettingsPageProps {
  userId: string;
}

export function CoupleSettingsPage({ userId }: CoupleSettingsPageProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    couple,
    loading,
    error,
    disconnect,
    updateSettings
  } = useCouple(userId);

  const [autoShare, setAutoShare] = useState(
    couple?.settings?.autoShareNewMemories ?? false
  );

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    if (!couple) return;

    try {
      setSaving(true);
      await updateSettings({
        autoShareNewMemories: autoShare
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const result = await disconnect();
      setShowDisconnectConfirm(false);
      
      // Navigate to invitations page after successful disconnect
      if (result.success) {
        navigate('/couple/invitations');
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!couple) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-12 text-center max-w-md">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('couple.settings.notConnectedTitle')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('couple.settings.notConnectedMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 active:shadow-inner"
            title={t('couple.invitations.back')}
          >
            <ArrowLeft className="w-5 h-5 text-pink-600" />
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('couple.settings.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('couple.settings.sharingSettings')}
              </p>
            </div>
          </div>

          <CoupleStatusBadge couple={couple} variant="full" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('couple.settings.sharingSettings')}
          </h2>

          <div className="space-y-6">
            {/* Auto Share */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  {t('couple.settings.autoShareTitle')}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('couple.settings.autoShareDesc')}
                </p>
              </div>
              <button
                onClick={() => setAutoShare(!autoShare)}
                className={`
                  relative w-14 h-8 rounded-full transition-colors
                  ${autoShare ? 'bg-pink-500' : 'bg-gray-300'}
                `}
              >
                <div className={`
                  absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform
                  ${autoShare ? 'translate-x-6' : 'translate-x-0'}
                `} />
              </button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                💡 {t('couple.settings.accessNote')}
              </h4>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>{t('couple.settings.accessNoteItem1')}</li>
                <li>{t('couple.settings.accessNoteItem2')}</li>
                <li>{t('couple.settings.accessNoteItem3')}</li>
              </ul>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('couple.settings.saving')}</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{t('couple.settings.saveSettings')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
          <h2 className="text-lg font-semibold text-red-600 mb-4">
            ⚠️ {t('couple.settings.dangerZone')}
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">
              {t('couple.settings.disconnectWarning')}
            </p>
          </div>

          <button
            onClick={() => setShowDisconnectConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <UserMinus className="w-5 h-5" />
            <span>{t('couple.settings.disconnect')}</span>
          </button>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {t('couple.settings.disconnectConfirmTitle')}
              </h2>

              <p className="text-sm text-gray-600 text-center mb-6">
                {t('couple.settings.disconnectConfirmMessage')} <strong>{couple?.partnerName}</strong>?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-900 mb-2">
                  {t('couple.settings.disconnectConfirmWillDo')}
                </h3>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>{t('couple.settings.disconnectItem1')}</li>
                  <li>{couple?.partnerName} {t('couple.settings.disconnectItem2')}</li>
                  <li>{t('couple.settings.disconnectItem3')}</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  disabled={disconnecting}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  {t('couple.settings.cancel')}
                </button>

                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disconnecting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('couple.settings.disconnecting')}</span>
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-5 h-5" />
                      <span>{t('couple.settings.confirmDisconnect')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
