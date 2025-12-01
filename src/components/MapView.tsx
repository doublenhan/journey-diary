import React, { useState, useMemo } from 'react';
import { MapPin, Calendar, X } from 'lucide-react';
import '../styles/MapView.css';

interface Memory {
  id: string;
  title: string;
  date: string;
  text: string;
  location?: string | null;
  images: any[];
}

interface MapViewProps {
  memories: Memory[];
  onMemoryClick?: (memory: Memory) => void;
  onClose: () => void;
}

// Simple coordinate generator based on location string
// In real app, use Google Maps Geocoding API
const getCoordinates = (location: string): { lat: number; lng: number } | null => {
  if (!location) return null;
  
  // Simple hash function to generate consistent coordinates
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    hash = ((hash << 5) - hash) + location.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Vietnam bounds approximately
  const lat = 10 + (Math.abs(hash % 100) / 100) * 12; // 10-22°N
  const lng = 102 + (Math.abs((hash >> 8) % 100) / 100) * 12; // 102-114°E
  
  return { lat, lng };
};

export const MapView: React.FC<MapViewProps> = ({ memories, onMemoryClick, onClose }) => {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [hoveredMemory, setHoveredMemory] = useState<string | null>(null);

  // Filter memories with location and get coordinates
  const memoriesWithLocation = useMemo(() => {
    return memories
      .filter(m => m.location)
      .map(m => ({
        ...m,
        coords: getCoordinates(m.location!)
      }))
      .filter(m => m.coords !== null);
  }, [memories]);

  // Group memories by location
  const groupedByLocation = useMemo(() => {
    const groups: { [key: string]: typeof memoriesWithLocation } = {};
    memoriesWithLocation.forEach(m => {
      const key = m.location!;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [memoriesWithLocation]);

  // Calculate map bounds
  const bounds = useMemo(() => {
    if (memoriesWithLocation.length === 0) {
      return { minLat: 10, maxLat: 22, minLng: 102, maxLng: 114 };
    }
    
    const lats = memoriesWithLocation.map(m => m.coords!.lat);
    const lngs = memoriesWithLocation.map(m => m.coords!.lng);
    
    return {
      minLat: Math.min(...lats) - 1,
      maxLat: Math.max(...lats) + 1,
      minLng: Math.min(...lngs) - 1,
      maxLng: Math.max(...lngs) + 1
    };
  }, [memoriesWithLocation]);

  // Convert lat/lng to SVG coordinates
  const toSvgCoords = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

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
              {memoriesWithLocation.length} memories across {Object.keys(groupedByLocation).length} locations
            </p>
          </div>
          <button className="map-view-close" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="map-view-content">
          {/* Simple SVG Map */}
          <svg 
            className="map-svg" 
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background */}
            <rect width="100" height="100" fill="#f0f9ff" />
            
            {/* Grid lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <React.Fragment key={i}>
                <line 
                  x1={i * 10} y1="0" 
                  x2={i * 10} y2="100" 
                  stroke="#e0f2fe" 
                  strokeWidth="0.1" 
                />
                <line 
                  x1="0" y1={i * 10} 
                  x2="100" y2={i * 10} 
                  stroke="#e0f2fe" 
                  strokeWidth="0.1" 
                />
              </React.Fragment>
            ))}

            {/* Memory markers */}
            {Object.entries(groupedByLocation).map(([location, mems]) => {
              const coords = toSvgCoords(mems[0].coords!.lat, mems[0].coords!.lng);
              const isHovered = mems.some(m => m.id === hoveredMemory);
              const isSelected = mems.some(m => m.id === selectedMemory?.id);
              
              return (
                <g key={location}>
                  {/* Pulse effect */}
                  {(isHovered || isSelected) && (
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r="3"
                      fill="#ec4899"
                      opacity="0.3"
                      className="marker-pulse"
                    />
                  )}
                  
                  {/* Marker */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isHovered || isSelected ? "1.5" : "1"}
                    fill={isSelected ? "#ec4899" : "#3b82f6"}
                    stroke="white"
                    strokeWidth="0.3"
                    className="map-marker"
                    onMouseEnter={() => setHoveredMemory(mems[0].id)}
                    onMouseLeave={() => setHoveredMemory(null)}
                    onClick={() => setSelectedMemory(mems[0])}
                  />
                  
                  {/* Cluster count */}
                  {mems.length > 1 && (
                    <text
                      x={coords.x + 1.5}
                      y={coords.y - 1.5}
                      fontSize="2"
                      fill="#ec4899"
                      fontWeight="bold"
                      className="marker-count"
                    >
                      {mems.length}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Location List */}
          <div className="map-locations-list">
            <h3 className="locations-list-title">Locations</h3>
            <div className="locations-list-items">
              {Object.entries(groupedByLocation).map(([location, mems]) => (
                <div
                  key={location}
                  className={`location-item ${hoveredMemory === mems[0].id ? 'hovered' : ''} ${selectedMemory?.id === mems[0].id ? 'selected' : ''}`}
                  onMouseEnter={() => setHoveredMemory(mems[0].id)}
                  onMouseLeave={() => setHoveredMemory(null)}
                  onClick={() => setSelectedMemory(mems[0])}
                >
                  <MapPin className="w-4 h-4 text-pink-500" />
                  <div className="location-item-content">
                    <div className="location-name">{location}</div>
                    <div className="location-count">{mems.length} {mems.length === 1 ? 'memory' : 'memories'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                <span>{new Date(selectedMemory.date).toLocaleDateString()}</span>
              </div>
              {selectedMemory.location && (
                <div className="memory-detail-meta">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedMemory.location}</span>
                </div>
              )}
              <p className="memory-detail-text">{selectedMemory.text.slice(0, 150)}...</p>
              {onMemoryClick && (
                <button 
                  className="view-memory-btn"
                  onClick={() => onMemoryClick(selectedMemory)}
                >
                  View Full Memory
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
