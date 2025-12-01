import { Search, Filter, X } from 'lucide-react';
import '../styles/SearchFilterBar.css';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  availableYears: string[];
  resultCount: number;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  selectedYear,
  onYearChange,
  availableYears,
  resultCount
}: SearchFilterBarProps) {
  return (
    <div className="search-filter-bar">
      <div className="search-filter-container">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm kỷ niệm (tiêu đề, nội dung, địa điểm...)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="search-clear-btn"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Year Filter */}
        <div className="filter-wrapper">
          <Filter className="filter-icon" />
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tất cả năm ({availableYears.length})</option>
            {availableYears.map(year => (
              <option key={year} value={year}>
                Năm {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Count */}
      {(searchQuery || selectedYear !== 'ALL') && (
        <div className="search-result-count">
          Tìm thấy <strong>{resultCount}</strong> kỷ niệm
        </div>
      )}
    </div>
  );
}
