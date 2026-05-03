import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';

export const COLORS = {
  primary: '#1E40AF',
  secondary: '#2563EB',
  lightBlue: '#DBEAFE',
  background: '#F9FAFB',
  card: '#FFFFFF',
  textDark: '#111827',
  textGray: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
  grayLight: '#F3F4F6',
  grayMedium: '#9CA3AF',
  primaryDark: '#1E3A8A',
  primaryLight: '#3B82F6',
  secondaryLight: '#60A5FA',
  lightBlueAlt: '#EFF6FF',
  successLight: '#D1FAE5',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  accent: '#2563EB',
  brand: '#1E40AF',
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const baseColors = {
  primary: COLORS.primary,
  primaryLight: COLORS.primaryLight,
  primaryDark: COLORS.primaryDark,
  brand: COLORS.brand,
  secondary: COLORS.secondary,
  backgroundLight: COLORS.background,
  backgroundDark: '#121212',
  surfaceLight: COLORS.card,
  surfaceDark: '#1E1E1E',
  surfaceVariantLight: COLORS.lightBlue,
  surfaceVariantDark: '#2A2A2A',
  textLight: COLORS.textDark,
  textDark: '#FFFFFF',
  mutedLight: COLORS.textGray,
  mutedDark: '#D5CFC7',
  outlineLight: COLORS.border,
  outlineDark: '#3A3A3A',
  accent: COLORS.accent,
  info: COLORS.info,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.danger,
  statusAvailable: COLORS.success,
  statusAvailableBg: COLORS.successLight,
  statusLow: '#EA580C',
  statusLowBg: '#FFF7ED',
};

export function buildPaperTheme(mode: ThemeMode): MD3Theme {
  const isDark = mode === 'dark';
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    roundness: RADIUS.md,
    colors: {
      ...baseTheme.colors,
      primary: baseColors.primary,
      secondary: baseColors.secondary,
      tertiary: baseColors.secondary,
      error: baseColors.danger,
      background: isDark ? baseColors.backgroundDark : baseColors.backgroundLight,
      surface: isDark ? baseColors.surfaceDark : baseColors.surfaceLight,
      surfaceVariant: isDark ? baseColors.surfaceVariantDark : baseColors.surfaceVariantLight,
      surfaceDisabled: isDark ? '#242424' : '#F1EAE1',
      onPrimary: '#FFFFFF',
      onSecondary: isDark ? '#1A1A1A' : '#2E2E2E',
      onSurface: isDark ? baseColors.textDark : baseColors.textLight,
      onSurfaceVariant: isDark ? baseColors.mutedDark : baseColors.mutedLight,
      outline: isDark ? baseColors.outlineDark : baseColors.outlineLight,
      outlineVariant: isDark ? '#2F2F2F' : '#E7DED1',
      elevation: {
        ...baseTheme.colors.elevation,
        level1: isDark ? '#202020' : '#FFF9F2',
        level2: isDark ? '#242424' : '#FCF4E9',
        level3: isDark ? '#282828' : '#F7EBDD',
      },
    },
  };
}

export function buildNavigationTheme(mode: ThemeMode): NavigationTheme {
  const isDark = mode === 'dark';
  const paperTheme = buildPaperTheme(mode);
  const baseTheme = isDark ? NavigationDarkTheme : NavigationDefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: paperTheme.colors.primary,
      background: paperTheme.colors.background,
      card: paperTheme.colors.surface,
      text: paperTheme.colors.onSurface,
      border: paperTheme.colors.outlineVariant,
      notification: paperTheme.colors.secondary,
    },
  };
}

export const appColors = {
  ...baseColors,
};
