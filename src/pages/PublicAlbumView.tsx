import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { BookOpen, Lock, AlertCircle } from 'lucide-react';
import AlbumSlideshowModal from '../components/AlbumSlideshowModal';

const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';
const ALBUMS_COLLECTION = `${ENV_PREFIX}albums`;

interface Album {
  id: string;
  title: string;
  description?: string;
  privacy: string;
  memoryIds: string[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PublicAlbumView() {
  const { albumId } = useParams<{ albumId: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSlideshow, setShowSlideshow] = useState(false);

  useEffect(() => {
    const loadAlbum = async () => {
      if (!albumId) {
        setError('Album ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const albumDoc = await getDoc(doc(db, ALBUMS_COLLECTION, albumId));
        
        if (!albumDoc.exists()) {
          setError('Album not found');
          setLoading(false);
          return;
        }

        const albumData = { id: albumDoc.id, ...albumDoc.data() } as Album;
        
        // Check if album is public or shared
        if (albumData.privacy === 'private') {
          setError('This album is private');
          setLoading(false);
          return;
        }

        setAlbum(albumData);
        // Auto-open slideshow
        setShowSlideshow(true);
      } catch (err) {
        console.error('Error loading album:', err);
        setError('Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [albumId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading album...</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {error === 'This album is private' ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Private Album</h2>
              <p className="text-gray-600 mb-6">
                This album is set to private and cannot be viewed.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Album Not Found</h2>
              <p className="text-gray-600 mb-6">
                {error || 'The album you are looking for does not exist.'}
              </p>
            </>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{album.title}</h1>
              {album.description && (
                <p className="text-sm text-gray-600 mt-1">{album.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {album.coverImage ? (
            <div className="mb-6">
              <img 
                src={album.coverImage} 
                alt={album.title}
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-16 h-16 text-purple-600" />
            </div>
          )}
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{album.title}</h2>
          {album.description && (
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">{album.description}</p>
          )}
          
          <div className="flex items-center justify-center gap-4 mb-6 text-sm text-gray-500">
            <span>{album.memoryIds.length} {album.memoryIds.length === 1 ? 'memory' : 'memories'}</span>
            <span>•</span>
            <span className="capitalize">{album.privacy} album</span>
          </div>

          <button
            onClick={() => setShowSlideshow(true)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all text-lg font-semibold"
          >
            View Album Slideshow
          </button>
        </div>
      </div>

      {/* Slideshow Modal */}
      <AlbumSlideshowModal
        isOpen={showSlideshow}
        onClose={() => setShowSlideshow(false)}
        albumId={albumId || ''}
      />
    </div>
  );
}
