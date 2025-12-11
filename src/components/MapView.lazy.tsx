import React, { useState, useEffect, Suspense, lazy } from 'react';
import { MapPin, Calendar, X, Loader, Flame, Route } from 'lucide-react';
import { getMemoriesWithCoordinates, MemoryFirestore } from '../utils/memoryFirestore';
import { useLanguage } from '../hooks/useLanguage';
import { calculateRoute } from '../services/geoService';
import '../styles/MapView.css';

// Lazy load all leaflet-related modules
const LazyMapContent = lazy(() => import('./MapViewContent'));

interface MapViewProps {
  userId: string;
  onClose: () => void;
}

type ViewMode = 'markers' | 'heatmap' | 'route';

const MapView: React.FC<MapViewProps> = ({ userId, onClose }) => {
  const { t } = useLanguage();
  const [memories, setMemories] = useState<MemoryFirestore[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('markers');
  const [selectedMemory, setSelectedMemory] = useState<MemoryFirestore | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const loadMemories = async () => {
      try {
        const data = await getMemoriesWithCoordinates(userId);
        setMemories(data);
      } catch (error) {
        console.error('Error loading memories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMemories();
  }, [userId]);

  useEffect(() => {
    if (viewMode === 'route' && memories.length > 1) {
      const loadRoute = async () => {
        setRouteLoading(true);
        try {
          // Convert memories to [lng, lat] format for OSRM
          const coordinates: [number, number][] = memories
            .filter(m => m.coordinates)
            .map(m => [m.coordinates!.lng, m.coordinates!.lat]);
          
          if (coordinates.length < 2) {
            setRouteCoords([]);
            return;
          }
          
          const routeData = await calculateRoute(coordinates);
          
          // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
          if (routeData.routes && routeData.routes[0] && routeData.routes[0].geometry) {
            const geometry: [number, number][] = routeData.routes[0].geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]]
            );
            setRouteCoords(geometry);
          } else {
            // Fallback to straight lines
            const straightLine: [number, number][] = memories
              .filter(m => m.coordinates)
              .map(m => [m.coordinates!.lat, m.coordinates!.lng]);
            setRouteCoords(straightLine);
          }
        } catch (error) {
          console.error('Error calculating route:', error);
          // Fallback to straight lines on error
          const straightLine: [number, number][] = memories
            .filter(m => m.coordinates)
            .map(m => [m.coordinates!.lat, m.coordinates!.lng]);
          setRouteCoords(straightLine);
        } finally {
          setRouteLoading(false);
        }
      };
      loadRoute();
    } else {
      setRouteCoords([]);
    }
  }, [viewMode, memories]);

  const groupedByLocation = memories.reduce((acc, memory) => {
    const key = memory.location || 'Không có địa điểm';
    if (!acc[key]) acc[key] = [];
    acc[key].push(memory);
    return acc;
  }, {} as Record<string, MemoryFirestore[]>);

  if (loading) {
    return (
      <div className="map-view-overlay">
        <div className="map-view-container">
          <div className="map-view-header">
            <div className="map-header-top-row">
              <div className="map-header-title-section">
                <h2 className="map-view-title">
                  <MapPin className="w-6 h-6" />
                  {t('map.title')}
                </h2>
                <p className="map-view-subtitle">{t('common.loading')}</p>
              </div>
              <button className="map-view-close" onClick={onClose}>
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="map-loading">
            <Loader className="w-8 h-8 animate-spin" style={{ color: '#ec4899' }} />
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="map-view-overlay">
        <div className="map-view-container">
          <div className="map-view-header">
            <div className="map-header-top-row">
              <div className="map-header-title-section">
                <h2 className="map-view-title">
                  <MapPin className="w-6 h-6" />
                  {t('map.title')}
                </h2>
                <p className="map-view-subtitle">0 {t('map.subtitle')}</p>
              </div>
              <button className="map-view-close" onClick={onClose}>
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="map-error">
            <MapPin className="w-12 h-12" style={{ color: '#ec4899' }} />
            <p>{t('errors.noMemoriesWithCoordinates')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view-overlay">
      <div className="map-view-container">
        <div className="map-view-header">
          <div className="map-header-top-row">
            <div className="map-header-title-section">
              <h2 className="map-view-title">
                <MapPin className="w-6 h-6" />
                {t('map.title')}
              </h2>
              <p className="map-view-subtitle">
                {loading ? t('common.loading') : `${memories.length} ${t('map.subtitle')}`}
              </p>
            </div>
            <button className="map-view-close" onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* View Mode Toggle - Separate row */}
          {!loading && memories.length > 0 && (
            <div className="view-mode-toggle">
              <button
                onClick={() => setViewMode('markers')}
                className={`view-mode-btn ${viewMode === 'markers' ? 'active' : ''}`}
                title={t('map.viewModes.markers')}
              >
                <MapPin className="w-4 h-4" />
                <span className="view-mode-label">{t('map.viewModes.markers')}</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`view-mode-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
                title={t('map.viewModes.heat')}
              >
                <Flame className="w-4 h-4" />
                <span className="view-mode-label">{t('map.viewModes.heat')}</span>
              </button>
              <button
                onClick={() => setViewMode('route')}
                className={`view-mode-btn ${viewMode === 'route' ? 'active' : ''}`}
                title={t('map.viewModes.route')}
              >
                <Route className="w-4 h-4" />
                <span className="view-mode-label">{t('map.viewModes.route')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="map-view-content" style={{ position: 'relative' }}>
          <Suspense 
            fallback={
              <div className="map-loading">
                <Loader className="w-8 h-8 animate-spin" style={{ color: '#ec4899' }} />
                <p>Đang tải bản đồ...</p>
              </div>
            }
          >
            <LazyMapContent
              memories={memories}
              viewMode={viewMode}
              routeCoords={routeCoords}
              routeLoading={routeLoading}
              selectedMemory={selectedMemory}
              setSelectedMemory={setSelectedMemory}
              groupedByLocation={groupedByLocation}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default MapView;
