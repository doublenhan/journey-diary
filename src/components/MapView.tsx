import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Calendar, X, Loader } from 'lucide-react';
import { getMemoriesWithCoordinates, MemoryFirestore } from '../utils/memoryFirestore';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';

// Fix Leaflet default marker icon issue with Vite
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  userId: string;
  onClose: () => void;
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
  const [memories, setMemories] = useState<MemoryFirestore[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryFirestore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemories = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getMemoriesWithCoordinates(userId);
        setMemories(data);
        
        if (data.length === 0) {
          setError('Chưa có kỷ niệm nào với tọa độ. Hãy tạo memory mới với GPS!');
        }
      } catch (err) {
        console.error('Failed to fetch memories:', err);
        setError('Không thể tải memories. Vui lòng thử lại.');
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

  const defaultCenter: [number, number] = coordinates.length > 0
    ? [coordinates[0].lat, coordinates[0].lng]
    : [21.0285, 105.8542]; // Hanoi default

  return (
    <div className="map-view-overlay">
      <div className="map-view-container">
        <div className="map-view-header">
          <div>
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
              {/* Leaflet Map */}
              <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <FitBounds coordinates={coordinates} />
                
                {/* Markers */}
                {Object.entries(groupedByLocation).map(([key, mems]) => {
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
