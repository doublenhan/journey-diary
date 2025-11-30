import React from 'react';
import { Sun, Moon, Heart, Zap, Cloud, Flame } from 'lucide-react';
import { MoodTheme, themes as baseThemes } from './themes';

export interface SettingThemeConfig {
  name: string;
  icon: React.ReactNode;
  emoji: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    gradient: string;
    buttonGradient: string;
    hoverBg: string;
  };
  fontFamily: string;
}

// Extended theme config for SettingPage with additional metadata
export const settingThemes: Record<MoodTheme, SettingThemeConfig> = {
  happy: {
    name: 'Happy',
    icon: <Sun className="w-5 h-5" />,
    emoji: '😊',
    colors: {
      primary: 'rgb(251, 191, 36)',
      secondary: 'rgb(252, 211, 77)',
      accent: 'rgb(245, 158, 11)',
      background: baseThemes.happy.background,
      cardBg: baseThemes.happy.cardBg,
      textPrimary: baseThemes.happy.textPrimary,
      textSecondary: 'rgb(146, 64, 14)',
      border: baseThemes.happy.border,
      gradient: 'linear-gradient(135deg, rgb(254, 249, 195), rgb(254, 240, 138))',
      buttonGradient: 'linear-gradient(135deg, rgb(251, 191, 36), rgb(245, 158, 11))',
      hoverBg: 'rgb(254, 249, 195)',
    },
    fontFamily: 'ui-rounded, system-ui, sans-serif'
  },
  calm: {
    name: 'Calm',
    icon: <Moon className="w-5 h-5" />,
    emoji: '🌙',
    colors: {
      primary: 'rgb(99, 102, 241)',
      secondary: 'rgb(129, 140, 248)',
      accent: 'rgb(79, 70, 229)',
      background: baseThemes.calm.background,
      cardBg: baseThemes.calm.cardBg,
      textPrimary: baseThemes.calm.textPrimary,
      textSecondary: 'rgb(67, 56, 202)',
      border: baseThemes.calm.border,
      gradient: 'linear-gradient(135deg, rgb(238, 242, 255), rgb(224, 231, 255))',
      buttonGradient: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(79, 70, 229))',
      hoverBg: 'rgb(238, 242, 255)',
    },
    fontFamily: 'ui-serif, Georgia, serif'
  },
  romantic: {
    name: 'Romantic',
    icon: <Heart className="w-5 h-5" />,
    emoji: '💖',
    colors: {
      primary: 'rgb(236, 72, 153)',
      secondary: 'rgb(244, 114, 182)',
      accent: 'rgb(219, 39, 119)',
      background: baseThemes.romantic.background,
      cardBg: baseThemes.romantic.cardBg,
      textPrimary: baseThemes.romantic.textPrimary,
      textSecondary: 'rgb(157, 23, 77)',
      border: baseThemes.romantic.border,
      gradient: 'linear-gradient(135deg, rgb(253, 242, 248), rgb(252, 231, 243))',
      buttonGradient: 'linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119))',
      hoverBg: 'rgb(253, 242, 248)',
    },
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
  },
  energetic: {
    name: 'Energetic',
    icon: <Zap className="w-5 h-5" />,
    emoji: '⚡',
    colors: {
      primary: 'rgb(249, 115, 22)',
      secondary: 'rgb(251, 146, 60)',
      accent: 'rgb(234, 88, 12)',
      background: baseThemes.energetic.background,
      cardBg: baseThemes.energetic.cardBg,
      textPrimary: baseThemes.energetic.textPrimary,
      textSecondary: 'rgb(154, 52, 18)',
      border: baseThemes.energetic.border,
      gradient: 'linear-gradient(135deg, rgb(255, 237, 213), rgb(254, 215, 170))',
      buttonGradient: 'linear-gradient(135deg, rgb(249, 115, 22), rgb(234, 88, 12))',
      hoverBg: 'rgb(255, 237, 213)',
    },
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
  },
  peaceful: {
    name: 'Peaceful',
    icon: <Cloud className="w-5 h-5" />,
    emoji: '☁️',
    colors: {
      primary: 'rgb(16, 185, 129)',
      secondary: 'rgb(52, 211, 153)',
      accent: 'rgb(5, 150, 105)',
      background: baseThemes.peaceful.background,
      cardBg: baseThemes.peaceful.cardBg,
      textPrimary: baseThemes.peaceful.textPrimary,
      textSecondary: 'rgb(6, 95, 70)',
      border: baseThemes.peaceful.border,
      gradient: 'linear-gradient(135deg, rgb(236, 253, 245), rgb(209, 250, 229))',
      buttonGradient: 'linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105))',
      hoverBg: 'rgb(236, 253, 245)',
    },
    fontFamily: 'ui-serif, Georgia, serif'
  },
  passionate: {
    name: 'Passionate',
    icon: <Flame className="w-5 h-5" />,
    emoji: '🔥',
    colors: {
      primary: 'rgb(239, 68, 68)',
      secondary: 'rgb(248, 113, 113)',
      accent: 'rgb(220, 38, 38)',
      background: baseThemes.passionate.background,
      cardBg: baseThemes.passionate.cardBg,
      textPrimary: baseThemes.passionate.textPrimary,
      textSecondary: 'rgb(153, 27, 27)',
      border: baseThemes.passionate.border,
      gradient: 'linear-gradient(135deg, rgb(254, 242, 242), rgb(254, 226, 226))',
      buttonGradient: 'linear-gradient(135deg, rgb(239, 68, 68), rgb(220, 38, 38))',
      hoverBg: 'rgb(254, 242, 242)',
    },
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
  }
};
