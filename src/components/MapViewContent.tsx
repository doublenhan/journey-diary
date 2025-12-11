import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { MapPin, Calendar, Loader } from 'lucide-react';
import { MemoryFirestore } from '../utils/memoryFirestore';
import { useLanguage } from '../hooks/useLanguage';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

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

type ViewMode = 'markers' | 'heatmap' | 'route';

// Component to add heat map layer
function HeatMapLayer({ memories }: { memories: MemoryFirestore[] }) {
  const map = useMap();
  
  useEffect(() => {
    const heatData = memories
      .filter(m => m.coordinates)
      .map(m => [m.coordinates!.lat, m.coordinates!.lng, 0.8] as [number, number, number]);
    
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

interface MapViewContentProps {
  memories: MemoryFirestore[];
  viewMode: ViewMode;
  routeCoords: [number, number][];
  routeLoading: boolean;
  selectedMemory: MemoryFirestore | null;
  setSelectedMemory: (memory: MemoryFirestore | null) => void;
  groupedByLocation: Record<string, MemoryFirestore[]>;
}

const MapViewContent: React.FC<MapViewContentProps> = ({
  memories,
  viewMode,
  routeCoords,
  routeLoading,
  selectedMemory,
  setSelectedMemory,
  groupedByLocation
}) => {
  const { t } = useLanguage();
  const defaultCenter: [number, number] = [10.8231, 106.6297]; // Ho Chi Minh City
  const coordinates = memories.filter(m => m.coordinates).map(m => m.coordinates!);
  const center = coordinates.length > 0 
    ? [coordinates[0].lat, coordinates[0].lng] as [number, number]
    : defaultCenter;

  return (
    <>
      <div className="map-container">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds coordinates={coordinates} />
          
          {viewMode === 'heatmap' && <HeatMapLayer memories={memories} />}
          
          {viewMode === 'markers' && memories.filter(m => m.coordinates).map((memory) => (
            <Marker
              key={memory.id}
              position={[memory.coordinates!.lat, memory.coordinates!.lng]}
              eventHandlers={{
                click: () => setSelectedMemory(memory),
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                    {memory.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {new Date(memory.date).toLocaleDateString('vi-VN')}
                  </p>
                  {memory.location && (
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      📍 {memory.location}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {viewMode === 'route' && (
            <>
              {routeCoords.length > 0 && (
                <Polyline
                  positions={routeCoords}
                  pathOptions={{
                    color: '#ec4899',
                    weight: 4,
                    opacity: 0.7,
                  }}
                />
              )}
              {memories.filter(m => m.coordinates).map((memory) => (
                <Marker
                  key={memory.id}
                  position={[memory.coordinates!.lat, memory.coordinates!.lng]}
                  eventHandlers={{
                    click: () => setSelectedMemory(memory),
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                        {memory.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {new Date(memory.date).toLocaleDateString('vi-VN')}
                      </p>
                      {memory.location && (
                        <p style={{ fontSize: '12px', color: '#666' }}>
                          📍 {memory.location}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
        
        {routeLoading && (
          <div className="map-loading-overlay">
            <Loader className="w-8 h-8 animate-spin text-pink-500" />
            <p>Đang tính tuyến đường...</p>
          </div>
        )}
        
        {selectedMemory && (
          <div className="memory-detail-popup">
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
                <div className="location-name">{mems[0].location || t('map.noLocation')}</div>
                <div className="location-count">{mems.length} {t('map.memoryCount')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MapViewContent;
