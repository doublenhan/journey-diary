import * as React from 'react';

interface MoodTrackingProps {
  theme: any;
  currentTheme: string;
  handleThemeChange: (theme: string) => void;
  onSaveTheme?: () => void;
  isSaveEnabled?: boolean;
  isSaving?: boolean;
}

const MoodTracking: React.FC<MoodTrackingProps> = ({ theme, currentTheme, handleThemeChange, onSaveTheme, isSaveEnabled, isSaving }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
        Chọn Giao Diện
      </h2>
      <p style={{ color: theme.colors.textSecondary }}>
        Chọn giao diện phù hợp với tâm trạng của bạn để cá nhân hóa trải nghiệm.
      </p>
    </div>
    {/* Theme Selection */}
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        background: theme.colors.cardBg,
        borderColor: theme.colors.border
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: theme.colors.textPrimary }}>
          Giao Diện
        </h3>
        {onSaveTheme && (
          <button
            className="px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-300"
            style={{ background: theme.colors.buttonGradient, opacity: isSaveEnabled ? 1 : 0.6, cursor: isSaveEnabled ? 'pointer' : 'not-allowed' }}
            onClick={onSaveTheme}
            disabled={!isSaveEnabled || isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu Giao Diện'}
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(theme.allThemes).map(([moodKey, moodTheme]: any) => (
          <div
            key={moodKey}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
              currentTheme === moodKey ? 'ring-2' : ''
            }`}
            style={{
              background: moodTheme.colors.gradient,
              borderColor: moodTheme.colors.border,
              '--tw-ring-color': moodTheme.colors.primary
            } as React.CSSProperties}
            onClick={() => handleThemeChange(moodKey)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="mr-2">{moodTheme.emoji}</span>
                <span style={{ color: moodTheme.colors.textPrimary }}>{moodTheme.name}</span>
              </div>
              {moodTheme.icon}
            </div>
            <div className="flex space-x-2 mt-2">
              {['primary', 'secondary', 'accent'].map(colorKey => (
                <div
                  key={colorKey}
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: moodTheme.colors[colorKey] }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default MoodTracking;
