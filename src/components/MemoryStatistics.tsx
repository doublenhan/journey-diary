import { useMemo } from 'react';
import { Calendar, MapPin, Heart, TrendingUp, Image, Clock, Award } from 'lucide-react';

interface Memory {
  id: string;
  title: string;
  date: string;
  location?: string | null;
  images: any[];
  tags?: string[];
}

interface MemoryStatisticsProps {
  memories: Memory[];
  theme?: {
    colors: {
      primary: string;
      secondary: string;
    };
  };
}

export function MemoryStatistics({ memories, theme }: MemoryStatisticsProps) {
  const primaryColor = theme?.colors?.primary || '#ec4899';

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMemories = memories.length;
    const totalImages = memories.reduce((sum, m) => sum + (m.images?.length || 0), 0);
    
    // Memories by month
    const byMonth: { [key: string]: number } = {};
    memories.forEach(m => {
      if (m.date && typeof m.date === 'string') {
        const month = m.date.substring(0, 7); // YYYY-MM
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
    });
    
    // Memories by location
    const byLocation: { [key: string]: number } = {};
    memories.forEach(m => {
      if (m.location) {
        byLocation[m.location] = (byLocation[m.location] || 0) + 1;
      }
    });
    
    // Memories by year
    const byYear: { [key: string]: number } = {};
    memories.forEach(m => {
      if (m.date && typeof m.date === 'string') {
        const year = m.date.substring(0, 4);
        byYear[year] = (byYear[year] || 0) + 1;
      }
    });
    
    // Most active month
    const mostActiveMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
    
    // Top locations
    const topLocations = Object.entries(byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Recent trend (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentMemories = memories.filter(m => new Date(m.date) >= threeMonthsAgo).length;
    
    // Average images per memory
    const avgImages = totalMemories > 0 ? (totalImages / totalMemories).toFixed(1) : '0';
    
    return {
      totalMemories,
      totalImages,
      byMonth,
      byLocation,
      byYear,
      mostActiveMonth,
      topLocations,
      recentMemories,
      avgImages
    };
  }, [memories]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  if (memories.length === 0) {
    return (
      <div className="memory-statistics empty">
        <div className="empty-stats">
          <Heart className="w-12 h-12 text-gray-300" />
          <p>Chưa có thống kê. Hãy tạo kỷ niệm đầu tiên!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-3xl p-8 shadow-[0_4px_20px_rgba(236,72,153,0.1)] mb-8 max-md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="w-6 h-6" style={{ color: primaryColor }} />
        <h2 className="text-2xl font-bold text-gray-700 m-0">Thống Kê Kỷ Niệm</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-8 max-md:grid-cols-1 max-md:gap-4">
        {/* Total Memories */}
        <div className="bg-white rounded-2xl p-6 border-2 transition-all duration-300 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(236,72,153,0.15)] max-[480px]:flex-col max-[480px]:text-center max-md:p-4" style={{ borderColor: primaryColor }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 max-[480px]:w-12 max-[480px]:h-12" style={{ background: `${primaryColor}15`, color: primaryColor }}>
            <Heart className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold leading-none mb-2 max-md:text-2xl" style={{ color: primaryColor }}>
              {stats.totalMemories}
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tổng Kỷ Niệm</div>
          </div>
        </div>

        {/* Total Images */}
        <div className="bg-white rounded-2xl p-6 border-2 transition-all duration-300 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(236,72,153,0.15)] max-[480px]:flex-col max-[480px]:text-center max-md:p-4" style={{ borderColor: primaryColor }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 max-[480px]:w-12 max-[480px]:h-12" style={{ background: `${primaryColor}15`, color: primaryColor }}>
            <Image className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold leading-none mb-2 max-md:text-2xl" style={{ color: primaryColor }}>
              {stats.totalImages}
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tổng Hình Ảnh</div>
            <div className="text-xs text-gray-400 mt-1">~{stats.avgImages} ảnh/kỷ niệm</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 border-2 transition-all duration-300 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(236,72,153,0.15)] max-[480px]:flex-col max-[480px]:text-center max-md:p-4" style={{ borderColor: primaryColor }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 max-[480px]:w-12 max-[480px]:h-12" style={{ background: `${primaryColor}15`, color: primaryColor }}>
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold leading-none mb-2 max-md:text-2xl" style={{ color: primaryColor }}>
              {stats.recentMemories}
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">3 Tháng Gần Đây</div>
          </div>
        </div>

        {/* Most Active Month */}
        {stats.mostActiveMonth && (
          <div className="bg-white rounded-2xl p-6 border-2 transition-all duration-300 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(236,72,153,0.15)] max-[480px]:flex-col max-[480px]:text-center max-md:p-4" style={{ borderColor: primaryColor }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 max-[480px]:w-12 max-[480px]:h-12" style={{ background: `${primaryColor}15`, color: primaryColor }}>
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold leading-none mb-2 max-md:text-2xl" style={{ color: primaryColor }}>
                {stats.mostActiveMonth[1]}
              </div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tháng Nhiều Nhất</div>
              <div className="text-xs text-gray-400 mt-1">{formatMonth(stats.mostActiveMonth[0])}</div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 max-md:grid-cols-1 max-md:gap-6">
        {/* Memories by Year */}
        {Object.keys(stats.byYear).length > 0 && (
          <div className="bg-white rounded-2xl p-6 border-2 border-pink-100 max-md:p-4">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-pink-100">
              <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
              <h3 className="text-lg font-bold text-gray-700 m-0">Theo Năm</h3>
            </div>
            <div className="flex flex-col gap-4">
              {Object.entries(stats.byYear)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([year, count]) => {
                  const maxCount = Math.max(...Object.values(stats.byYear));
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={year} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">{year}</span>
                        <span className="text-sm font-bold text-pink-500">{count}</span>
                      </div>
                      <div className="w-full h-3 bg-pink-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-[width] duration-500 animate-[fillBar_1s_ease]" 
                          style={{ 
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}dd)`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Top Locations */}
        {stats.topLocations.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border-2 border-pink-100 max-md:p-4">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-pink-100">
              <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              <h3 className="text-lg font-bold text-gray-700 m-0">Địa Điểm Phổ Biến</h3>
            </div>
            <div className="flex flex-col gap-4">
              {stats.topLocations.map(([location, count], index) => (
                <div key={location} className="flex items-center gap-4 px-4 py-4 bg-pink-50 rounded-xl transition-all duration-200 hover:bg-pink-100 hover:translate-x-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.95rem] font-semibold text-gray-700 mb-1">{location}</div>
                    <div className="text-xs text-gray-500">{count} kỷ niệm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
