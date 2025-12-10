import { useState } from 'react';
import { Search, Filter, X, Calendar, MapPin, Tag, ChevronDown } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import '../styles/EnhancedSearchFilter.css';

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
    <div className="enhanced-search-filter">
      <div className="search-filter-main">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm kỷ niệm (tiêu đề, nội dung, địa điểm...)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="search-clear-btn"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          {/* Year Filter */}
          <div className="filter-item">
            <Calendar className="filter-icon" />
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="filter-select"
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
            className={`advanced-toggle ${showAdvanced ? 'active' : ''}`}
            title="Bộ lọc nâng cao"
          >
            <Filter className="w-4 h-4" />
            <span>Nâng cao</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="clear-all-btn"
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
        <div className="advanced-filters">
          {/* Date Range */}
          {onDateRangeChange && (
            <div className="filter-group">
              <label className="filter-label">
                <Calendar className="w-4 h-4" />
                Khoảng thời gian
              </label>
              <div className="date-range-inputs">
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
                <span className="date-separator">đến</span>
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
            <div className="filter-group">
              <label className="filter-label">
                <MapPin className="w-4 h-4" />
                Địa điểm
              </label>
              <select
                value={selectedLocation || ''}
                onChange={(e) => onLocationChange(e.target.value)}
                className="filter-select-full"
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
            <div className="filter-group">
              <label className="filter-label">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <div className="tags-container">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
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
        <div className="search-result-count">
          Tìm thấy <strong>{resultCount}</strong> kỷ niệm
          {highlightedText && <span className="highlight-info"> (đang tô sáng: "{highlightedText}")</span>}
        </div>
      )}
    </div>
  );
}
