import { useMemo } from 'react';
import { Calendar, MapPin, Heart, TrendingUp, Image, Clock, Award } from 'lucide-react';
import '../styles/MemoryStatistics.css';

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
    <div className="memory-statistics">
      {/* Header */}
      <div className="stats-header">
        <TrendingUp className="w-6 h-6" style={{ color: primaryColor }} />
        <h2 className="stats-title">Thống Kê Kỷ Niệm</h2>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        {/* Total Memories */}
        <div className="stat-card" style={{ borderColor: primaryColor }}>
          <div className="stat-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
            <Heart className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: primaryColor }}>
              {stats.totalMemories}
            </div>
            <div className="stat-label">Tổng Kỷ Niệm</div>
          </div>
        </div>

        {/* Total Images */}
        <div className="stat-card" style={{ borderColor: primaryColor }}>
          <div className="stat-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
            <Image className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: primaryColor }}>
              {stats.totalImages}
            </div>
            <div className="stat-label">Tổng Hình Ảnh</div>
            <div className="stat-sub">~{stats.avgImages} ảnh/kỷ niệm</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="stat-card" style={{ borderColor: primaryColor }}>
          <div className="stat-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
            <Clock className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: primaryColor }}>
              {stats.recentMemories}
            </div>
            <div className="stat-label">3 Tháng Gần Đây</div>
          </div>
        </div>

        {/* Most Active Month */}
        {stats.mostActiveMonth && (
          <div className="stat-card" style={{ borderColor: primaryColor }}>
            <div className="stat-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
              <Award className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: primaryColor }}>
                {stats.mostActiveMonth[1]}
              </div>
              <div className="stat-label">Tháng Nhiều Nhất</div>
              <div className="stat-sub">{formatMonth(stats.mostActiveMonth[0])}</div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Sections */}
      <div className="stats-details">
        {/* Memories by Year */}
        {Object.keys(stats.byYear).length > 0 && (
          <div className="stats-section">
            <div className="section-header">
              <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
              <h3>Theo Năm</h3>
            </div>
            <div className="stats-bars">
              {Object.entries(stats.byYear)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([year, count]) => {
                  const maxCount = Math.max(...Object.values(stats.byYear));
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={year} className="stats-bar-item">
                      <div className="bar-label">
                        <span className="bar-name">{year}</span>
                        <span className="bar-count">{count}</span>
                      </div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
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
          <div className="stats-section">
            <div className="section-header">
              <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              <h3>Địa Điểm Phổ Biến</h3>
            </div>
            <div className="location-list">
              {stats.topLocations.map(([location, count], index) => (
                <div key={location} className="location-item">
                  <div className="location-rank" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                    {index + 1}
                  </div>
                  <div className="location-info">
                    <div className="location-name">{location}</div>
                    <div className="location-count">{count} kỷ niệm</div>
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
