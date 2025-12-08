import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { MapPin, Calendar, X, Loader, Flame, Route } from 'lucide-react';
import { getMemoriesWithCoordinates, MemoryFirestore } from '../utils/memoryFirestore';
import { useLanguage } from '../hooks/useLanguage';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import '../styles/MapView.css';

// Fix Leaflet default marker icon issue with Vite
import L from 'leaflet';

// Use CDN URLs instead of importing images to avoid Vite/TypeScript issues
const markerIcon2x = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// @ts-ignore - Leaflet icon path fix
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  userId: string;
  onClose: () => void;
}

type ViewMode = 'markers' | 'heatmap' | 'route';

// Component to add heat map layer
function HeatMapLayer({ memories }: { memories: MemoryFirestore[] }) {
  const map = useMap();
  
  useEffect(() => {
    const heatData = memories
      .filter(m => m.coordinates)
      .map(m => [m.coordinates!.latitude, m.coordinates!.longitude, 0.8] as [number, number, number]);
    
    if (heatData.length > 0 && (L as any).heatLayer) {
      const heatLayer = (L as any).heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.0: '#3b82f6',
          0.3: '#8b5cf6',
          0.5: '#ec4899',
          0.7: '#f43f5e',
          1.0: '#ef4444'
        }
      });
      
      heatLayer.addTo(map);
      
      return () => {
        map.removeLayer(heatLayer);
      };
    }
  }, [memories, map]);
  
  return null;
}

// Component to fit map bounds to markers
function FitBounds({ coordinates }: { coordinates: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [coordinates, map]);
  
  return null;
}

