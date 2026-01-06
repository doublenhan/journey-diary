import React, { useState } from 'react';
import { CustomTheme, themePresets, saveThemePreference } from '../utils/themeSystem';
import { Palette, Check } from 'lucide-react';

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
    <div className="relative">
      <button 
        className="w-10 h-10 rounded-full bg-white border-2 border-pink-100 flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md hover:scale-110 hover:rotate-[15deg] hover:border-pink-500 hover:shadow-[0_4px_12px_rgba(236,72,153,0.3)]"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <Palette className="w-5 h-5 text-pink-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-[calc(100%+12px)] right-0 w-80 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-[1000] animate-slideUp max-h-[500px] overflow-y-auto md:w-80 max-md:fixed max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:w-full max-md:rounded-t-2xl max-md:rounded-b-none max-md:max-h-[70vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Choose Your Theme</h3>
              <button 
                className="w-7 h-7 rounded-full border-none bg-gray-100 text-gray-500 text-2xl leading-none cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:text-gray-800"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4">
              {themePresets.map((theme) => (
                <button
                  key={theme.id}
                  className={`bg-white border-2 rounded-xl p-3 cursor-pointer transition-all duration-200 flex flex-col gap-2 hover:border-pink-500 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(236,72,153,0.2)] ${
                    currentTheme.id === theme.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div 
                    className="h-[60px] rounded-lg flex items-end p-2"
                    style={{
                      background: theme.gradients.card
                    }}
                  >
                    <div className="flex gap-1">
                      <span className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ background: theme.colors.primary }} />
                      <span className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ background: theme.colors.secondary }} />
                      <span className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ background: theme.colors.accent }} />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-800 flex items-center justify-between gap-1">
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
