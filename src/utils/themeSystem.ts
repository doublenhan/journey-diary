export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  gradients: {
    header: string;
    button: string;
    card: string;
  };
}

export const themePresets: CustomTheme[] = [
  {
    id: 'romantic-pink',
    name: 'Romantic Pink',
    colors: {
      primary: '#ec4899',
      secondary: '#f472b6',
      accent: '#fb7185',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 50%, #fef7ed 100%)',
      cardBg: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      border: '#fce7f3'
    },
    gradients: {
      header: 'linear-gradient(to right, #ec4899, #f472b6)',
      button: 'linear-gradient(to right, #ec4899, #fb7185)',
      card: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)'
    }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#06b6d4',
      background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #f0f9ff 100%)',
      cardBg: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      border: '#bfdbfe'
    },
    gradients: {
      header: 'linear-gradient(to right, #3b82f6, #06b6d4)',
      button: 'linear-gradient(to right, #3b82f6, #60a5fa)',
      card: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
    }
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fbbf24',
      background: 'linear-gradient(135deg, #ffedd5 0%, #ffffff 50%, #fef3c7 100%)',
      cardBg: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      border: '#fed7aa'
    },
    gradients: {
      header: 'linear-gradient(to right, #f97316, #fbbf24)',
      button: 'linear-gradient(to right, #f97316, #fb923c)',
      card: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)'
    }
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    colors: {
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#6ee7b7',
      background: 'linear-gradient(135deg, #d1fae5 0%, #ffffff 50%, #ecfdf5 100%)',
      cardBg: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      border: '#a7f3d0'
    },
    gradients: {
      header: 'linear-gradient(to right, #10b981, #34d399)',
      button: 'linear-gradient(to right, #10b981, #6ee7b7)',
      card: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
    }
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    colors: {
      primary: '#a855f7',
      secondary: '#c084fc',
      accent: '#e879f9',
      background: 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 50%, #fae8ff 100%)',
      cardBg: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e9d5ff'
    },
    gradients: {
      header: 'linear-gradient(to right, #a855f7, #e879f9)',
      button: 'linear-gradient(to right, #a855f7, #c084fc)',
      card: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'
    }
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    colors: {
      primary: '#ec4899',
      secondary: '#f472b6',
      accent: '#fb7185',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
      cardBg: '#1f2937',
      textPrimary: '#f9fafb',
      textSecondary: '#d1d5db',
      border: '#374151'
    },
    gradients: {
      header: 'linear-gradient(to right, #ec4899, #f472b6)',
      button: 'linear-gradient(to right, #ec4899, #fb7185)',
      card: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
    }
  }
];

export const getThemeById = (id: string): CustomTheme => {
  return themePresets.find(theme => theme.id === id) || themePresets[0];
};

export const saveThemePreference = (themeId: string): void => {
  localStorage.setItem('userTheme', themeId);
};

export const getThemePreference = (): string => {
  return localStorage.getItem('userTheme') || 'romantic-pink';
};