export const MapView: React.FC<MapViewProps> = ({ userId, onClose }) => {
  const { t } = useLanguage();
  const [memories, setMemories] = useState<MemoryFirestore[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryFirestore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('markers');

  useEffect(() => {
    const fetchMemories = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getMemoriesWithCoordinates(userId);
        // Sort by date for route visualization
        const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setMemories(sortedData);
        
        if (sortedData.length === 0) {
          setError(t('errors.noMemoriesWithCoordinates'));
        }
      } catch (err) {
        console.error('Failed to fetch memories:', err);
        setError(t('errors.cannotLoadMemories'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemories();
  }, [userId]);

  // Group memories by location
  const groupedByLocation = memories.reduce((acc, memory) => {
    if (!memory.coordinates) return acc;
    
    const key = `${memory.coordinates.latitude},${memory.coordinates.longitude}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(memory);
    return acc;
  }, {} as Record<string, MemoryFirestore[]>);

  const coordinates = memories
    .filter(m => m.coordinates)
    .map(m => ({ lat: m.coordinates!.latitude, lng: m.coordinates!.longitude }));

  // Route line coordinates (chronological order)
  const routeCoordinates: [number, number][] = memories
    .filter(m => m.coordinates)
    .map(m => [m.coordinates!.latitude, m.coordinates!.longitude]);

  const defaultCenter: [number, number] = coordinates.length > 0
    ? [coordinates[0].lat, coordinates[0].lng]
    : [21.0285, 105.8542]; // Hanoi default

  return (
    <div className="map-view-overlay">
      <div className="map-view-container">
        <div className="map-view-header">
          <div className="map-header-top-row">
            <div className="map-header-title-section">
              <h2 className="map-view-title">
                <MapPin className="w-6 h-6" />
                Memory Map
              </h2>
              <p className="map-view-subtitle">
                {isLoading ? 'Đang tải...' : `${memories.length} memories trên bản đồ`}
              </p>
            </div>
            <button className="map-view-close" onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* View Mode Toggle - Separate row */}
          {!isLoading && !error && (
            <div className="view-mode-toggle">
              <button
                onClick={() => setViewMode('markers')}
                className={`view-mode-btn ${viewMode === 'markers' ? 'active' : ''}`}
                title="Markers"
              >
                <MapPin className="w-4 h-4" />
                <span className="view-mode-label">Markers</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`view-mode-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
                title="Heat Map"
              >
                <Flame className="w-4 h-4" />
                <span className="view-mode-label">Heat</span>
              </button>
              <button
                onClick={() => setViewMode('route')}
                className={`view-mode-btn ${viewMode === 'route' ? 'active' : ''}`}
                title="Route"
              >
                <Route className="w-4 h-4" />
                <span className="view-mode-label">Route</span>
              </button>
            </div>
          )}
        </div>

        <div className="map-view-content" style={{ position: 'relative' }}>
          {isLoading ? (
            <div className="map-loading">
              <Loader className="w-8 h-8 animate-spin" style={{ color: '#ec4899' }} />
              <p>Đang tải bản đồ...</p>
            </div>
          ) : error ? (
            <div className="map-error">
              <MapPin className="w-12 h-12" style={{ color: '#ef4444' }} />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Map Container */}
              <div className="map-container">
                <MapContainer
                  center={defaultCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%', borderRadius: '12px', minHeight: '500px' }}
                  scrollWheelZoom={true}
                >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <FitBounds coordinates={coordinates} />
                
                {/* Heat Map Layer */}
                {viewMode === 'heatmap' && <HeatMapLayer memories={memories} />}
                
                {/* Route Polyline */}
                {viewMode === 'route' && routeCoordinates.length > 1 && (
                  <Polyline
                    positions={routeCoordinates}
                    pathOptions={{
                      color: '#ec4899',
                      weight: 3,
                      opacity: 0.7,
                      dashArray: '10, 10',
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                )}
                
                {/* Markers */}
                {(viewMode === 'markers' || viewMode === 'route') && Object.entries(groupedByLocation).map(([key, mems]) => {
                  const memory = mems[0];
                  if (!memory.coordinates) return null;
                  
                  return (
                    <Marker
                      key={key}
                      position={[memory.coordinates.latitude, memory.coordinates.longitude]}
                      eventHandlers={{
                        click: () => setSelectedMemory(memory)
                      }}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <h3 style={{ margin: '0 0 0.5rem', fontWeight: '600' }}>
                            {memory.title}
                          </h3>
                          {memory.location && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                              📍 {memory.location}
                            </p>
                          )}
                          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                            📅 {new Date(memory.date).toLocaleDateString('vi-VN')}
                          </p>
                          {mems.length > 1 && (
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#ec4899', fontWeight: '600' }}>
                              +{mems.length - 1} memories khác tại đây
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              </div>

              {/* Location List */}
              <div className="map-locations-list">
                <h3 className="locations-list-title">Địa điểm ({Object.keys(groupedByLocation).length})</h3>
                <div className="locations-list-items">
                  {Object.entries(groupedByLocation).map(([key, mems]) => (
                    <div
                      key={key}
                      className={`location-item ${selectedMemory?.id === mems[0].id ? 'selected' : ''}`}
                      onClick={() => setSelectedMemory(mems[0])}
                    >
                      <MapPin className="w-4 h-4 text-pink-500" />
                      <div className="location-item-content">
                        <div className="location-name">{mems[0].location || 'Không có tên'}</div>
                        <div className="location-count">{mems.length} {mems.length === 1 ? 'memory' : 'memories'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Selected Memory Detail */}
        {selectedMemory && (
          <div className="map-memory-detail">
            <div className="memory-detail-header">
              <h3>{selectedMemory.title}</h3>
              <button onClick={() => setSelectedMemory(null)}>×</button>
            </div>
            <div className="memory-detail-content">
              <div className="memory-detail-meta">
                <Calendar className="w-4 h-4" />
                <span>{new Date(selectedMemory.date).toLocaleDateString('vi-VN')}</span>
              </div>
              {selectedMemory.location && (
                <div className="memory-detail-meta">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedMemory.location}</span>
                </div>
              )}
              <p className="memory-detail-text">{selectedMemory.text.slice(0, 150)}...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
