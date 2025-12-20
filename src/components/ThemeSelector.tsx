import React, { useState } from 'react';
import { CustomTheme, themePresets, saveThemePreference } from '../utils/themeSystem';
import { Palette, Check } from 'lucide-react';
import '../styles/ThemeSelector.css';

interface ThemeSelectorProps {
  currentTheme: CustomTheme;
  onThemeChange: (theme: CustomTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  currentTheme, 
  onThemeChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (theme: CustomTheme) => {
    onThemeChange(theme);
    saveThemePreference(theme.id);
    setIsOpen(false);
  };

  return (
    <div className="theme-selector">
      <button 
        className="theme-selector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="theme-selector-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="theme-selector-panel">
            <div className="theme-selector-header">
              <h3>Choose Your Theme</h3>
              <button 
                className="theme-selector-close"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="theme-selector-grid">
              {themePresets.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-option ${currentTheme.id === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div 
                    className="theme-preview"
                    style={{
                      background: theme.gradients.card
                    }}
                  >
                    <div className="theme-preview-colors">
                      <span style={{ background: theme.colors.primary }} />
                      <span style={{ background: theme.colors.secondary }} />
                      <span style={{ background: theme.colors.accent }} />
                    </div>
                  </div>
                  <div className="theme-name">
                    {theme.name}
                    {currentTheme.id === theme.id && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
