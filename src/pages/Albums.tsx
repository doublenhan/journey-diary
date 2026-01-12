import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  BookOpen, 
  Plus, 
  Image as ImageIcon, 
  Calendar,
  ArrowLeft,
  Trash2,
  Edit3,
  Lock,
  Globe,
  Users,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Play,
  Share2
} from 'lucide-react';
import { Album, CreateAlbumData } from '../types/album';
import { albumsApi } from '../apis/albumsApi';
import { auth } from '../firebase/firebaseConfig';
import { useToastContext } from '../contexts/ToastContext';
import { useLanguage } from '../hooks/useLanguage';
import { MoodTheme } from '../config/themes';
import CreateAlbumModal from '../components/CreateAlbumModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import AlbumCardSkeleton from '../components/AlbumCardSkeleton';
import AlbumSlideshowModal from '../components/AlbumSlideshowModal';
import ShareAlbumModal from '../components/ShareAlbumModal';

interface AlbumsPageProps {
  onBack?: () => void;
  currentTheme?: MoodTheme;
}

function AlbumsPage({ onBack }: AlbumsPageProps) {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const { t } = useLanguage();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; albumId: string | null }>({
    show: false,
    albumId: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTheme] = useState<string>('all'); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [filterPrivacy, setFilterPrivacy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'count' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSlideshow, setShowSlideshow] = useState<{ show: boolean; albumId: string | null }>({ 
    show: false, 
    albumId: null 
  });
  const [showShareModal, setShowShareModal] = useState<{ 
    show: boolean; 
    albumId: string | null;
    albumTitle: string;
    privacy: string;
  }>({ 
    show: false, 
    albumId: null,
    albumTitle: '',
    privacy: 'private'
  });

  useEffect(() => {
    console.log('[Albums] Component mounted, setting up auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[Albums] Auth state changed, user:', user?.uid);
      if (user) {
        loadAlbums();
      } else {
        console.log('[Albums] No user, stopping loading');
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAlbums = async () => {
    const currentUser = auth.currentUser;
    console.log('[Albums] loadAlbums called, currentUser:', currentUser?.uid);
    
    if (!currentUser) {
      console.log('[Albums] No current user, skipping load');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('[Albums] Calling albumsApi.getAll...');
      const data = await albumsApi.getAll(currentUser.uid);
      console.log('[Albums] Got data:', data);
      setAlbums(data);
    } catch (err) {
      console.error('[Albums] Error loading albums:', err);
      error(t('albums.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    try {
      await albumsApi.delete(albumId);
      setAlbums(albums.filter(a => a.id !== albumId));
      success(t('albums.deleted'));
      setDeleteConfirm({ show: false, albumId: null });
    } catch (err) {
      error(t('albums.errorDelete'));
    }
  };

  // Filter and sort albums
  const filteredAndSortedAlbums = useMemo(() => {
    let filtered = albums;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(album =>
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Theme filter
    if (filterTheme !== 'all') {
      filtered = filtered.filter(album => album.theme === filterTheme);
    }

    // Privacy filter
    if (filterPrivacy !== 'all') {
      filtered = filtered.filter(album => album.privacy === filterPrivacy);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          const aDate = a.albumDate || (a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt);
          const bDate = b.albumDate || (b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt);
          comparison = aDate.localeCompare(bDate);
          break;
        case 'count':
          comparison = a.memoryIds.length - b.memoryIds.length;
          break;
        case 'updated':
          const aUpdated = a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt;
          const bUpdated = b.updatedAt instanceof Date ? b.updatedAt.toISOString() : b.updatedAt;
          comparison = aUpdated.localeCompare(bUpdated);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [albums, searchQuery, filterTheme, filterPrivacy, sortBy, sortOrder]);

  const handleCreateAlbum = async (data: CreateAlbumData) => {
    if (!auth.currentUser) return;
    
    try {
      const newAlbum = await albumsApi.create(auth.currentUser.uid, data);
      setAlbums([newAlbum, ...albums]);
      success(t('albums.created'));
    } catch (err) {
      error(t('albums.errorCreate'));
      throw err;
    }
  };

  const getPrivacyIcon = (privacy: Album['privacy']) => {
    switch (privacy) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'shared': return <Users className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mt-20">
            {[...Array(8)].map((_, i) => (
              <AlbumCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack || (() => navigate('/landing'))}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 active:shadow-inner mb-4"
            title={t('common.back')}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('albums.title')}
                  </h1>
                </div>
                <p className="text-gray-600 text-sm sm:text-base ml-14">{t('albums.subtitle')}</p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{t('albums.createAlbum')}</span>
                <span className="sm:hidden">Tạo Album</span>
              </button>
            </div>

            {/* Search, Filter, Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm album..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm appearance-none bg-white"
                >
                  <option value="updated-desc">Mới cập nhật</option>
                  <option value="updated-asc">Cũ nhất</option>
                  <option value="date-desc">Ngày gần nhất</option>
                  <option value="date-asc">Ngày xa nhất</option>
                  <option value="name-asc">Tên A-Z</option>
                  <option value="name-desc">Tên Z-A</option>
                  <option value="count-desc">Nhiều ảnh nhất</option>
                  <option value="count-asc">Ít ảnh nhất</option>
                </select>
              </div>

              {/* Filter */}
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterPrivacy}
                  onChange={(e) => setFilterPrivacy(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm appearance-none bg-white"
                >
                  <option value="all">Tất cả quyền riêng tư</option>
                  <option value="private">Riêng tư</option>
                  <option value="shared">Chia sẻ</option>
                  <option value="public">Công khai</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Albums Grid */}
        {filteredAndSortedAlbums.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {t('albums.emptyTitle')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('albums.emptyDescription')}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {t('albums.createAlbum')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {filteredAndSortedAlbums.map((album) => {
              // Auto cover image: get first photo from first memory if no cover
              const coverImage = album.coverImage || null;

              return (
                <div
                  key={album.id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                >
                {/* Cover Image */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 overflow-hidden">
                  {coverImage ? (
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="p-4 bg-white/30 backdrop-blur-sm rounded-2xl">
                        <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400" />
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    {/* Share button - only for shared/public albums */}
                    {(album.privacy === 'shared' || album.privacy === 'public') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareModal({ 
                            show: true, 
                            albumId: album.id,
                            albumTitle: album.title,
                            privacy: album.privacy
                          });
                        }}
                        className="p-3 bg-white/95 backdrop-blur-sm rounded-full hover:bg-blue-500 hover:scale-110 transition-all shadow-lg group/share"
                      >
                        <Share2 className="w-5 h-5 text-blue-600 group-hover/share:text-white transition-colors" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/albums/${album.id}`);
                      }}
                      className="p-3 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all shadow-lg"
                    >
                      <Edit3 className="w-5 h-5 text-purple-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ show: true, albumId: album.id });
                      }}
                      className="p-3 bg-white/95 backdrop-blur-sm rounded-full hover:bg-red-500 hover:scale-110 transition-all shadow-lg group/delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 group-hover/delete:text-white transition-colors" />
                    </button>
                    {album.memoryIds.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSlideshow({ show: true, albumId: album.id });
                        }}
                        className="p-3 bg-white/95 backdrop-blur-sm rounded-full hover:bg-purple-500 hover:scale-110 transition-all shadow-lg group/play"
                      >
                        <Play className="w-5 h-5 text-purple-600 group-hover/play:text-white transition-colors" />
                      </button>
                    )}
                  </div>

                  {/* Memory Count Badge - Enhanced */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center gap-1.5 shadow-lg">
                    <ImageIcon className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-sm font-bold">{album.memoryIds.length}</span>
                  </div>

                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-md">
                    {getPrivacyIcon(album.privacy)}
                  </div>
                </div>

                {/* Album Info */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-1.5 line-clamp-1 group-hover:text-purple-600 transition-colors">
                    {album.title}
                  </h3>
                  {album.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                      {album.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <div className="text-gray-400">
                      {album.memoryIds.length} memories
                    </div>
                    {album.albumDate ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                        <span>{(() => {
                          const [year, month, day] = album.albumDate.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                        })()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                        <span>{new Date(album.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      <CreateAlbumModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAlbum}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, albumId: null })}
        onConfirm={() => {
          if (deleteConfirm.albumId) {
            handleDeleteAlbum(deleteConfirm.albumId);
          }
        }}
        title={t('albums.deleteTitle') || 'Xóa Album'}
        message={t('albums.deleteConfirm') || 'Bạn có chắc chắn muốn xóa album này? Hành động này không thể hoàn tác.'}
        confirmText={t('common.delete') || 'Xóa'}
        cancelText={t('common.cancel') || 'Hủy'}
      />

      {/* Album Slideshow Modal */}
      <AlbumSlideshowModal
        isOpen={showSlideshow.show}
        onClose={() => setShowSlideshow({ show: false, albumId: null })}
        albumId={showSlideshow.albumId}
      />
      {/* Share Album Modal */}
      <ShareAlbumModal
        isOpen={showShareModal.show}
        onClose={() => setShowShareModal({ show: false, albumId: null, albumTitle: '', privacy: 'private' })}
        albumId={showShareModal.albumId || ''}
        albumTitle={showShareModal.albumTitle}
        privacy={showShareModal.privacy}
      />    </div>
  );
}

export default AlbumsPage;
