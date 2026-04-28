import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';

const baseColors = {
  primary: '#6B8E23',
  brand: '#6B8E23',
  secondary: '#C2A878',
  backgroundLight: '#F8F5F0',
  backgroundDark: '#121212',
  surfaceLight: '#FFFCF8',
  surfaceDark: '#1E1E1E',
  surfaceVariantLight: '#EFE5D5',
  surfaceVariantDark: '#2A2A2A',
  textLight: '#2E2E2E',
  textDark: '#FFFFFF',
  mutedLight: '#756A5C',
  mutedDark: '#D5CFC7',
  outlineLight: '#D8CCBD',
  outlineDark: '#3A3A3A',
  accent: '#C2A878',
  info: '#8AA55A',
  success: '#7E9E3B',
  warning: '#D4A657',
  danger: '#B8574C',
};

export function buildPaperTheme(mode: ThemeMode): MD3Theme {
  const isDark = mode === 'dark';
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    roundness: 20,
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
