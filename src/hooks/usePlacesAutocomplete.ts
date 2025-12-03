// src/hooks/usePlacesAutocomplete.ts
// FREE OpenStreetMap Nominatim Autocomplete (no API key needed!)

import { useState, useEffect, useRef } from 'react';

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function usePlacesAutocomplete(inputRef: React.RefObject<HTMLInputElement>) {
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search Nominatim API
  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            // Required by Nominatim usage policy
            'User-Agent': 'LoveJournalApp/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      }
    } catch (error) {
      console.error('Nominatim search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debounce
  useEffect(() => {
    if (!inputRef.current) return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce search (500ms)
      debounceTimerRef.current = setTimeout(() => {
        searchPlaces(value);
      }, 500);
    };

    const input = inputRef.current;
    input.addEventListener('input', handleInput);

    return () => {
      input.removeEventListener('input', handleInput);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputRef]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputRef]);

  // Select a place from suggestions
  const selectPlace = (suggestion: NominatimResult) => {
    const result: PlaceResult = {
      address: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      placeId: suggestion.place_id.toString(),
    };
    setPlace(result);
    setShowDropdown(false);
    setSuggestions([]);
    
    // Update input value
    if (inputRef.current) {
      inputRef.current.value = suggestion.display_name;
    }
  };

  const clearPlace = () => setPlace(null);

  return { 
    place, 
    suggestions, 
    isLoading, 
    showDropdown, 
    selectPlace, 
    clearPlace,
    dropdownRef,
    isLoaded: true // Always loaded (no external script needed)
  };
}
