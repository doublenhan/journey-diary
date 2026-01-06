import { Search, Filter, X } from 'lucide-react';

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
    <div className="bg-white rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(236,72,153,0.08)] border border-pink-500/10">
      <div className="flex gap-3 flex-wrap md:flex-nowrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[250px] w-full md:w-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm kỷ niệm (tiêu đề, nội dung, địa điểm...)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full py-3 px-10 pr-10 border-2 border-gray-200 rounded-xl text-sm transition-all outline-none placeholder:text-gray-400 focus:border-pink-500 focus:shadow-[0_0_0_3px_rgba(236,72,153,0.1)] md:placeholder:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 border-none rounded-md p-1.5 cursor-pointer flex items-center justify-center transition-all text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Year Filter */}
        <div className="relative min-w-[200px] w-full md:w-auto">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none z-10" />
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full py-3 pl-10 pr-10 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white cursor-pointer transition-all outline-none appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20fill=%27%239ca3af%27%20d=%27M6%209L1%204h10z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_14px_center] hover:border-gray-300 focus:border-pink-500 focus:shadow-[0_0_0_3px_rgba(236,72,153,0.1)]"
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
        <div className="mt-3 text-sm text-gray-500 py-2 px-3 bg-pink-500/5 rounded-lg inline-block animate-[slideDown_0.3s_ease-out]">
          Tìm thấy <strong className="text-pink-500 font-semibold">{resultCount}</strong> kỷ niệm
        </div>
      )}
    </div>
  );
}
