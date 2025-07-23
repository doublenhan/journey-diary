import * as React from 'react';

interface MoodTrackingProps {
  theme: any;
  currentTheme: string;
  handleThemeChange: (theme: string) => void;
  galleryMode: string;
  setGalleryMode: (mode: string) => void;
  renderMemoriesLayout: () => React.ReactNode;
  renderJourneyLayout: () => React.ReactNode;
  onSaveTheme?: () => void;
  isSaveEnabled?: boolean;
  isSaving?: boolean;
}

const MoodTracking: React.FC<MoodTrackingProps> = ({ theme, currentTheme, handleThemeChange, galleryMode, setGalleryMode, renderMemoriesLayout, renderJourneyLayout, onSaveTheme, isSaveEnabled, isSaving }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
        Mood Tracking & Gallery Display
      </h2>
      <p style={{ color: theme.colors.textSecondary }}>
        Choose your mood theme and customize how your love memories are displayed.
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
          Mood Themes
        </h3>
        {onSaveTheme && (
          <button
            className="px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-300"
            style={{ background: theme.colors.buttonGradient, opacity: isSaveEnabled ? 1 : 0.6, cursor: isSaveEnabled ? 'pointer' : 'not-allowed' }}
            onClick={onSaveTheme}
            disabled={!isSaveEnabled || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
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
    {/* Gallery Display Mode Toggle */}
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        background: theme.colors.cardBg,
        borderColor: theme.colors.border
      }}
    >
      <h3 className="font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
        Gallery Display Mode
      </h3>
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
            {galleryMode === 'memories' ? 'Photo Grid' : 'Journey Timeline'}
          </span>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {galleryMode === 'memories' 
              ? 'View memories organized by year' 
              : 'View your relationship as a timeline journey'}
          </p>
        </div>
        <button
          onClick={() => setGalleryMode(galleryMode === 'memories' ? 'journey' : 'memories')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2`}
          style={{ 
            backgroundColor: galleryMode === 'journey' ? theme.colors.primary : theme.colors.border,
            '--tw-ring-color': theme.colors.primary + '33'
          } as React.CSSProperties}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
              galleryMode === 'journey' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {/* Gallery Preview */}
      <div className="border rounded-xl p-4" style={{ borderColor: theme.colors.border }}>
        <h4 className="font-medium mb-4" style={{ color: theme.colors.textPrimary }}>
          Preview:
        </h4>
        <div className="max-h-96 overflow-y-auto">
          {galleryMode === 'memories' ? renderMemoriesLayout() : renderJourneyLayout()}
        </div>
      </div>
    </div>
  </div>
);

export default MoodTracking;
