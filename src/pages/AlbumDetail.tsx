import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Calendar,
  Save,
  X,
  Edit3,
  BookOpen
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Album, AlbumPage, UpdateAlbumData } from '../types/album';
import { albumsApi } from '../apis/albumsApi';
import { Memory as FirebaseMemory, fetchMemories } from '../services/firebaseMemoriesService';
import { auth } from '../firebase/firebaseConfig';
import { useToastContext } from '../contexts/ToastContext';
import { useLanguage } from '../hooks/useLanguage';
import EditAlbumModal from '../components/EditAlbumModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface SortableMemoryItemProps {
  page: AlbumPage;
  memory: FirebaseMemory | null;
  onRemove: (memoryId: string) => void;
}

function SortableMemoryItem({ page, memory, onRemove }: SortableMemoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  if (!memory) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-gray-500">
        Memory không tìm thấy
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group border border-gray-100"
    >
      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-purple-500 transition-colors"
        >
          <GripVertical className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        {/* Memory Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 shadow-md">
          {memory.photos && memory.photos.length > 0 ? (
            <img
              src={memory.photos[0]}
              alt={memory.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
            </div>
          )}
        </div>

        {/* Memory Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-1 truncate group-hover:text-purple-600 transition-colors">
            {memory.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
            {memory.description}
          </p>
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-pink-400" />
              <span>{new Date(memory.date || memory.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
            </div>
            {memory.photos && (
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-purple-400" />
                <span className="font-medium">{memory.photos.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Remove Button - Always visible on mobile, show on hover for desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(memory.id);
          }}
          className="flex-shrink-0 p-2 hover:bg-red-50 rounded-xl self-start transition-all sm:opacity-0 sm:group-hover:opacity-100 bg-red-50 sm:bg-transparent"
          title="Xóa khỏi album"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
        </button>
      </div>
    </div>
  );
}

function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const { t } = useLanguage();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [memories, setMemories] = useState<FirebaseMemory[]>([]);
  const [allMemories, setAllMemories] = useState<FirebaseMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showEditAlbum, setShowEditAlbum] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; memoryId: string | null }>({
    show: false,
    memoryId: null
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    loadAlbumAndMemories();
  }, [albumId]);

  const loadAlbumAndMemories = async () => {
    if (!albumId || !auth.currentUser) return;

    try {
      setLoading(true);
      const [albumData, allMemoriesData] = await Promise.all([
        albumsApi.getById(albumId),
        fetchMemories({ userId: auth.currentUser.uid })
      ]);

      setAlbum(albumData);
      setAllMemories(allMemoriesData);

      // Load memories for this album
      const albumMemories = allMemoriesData.filter(m =>
        albumData.memoryIds.includes(m.id)
      );
      // Sort by album page order
      const sortedMemories = albumData.pages
        .map(page => albumMemories.find(m => m.id === page.memoryId))
        .filter(Boolean) as FirebaseMemory[];
      
      setMemories(sortedMemories);
    } catch (err) {
      error('Không thể tải album');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !album) return;
    if (active.id === over.id) return;

    const oldIndex = album.pages.findIndex(p => p.id === active.id);
    const newIndex = album.pages.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newPages = arrayMove(album.pages, oldIndex, newIndex).map((page, idx) => ({
      ...page,
      order: idx
    }));

    setAlbum({ ...album, pages: newPages });
    setHasChanges(true);

    // Update memories display order
    const reorderedMemories = newPages
      .map(page => memories.find(m => m.id === page.memoryId))
      .filter(Boolean) as FirebaseMemory[];
    setMemories(reorderedMemories);
  };

  const handleAddMemory = async (memoryId: string) => {
    if (!albumId) return;

    try {
      await albumsApi.addMemory(albumId, memoryId);
      await loadAlbumAndMemories();
      success('Đã thêm vào album');
      setShowAddMemory(false);
    } catch (err: any) {
      error(err.message || 'Không thể thêm memory');
    }
  };

  const handleRemoveMemory = async (memoryId: string) => {
    if (!albumId) return;

    try {
      await albumsApi.removeMemory(albumId, memoryId);
      await loadAlbumAndMemories();
      success('Đã xóa khỏi album');
      setDeleteConfirm({ show: false, memoryId: null });
    } catch (err) {
      error('Không thể xóa memory');
    }
  };

  const handleSaveOrder = async () => {
    if (!album || !albumId) return;

    try {
      await albumsApi.reorderPages(albumId, album.pages);
      setHasChanges(false);
      success('Đã lưu thứ tự');
    } catch (err) {
      error('Không thể lưu');
    }
  };

  const handleUpdateAlbum = async (data: UpdateAlbumData) => {
    if (!albumId) return;

    try {
      await albumsApi.update(albumId, data);
      // Reload album data
      const updated = await albumsApi.getById(albumId);
      setAlbum(updated);
      success(t('albums.updated') || 'Đã cập nhật album');
    } catch (err) {
      error(t('albums.errorUpdate') || 'Không thể cập nhật album');
      throw err;
    }
  };

  const availableMemories = allMemories.filter(
    m => !album?.memoryIds.includes(m.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Album không tìm thấy</p>
          <button
            onClick={() => navigate('/albums')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/albums')}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90 active:shadow-inner mb-4"
            title={t('albums.backToAlbums')}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
          </button>

          {/* Album Header Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/50">
            {/* Cover Image Banner (if exists) */}
            {album.coverImage && (
              <div className="relative h-32 sm:h-40 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200">
                <img 
                  src={album.coverImage} 
                  alt={album.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            )}
            
            <div className="p-5 sm:p-6 lg:p-7">
              {/* Title Section */}
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg flex-shrink-0">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 leading-tight">
                    {album.title}
                  </h1>
                  {album.description && (
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{album.description}</p>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-purple-700">{album.memoryIds.length}</span>
                    <span className="text-xs text-purple-600">memories</span>
                  </div>
                  {album.albumDate && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 rounded-full">
                      <Calendar className="w-4 h-4 text-pink-500" />
                      <span className="text-sm font-medium text-pink-700">
                        {(() => {
                          // Parse date string directly to avoid timezone issues
                          const [year, month, day] = album.albumDate.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('vi-VN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          });
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Right aligned on desktop */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowEditAlbum(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-xl hover:from-blue-600 hover:to-blue-700 hover:scale-105 transition-all duration-200 text-sm font-semibold"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{t('common.edit') || 'Chỉnh sửa'}</span>
                  </button>

                  {hasChanges && (
                    <button
                      onClick={handleSaveOrder}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-xl hover:from-green-600 hover:to-green-700 hover:scale-105 transition-all duration-200 text-sm font-semibold animate-pulse"
                    >
                      <Save className="w-4 h-4" />
                      <span>Lưu</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowAddMemory(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white rounded-xl hover:shadow-xl hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 hover:scale-105 transition-all duration-200 text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Memories List with Drag & Drop */}
        {memories.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 sm:p-12 text-center">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl w-fit mx-auto mb-6">
              <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
              Album trống
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
              Thêm memories để bắt đầu tạo album của bạn
            </p>
            <button
              onClick={() => setShowAddMemory(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              <Plus className="w-5 h-5" />
              Thêm Memory Đầu Tiên
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={album.pages.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {album.pages.map((page) => {
                  const memory = memories.find(m => m.id === page.memoryId);
                  return (
                    <SortableMemoryItem
                      key={page.id}
                      page={page}
                      memory={memory || null}
                      onRemove={(memoryId) => setDeleteConfirm({ show: true, memoryId })}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Delete Memory Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, memoryId: null })}
        onConfirm={() => {
          if (deleteConfirm.memoryId) {
            handleRemoveMemory(deleteConfirm.memoryId);
          }
        }}
        title={t('albums.removeConfirm') || 'Xóa Memory'}
        message="Bạn có chắc chắn muốn xóa memory này khỏi album?"
        confirmText={t('common.delete') || 'Xóa'}
        cancelText={t('common.cancel') || 'Hủy'}
      />

      {/* Add Memory Modal */}
      {showAddMemory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Thêm Memory vào Album</h2>
              </div>
              <button
                onClick={() => setShowAddMemory(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-88px)]">
              {availableMemories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl w-fit mx-auto mb-4">
                    <ImageIcon className="w-12 h-12 text-purple-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base">
                    Tất cả memories đã được thêm vào album
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {availableMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 sm:p-4 hover:shadow-lg hover:scale-105 cursor-pointer transition-all duration-200 border border-gray-200"
                      onClick={() => handleAddMemory(memory.id)}
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 shadow-md">
                          {memory.photos && memory.photos.length > 0 ? (
                            <img
                              src={memory.photos[0]}
                              alt={memory.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm sm:text-base text-gray-800 mb-1 truncate">
                            {memory.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                            {memory.description}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-pink-400" />
                            {new Date(memory.date || memory.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {album && (
        <EditAlbumModal
          isOpen={showEditAlbum}
          onClose={() => setShowEditAlbum(false)}
          onSubmit={handleUpdateAlbum}
          album={album}
          albumMemories={memories}
        />
      )}
    </div>
  );
}

export default AlbumDetail;
