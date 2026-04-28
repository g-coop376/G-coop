import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { buildNavigationTheme, buildPaperTheme, type ThemeMode } from './theme';

const STORAGE_KEY = 'gcoop.theme.mode';

interface ThemeModeContextValue {
  preference: ThemeModePreference;
  mode: ThemeMode;
  setPreference: (mode: ThemeModePreference) => void;
  toggleMode: () => void;
}

export type ThemeModePreference = ThemeMode | 'system';

const ThemeModeContext = React.createContext<ThemeModeContextValue | undefined>(undefined);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = React.useState<ThemeModePreference>('system');
  const [ready, setReady] = React.useState(false);

  const mode: ThemeMode =
    preference === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : preference;

  React.useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (mounted && (value === 'light' || value === 'dark' || value === 'system')) {
          setPreferenceState(value);
        }
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = React.useCallback((nextPreference: ThemeModePreference) => {
    setPreferenceState(nextPreference);
    AsyncStorage.setItem(STORAGE_KEY, nextPreference).catch(() => undefined);
  }, []);

  const toggleMode = React.useCallback(() => {
    setPreference(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setPreference]);

  const value = React.useMemo(
    () => ({
      preference,
      mode,
      setPreference,
      toggleMode,
    }),
    [mode, preference, setPreference, toggleMode],
  );

  const paperTheme = React.useMemo(() => buildPaperTheme(mode), [mode]);

  if (!ready) {
    return (
      <View style={[styles.loader, { backgroundColor: systemColorScheme === 'dark' ? '#121212' : '#F8F5F0' }]}>
        <ActivityIndicator size="large" color="#6B8E23" />
      </View>
    );
  }

  return (
    <ThemeModeContext.Provider value={value}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = React.useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }

  return context;
}

export function useNavigationTheme() {
  const { mode } = useThemeMode();
  return React.useMemo(() => buildNavigationTheme(mode), [mode]);
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F5F0',
  },
});
