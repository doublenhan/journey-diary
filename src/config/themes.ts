export type MoodTheme = 'happy' | 'calm' | 'romantic' | 'energetic' | 'peaceful' | 'passionate';

export interface ThemeConfig {
  background: string;
  cardBg: string;
  textPrimary: string;
  border: string;
}

export const themes: Record<MoodTheme, ThemeConfig> = {
  happy: {
    background: 'linear-gradient(135deg, #FFFDE4 0%, #FFF 50%, #FEF08A 100%)',
    cardBg: '#fff',
    textPrimary: '#78350f',
    border: '#FEF08A',
  },
  calm: {
    background: 'linear-gradient(135deg, #EEF2FF 0%, #FFF 50%, #E0E7FF 100%)',
    cardBg: '#fff',
    textPrimary: '#3730a3',
    border: '#E0E7FF',
  },
  romantic: {
    background: 'linear-gradient(135deg, #FDF2F8 0%, #FFF 50%, #FCE7F3 100%)',
    cardBg: '#fff',
    textPrimary: '#831843',
    border: '#FCE7F3',
  },
  energetic: {
    background: 'linear-gradient(135deg, #FFEDD5 0%, #FFF 50%, #FED7AA 100%)',
    cardBg: '#fff',
    textPrimary: '#7c2d12',
    border: '#FED7AA',
  },
  peaceful: {
    background: 'linear-gradient(135deg, #ECFDF5 0%, #FFF 50%, #D1FAE5 100%)',
    cardBg: '#fff',
    textPrimary: '#064e3b',
    border: '#D1FAE5',
  },
  passionate: {
    background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF 50%, #FEE2E2 100%)',
    cardBg: '#fff',
    textPrimary: '#7f1d1d',
    border: '#FEE2E2',
  }
};

export const isValidTheme = (theme: string): theme is MoodTheme => {
  return ['happy', 'calm', 'romantic', 'energetic', 'peaceful', 'passionate'].includes(theme);
};
