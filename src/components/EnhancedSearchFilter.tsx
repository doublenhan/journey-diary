import { useState } from 'react';
import { Search, Filter, X, Calendar, MapPin, Tag, ChevronDown } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';

interface EnhancedSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  availableYears: string[];
  resultCount: number;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  selectedLocation?: string;
  onLocationChange?: (location: string) => void;
  availableLocations?: string[];
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  availableTags?: string[];
}

export function EnhancedSearchFilter({
  searchQuery,
  onSearchChange,
  selectedYear,
  onYearChange,
  availableYears,
  resultCount,
  dateRange,
  onDateRangeChange,
  selectedLocation,
  onLocationChange,
  availableLocations = [],
  selectedTags = [],
  onTagsChange,
  availableTags = []
}: EnhancedSearchFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');

  const handleSearch = (query: string) => {
    onSearchChange(query);
    setHighlightedText(query);
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onYearChange('ALL');
    onDateRangeChange?.({ start: '', end: '' });
    onLocationChange?.('');
    onTagsChange?.([]);
    setHighlightedText('');
  };

  const hasActiveFilters = searchQuery || selectedYear !== 'ALL' || 
    (dateRange?.start || dateRange?.end) || selectedLocation || selectedTags.length > 0;

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange?.(newTags);
  };

  return (
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-3xl p-6 shadow-[0_4px_20px_rgba(236,72,153,0.1)] mb-8">
      <div className="flex gap-4 items-center flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm kỷ niệm (tiêu đề, nội dung, địa điểm...)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full py-3.5 pr-12 pl-14 border-2 border-pink-200 rounded-2xl text-[0.95rem] h-[3.25rem] transition-all duration-300 bg-white focus:outline-none focus:border-pink-500 focus:shadow-[0_0_0_4px_rgba(236,72,153,0.1)]"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-pink-100 border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 text-pink-500 hover:bg-pink-500 hover:text-white hover:scale-110"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          {/* Year Filter */}
          <div className="flex items-center gap-2 bg-white border-2 border-pink-200 rounded-2xl py-3.5 px-4 h-[3.25rem] transition-all duration-300 focus-within:border-pink-500 focus-within:shadow-[0_0_0_4px_rgba(236,72,153,0.1)]">
            <Calendar className="w-[1.125rem] h-[1.125rem] text-pink-500 flex-shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => {
                onYearChange(e.target.value);
              }}
              className="border-none bg-transparent text-sm font-medium text-gray-700 cursor-pointer p-0 outline-none"
            >
              <option value="ALL">Tất cả năm</option>
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 bg-white border-2 border-pink-200 rounded-2xl py-3.5 px-4 h-[3.25rem] text-sm font-medium text-gray-700 cursor-pointer transition-all duration-300 ${
              showAdvanced ? 'bg-gradient-to-br from-pink-500 to-pink-700 border-pink-500 text-white' : 'hover:bg-gradient-to-br hover:from-pink-500 hover:to-pink-700 hover:border-pink-500 hover:text-white'
            }`}
            title="Bộ lọc nâng cao"
          >
            <Filter className={`w-4 h-4 transition-colors duration-300 ${showAdvanced ? 'text-white' : 'text-pink-500'}`} />
            <span>Nâng cao</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 bg-red-100 border-2 border-red-200 rounded-2xl py-2.5 px-4 text-sm font-medium text-red-600 cursor-pointer transition-all duration-300 hover:bg-red-600 hover:border-red-600 hover:text-white"
              title="Xóa tất cả bộ lọc"
            >
              <X className="w-4 h-4" />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t-2 border-pink-100 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 animate-slideUp">
          {/* Date Range */}
          {onDateRangeChange && (
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4" />
                Khoảng thời gian
              </label>
              <div className="flex items-center gap-3">
                <CustomDatePicker
                  selected={dateRange?.start ? (() => {
                    // Parse date string as local date, not UTC
                    const [year, month, day] = dateRange.start.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  })() : null}
                  onChange={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : '';
                    onDateRangeChange({ start: dateStr, end: dateRange?.end || '' });
                  }}
                  placeholder="Từ ngày"
                  maxDate={dateRange?.end ? (() => {
                    const [year, month, day] = dateRange.end.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  })() : undefined}
                  theme={{
                    colors: {
                      primary: '#ec4899',
                      border: '#fbcfe8'
                    }
                  }}
                />
                <span className="text-sm text-gray-500 font-medium flex-shrink-0 whitespace-nowrap">đến</span>
                <CustomDatePicker
                  selected={dateRange?.end ? (() => {
                    const [year, month, day] = dateRange.end.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  })() : null}
                  onChange={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : '';
                    onDateRangeChange({ start: dateRange?.start || '', end: dateStr });
                  }}
                  placeholder="Đến ngày"
                  minDate={dateRange?.start ? (() => {
                    const [year, month, day] = dateRange.start.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  })() : undefined}
                  theme={{
                    colors: {
                      primary: '#ec4899',
                      border: '#fbcfe8'
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Location Filter */}
          {onLocationChange && availableLocations.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4" />
                Địa điểm
              </label>
              <select
                value={selectedLocation || ''}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full py-3 px-4 border-2 border-pink-200 rounded-xl text-sm bg-white cursor-pointer transition-all duration-300 overflow-hidden text-ellipsis whitespace-nowrap focus:outline-none focus:border-pink-500 focus:shadow-[0_0_0_4px_rgba(236,72,153,0.1)]"
              >
                <option value="">Tất cả địa điểm</option>
                {availableLocations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags Filter */}
          {onTagsChange && availableTags.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center gap-1 py-2 px-3.5 bg-white border-2 border-pink-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer transition-all duration-200 ${
                      selectedTags.includes(tag) 
                        ? 'bg-gradient-to-br from-pink-500 to-pink-700 border-pink-500 text-white' 
                        : 'hover:border-pink-500 hover:bg-pink-50 hover:-translate-y-0.5'
                    }`}
                  >
                    {tag}
                    {selectedTags.includes(tag) && <X className="w-3 h-3 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Count */}
      {hasActiveFilters && (
        <div className="mt-4 py-3 px-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl text-[0.95rem] text-gray-700 text-center">
          Tìm thấy <strong className="text-pink-500 font-bold">{resultCount}</strong> kỷ niệm
          {highlightedText && <span className="text-gray-500 italic"> (đang tô sáng: "{highlightedText}")</span>}
        </div>
      )}
    </div>
  );
}
