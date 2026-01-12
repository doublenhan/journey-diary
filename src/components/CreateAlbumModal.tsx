import { useState } from 'react';
import { X, Lock, Globe, Users, Type, Calendar as CalendarIcon, Image as ImageIcon, Palette, Shield } from 'lucide-react';
import { CreateAlbumData } from '../types/album';
import { useLanguage } from '../hooks/useLanguage';
import CustomDatePicker from './CustomDatePicker';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAlbumData) => Promise<void>;
}

function CreateAlbumModal({ isOpen, onClose, onSubmit }: CreateAlbumModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [formData, setFormData] = useState<CreateAlbumData>({
    title: '',
    description: '',
    coverImage: '',
    albumDate: new Date().toISOString().split('T')[0],
    theme: 'modern',
    privacy: 'private'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên album');
      return;
    }

    // Format date from day/month/year
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        albumDate: formattedDate
      });
      // Reset form
      const newToday = new Date();
      setSelectedDay(newToday.getDate());
      setSelectedMonth(newToday.getMonth() + 1);
      setSelectedYear(newToday.getFullYear());
      setFormData({
        title: '',
        description: '',
        coverImage: '',
        albumDate: new Date().toISOString().split('T')[0],
        theme: 'modern',
        privacy: 'private'
      });
      onClose();
    } catch (error) {
      console.error('Error creating album:', error);
    } finally {
      setLoading(false);
    }
  };

  const privacyOptions = [
    { value: 'private', label: t('createAlbum.privacyPrivate'), icon: Lock, desc: t('createAlbum.privacyPrivateDesc') },
    { value: 'shared', label: t('createAlbum.privacyShared'), icon: Users, desc: t('createAlbum.privacySharedDesc') },
    { value: 'public', label: t('createAlbum.privacyPublic'), icon: Globe, desc: t('createAlbum.privacyPublicDesc') }
  ] as const;

  const themeOptions = [
    { value: 'modern', label: 'Modern', gradient: 'from-blue-400 to-purple-500' },
    { value: 'romantic', label: 'Romantic', gradient: 'from-pink-400 to-rose-500' },
    { value: 'classic', label: 'Classic', gradient: 'from-amber-400 to-orange-500' },
    { value: 'minimal', label: 'Minimal', gradient: 'from-gray-400 to-slate-500' }
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp border border-pink-100">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-pink-50 to-rose-50 px-6 py-6 border-b border-pink-100 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {t('createAlbum.title')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('albums.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type className="w-5 h-5 text-pink-500" />
              {t('createAlbum.albumName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('createAlbum.albumNamePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              maxLength={100}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type className="w-5 h-5 text-pink-500" />
              {t('createAlbum.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('createAlbum.descriptionPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
              rows={3}
              maxLength={500}
              disabled={loading}
            />
          </div>

          {/* Album Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <CalendarIcon className="w-5 h-5 text-pink-500" />
              {t('createAlbum.albumDate')}
            </label>
            <CustomDatePicker
              selected={new Date(selectedYear, selectedMonth - 1, selectedDay)}
              onChange={(date) => {
                if (date) {
                  setSelectedYear(date.getFullYear());
                  setSelectedMonth(date.getMonth() + 1);
                  setSelectedDay(date.getDate());
                }
              }}
              placeholder={t('memory.datePlaceholder') || 'Chọn ngày'}
              maxDate={new Date()}
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <ImageIcon className="w-5 h-5 text-pink-500" />
              {t('createAlbum.coverImage')}
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
              {formData.coverImage && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img 
                    src={formData.coverImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('createAlbum.coverImageHint')}
            </p>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Palette className="w-5 h-5 text-pink-500" />
              {t('createAlbum.theme')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {themeOptions.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: theme.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.theme === theme.value
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <div className={`h-12 rounded-lg bg-gradient-to-r ${theme.gradient} mb-2`} />
                  <p className="text-sm font-medium text-gray-700">{theme.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="w-5 h-5 text-pink-500" />
              {t('createAlbum.privacy')}
            </label>
            <div className="space-y-2">
              {privacyOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, privacy: option.value })}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      formData.privacy === option.value
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${
                        formData.privacy === option.value ? 'text-pink-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? t('createAlbum.creating') : t('albums.createAlbum')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAlbumModal;
