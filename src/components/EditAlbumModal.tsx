import { useState, useEffect } from 'react';
import { X, Lock, Globe, Users, Type, Calendar as CalendarIcon, Image as ImageIcon, Palette, Shield, Check } from 'lucide-react';
import { Album, UpdateAlbumData } from '../types/album';
import { useLanguage } from '../hooks/useLanguage';
import CustomDatePicker from './CustomDatePicker';

interface EditAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateAlbumData) => Promise<void>;
  album: Album | null;
  albumMemories?: Array<{ id: string; photos?: string[]; title: string }>;
}

function EditAlbumModal({ isOpen, onClose, onSubmit, album, albumMemories = [] }: EditAlbumModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  
  // Date state
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [formData, setFormData] = useState<UpdateAlbumData>({
    title: '',
    description: '',
    coverImage: '',
    albumDate: '',
    theme: 'modern',
    privacy: 'private'
  });

  // Initialize form with album data when modal opens
  useEffect(() => {
    if (album && isOpen) {
      setFormData({
        title: album.title,
        description: album.description || '',
        coverImage: album.coverImage || '',
        albumDate: album.albumDate || '',
        theme: album.theme || 'modern',
        privacy: album.privacy
      });
      
      // Parse album date if exists
      if (album.albumDate) {
        // Parse date string directly to avoid timezone issues
        // Format: YYYY-MM-DD
        const [year, month, day] = album.albumDate.split('-').map(Number);
        setSelectedDay(day);
        setSelectedMonth(month);
        setSelectedYear(year);
      } else {
        // Reset to today if no albumDate
        const today = new Date();
        setSelectedDay(today.getDate());
        setSelectedMonth(today.getMonth() + 1);
        setSelectedYear(today.getFullYear());
      }
    }
  }, [album, isOpen]);

  if (!isOpen || !album) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
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
      onClose();
    } catch (error) {
      console.error('Error updating album:', error);
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
              {t('albums.editAlbum')}
            </h2>
            <p className="text-sm text-gray-600">
              Chỉnh sửa thông tin album
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
            
            {/* Current Cover Preview */}
            {formData.coverImage && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-pink-200">
                <img 
                  src={formData.coverImage} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImage: '' })}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Select from memories */}
            {albumMemories.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCoverOptions(!showCoverOptions)}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg text-purple-700 font-medium hover:from-purple-100 hover:to-pink-100 transition-all"
                >
                  {showCoverOptions ? 'Ẩn lựa chọn' : 'Chọn từ memories trong album'}
                </button>

                {showCoverOptions && (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                    {albumMemories.map((memory) => {
                      const memoryPhotos = memory.photos || [];
                      return memoryPhotos.map((photo, idx) => (
                        <div
                          key={`${memory.id}-${idx}`}
                          onClick={() => {
                            setFormData({ ...formData, coverImage: photo });
                            setShowCoverOptions(false);
                          }}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 border-transparent hover:border-pink-500 transition-all"
                        >
                          <img 
                            src={photo} 
                            alt={memory.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                          {formData.coverImage === photo && (
                            <div className="absolute inset-0 bg-pink-500/30 flex items-center justify-center">
                              <div className="p-1.5 bg-pink-500 rounded-full">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ));
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Manual URL input fallback */}
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="Hoặc nhập URL ảnh..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-sm"
                disabled={loading}
              />
            </div>
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
              disabled={loading || !formData.title?.trim()}
            >
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAlbumModal;
