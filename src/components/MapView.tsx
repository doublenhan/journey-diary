import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { MapPin, Calendar, X, Loader, Flame, Route } from 'lucide-react';
import { getMemoriesWithCoordinates, MemoryFirestore } from '../utils/memoryFirestore';
import { useLanguage } from '../hooks/useLanguage';
import { calculateRoute } from '../services/geoService';
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

export const MapView: React.FC<MapViewProps> = ({ userId, onClose }) => {
  const { t } = useLanguage();
  const [memories, setMemories] = useState<MemoryFirestore[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryFirestore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('markers');
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);

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

  // Fetch actual route using OSRM when in route mode (V3.0: direct API)
  useEffect(() => {
    const fetchRoute = async () => {
      if (viewMode !== 'route' || memories.length < 2) {
        setRouteGeometry([]);
        return;
      }

      // Build coordinates array for OSRM [longitude, latitude]
      const coordinates: [number, number][] = memories
        .filter(m => m.coordinates)
        .map(m => [m.coordinates!.lng, m.coordinates!.lat]);
      
      if (coordinates.length < 2) return;
      
      try {
        // Use direct OSRM API (no proxy needed)
        const data = await calculateRoute(coordinates);
        
        if (data.routes && data.routes[0] && data.routes[0].geometry) {
          // Convert GeoJSON coordinates [lon, lat] to Leaflet coordinates [lat, lon]
          const geometry: [number, number][] = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );
          setRouteGeometry(geometry);
        }
      } catch (err) {
        console.error('Failed to fetch route, using straight line fallback:', err);
        // Fallback to straight lines if routing fails
        const straightLine: [number, number][] = memories
          .filter(m => m.coordinates)
          .map(m => [m.coordinates!.lat, m.coordinates!.lng]);
        setRouteGeometry(straightLine);
      }
    };

    fetchRoute();
  }, [viewMode, memories]);

  // Group memories by location
  const groupedByLocation = memories.reduce((acc, memory) => {
    if (!memory.coordinates) return acc;
    
    const key = `${memory.coordinates.lat},${memory.coordinates.lng}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(memory);
    return acc;
  }, {} as Record<string, MemoryFirestore[]>);

  const coordinates = memories
    .filter(m => m.coordinates)
    .map(m => ({ lat: m.coordinates!.lat, lng: m.coordinates!.lng }));

  // Route line coordinates (chronological order)
  const routeCoordinates: [number, number][] = memories
    .filter(m => m.coordinates)
    .map(m => [m.coordinates!.lat, m.coordinates!.lng]);

  const defaultCenter: [number, number] = coordinates.length > 0
    ? [coordinates[0].lat, coordinates[0].lng]
    : [21.0285, 105.8542]; // Hanoi default

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-[fade-in_0.3s_ease]">
      <div className="bg-white rounded-3xl w-full max-w-[1200px] max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideUp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] overflow-hidden">
        <div className="flex flex-col gap-4 px-8 py-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-pink-500" />
                {t('map.title')}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {isLoading ? t('common.loading') : `${memories.length} ${t('map.subtitle')}`}
              </p>
            </div>
            <button className="w-10 h-10 rounded-full border-none bg-gray-100 text-gray-500 cursor-pointer transition-all duration-200 ease-in-out flex items-center justify-center hover:bg-pink-500 hover:text-white hover:scale-110" onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* View Mode Toggle - Separate row */}
          {!isLoading && !error && (
            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg shadow-sm w-full sm:max-w-md sm:gap-2">
              <button
                onClick={() => setViewMode('markers')}
                className={`flex-1 px-2 py-2 rounded-md border-none cursor-pointer flex items-center justify-center gap-1 text-sm font-medium transition-all duration-200 sm:px-3 sm:gap-2 ${
                  viewMode === 'markers' ? 'bg-pink-500 text-white' : 'bg-transparent text-gray-500'
                }`}
                title={t('map.viewModes.markers')}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{t('map.viewModes.markers')}</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`flex-1 px-2 py-2 rounded-md border-none cursor-pointer flex items-center justify-center gap-1 text-sm font-medium transition-all duration-200 sm:px-3 sm:gap-2 ${
                  viewMode === 'heatmap' ? 'bg-pink-500 text-white' : 'bg-transparent text-gray-500'
                }`}
                title={t('map.viewModes.heat')}
              >
                <Flame className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{t('map.viewModes.heat')}</span>
              </button>
              <button
                onClick={() => setViewMode('route')}
                className={`flex-1 px-2 py-2 rounded-md border-none cursor-pointer flex items-center justify-center gap-1 text-sm font-medium transition-all duration-200 sm:px-3 sm:gap-2 ${
                  viewMode === 'route' ? 'bg-pink-500 text-white' : 'bg-transparent text-gray-500'
                }`}
                title={t('map.viewModes.route')}
              >
                <Route className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{t('map.viewModes.route')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-[1fr_300px] gap-6 px-8 py-6 overflow-hidden min-h-0 lg:grid-cols-[1fr_350px] lg:gap-8 max-md:grid-cols-1 max-md:grid-rows-[1fr_auto] max-md:h-[calc(100vh-160px)] max-md:px-4 max-md:gap-4" style={{ position: 'relative' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[500px] gap-4 text-gray-500">
              <Loader className="w-8 h-8 animate-spin" style={{ color: '#ec4899' }} />
              <p>{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[500px] gap-4 text-red-500">
              <MapPin className="w-12 h-12" style={{ color: '#ef4444' }} />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Map Container */}
              <div className="relative flex flex-col min-h-0 h-full">
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
                
                {/* Route Polyline - Using actual road routing */}
                {viewMode === 'route' && routeGeometry.length > 1 && (
                  <Polyline
                    positions={routeGeometry}
                    pathOptions={{
                      color: '#ec4899',
                      weight: 4,
                      opacity: 0.8,
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
                      position={[memory.coordinates.lat, memory.coordinates.lng]}
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
                              +{mems.length - 1} {t('map.otherMemories')}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              
              {/* Selected Memory Detail - Inside map container */}
              {selectedMemory && (
                <div className="absolute bottom-4 left-4 w-80 max-h-[200px] bg-white rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-[slideUp_0.3s_ease] overflow-y-auto z-[1000] max-md:left-2 max-md:bottom-2 max-md:w-[calc(100%-1rem)] max-md:max-w-none max-md:max-h-[150px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-800 m-0">{selectedMemory.title}</h3>
                    <button 
                      onClick={() => setSelectedMemory(null)}
                      className="w-7 h-7 rounded-full border-none bg-gray-100 text-gray-500 cursor-pointer text-xl leading-none"
                    >×</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-gray-500 text-[0.8125rem]">
                      <Calendar className="w-4 h-4 text-pink-500" />
                      <span>{new Date(selectedMemory.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {selectedMemory.location && (
                      <div className="flex items-center gap-2 text-gray-500 text-[0.8125rem]">
                        <MapPin className="w-4 h-4 text-pink-500" />
                        <span>{selectedMemory.location}</span>
                      </div>
                    )}
                    <p className="text-gray-600 text-[0.8125rem] leading-relaxed m-0">{selectedMemory.text.slice(0, 150)}...</p>
                  </div>
                </div>
              )}
              </div>

              {/* Location List */}
              <div className="flex flex-col overflow-y-auto max-h-full min-h-0 max-md:max-h-[180px] max-md:min-h-[180px] max-md:relative max-md:border-t-2 max-md:border-gray-200 max-md:pt-4 max-md:bg-white">
                <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-pink-100 flex-shrink-0">Địa điểm ({Object.keys(groupedByLocation).length})</h3>
                <div className="flex flex-col gap-2">
                  {Object.entries(groupedByLocation).map(([key, mems]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedMemory?.id === mems[0].id 
                          ? 'bg-pink-100 border-pink-500' 
                          : 'bg-gray-50 border-transparent hover:bg-pink-50 hover:border-pink-200 hover:translate-x-1'
                      }`}
                      onClick={() => setSelectedMemory(mems[0])}
                    >
                      <MapPin className="w-4 h-4 text-pink-500" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{mems[0].location || t('map.noLocation')}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{mems.length} {t('map.memoryCount')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
