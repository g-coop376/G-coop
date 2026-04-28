import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import BrandMark from './BrandMark';

interface AppSplashProps {
  title: string;
  tagline: string;
  caption?: string;
  showLoader?: boolean;
}

function AppSplash({ title, tagline, caption, showLoader = false }: AppSplashProps) {
  const theme = useTheme();
  const fade = React.useRef(new Animated.Value(0)).current;
  const rise = React.useRef(new Animated.Value(18)).current;
  const scale = React.useRef(new Animated.Value(0.96)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise, scale]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.glow, styles.glowPrimary, { backgroundColor: `${theme.colors.primary}26` }]} />
      <View style={[styles.glow, styles.glowSecondary, { backgroundColor: `${theme.colors.secondary}30` }]} />

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            opacity: fade,
            transform: [{ translateY: rise }, { scale }],
          },
        ]}>
        <BrandMark />
        <View style={styles.copy}>
          <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          <Text variant="bodyLarge" style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>
            {tagline}
          </Text>
          <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
            🌿 🇲🇦 📦
          </Text>
          {caption ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {caption}
            </Text>
          ) : null}
        </View>
        {showLoader ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Preparing your workspace...
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowPrimary: {
    width: 260,
    height: 260,
    top: -40,
    right: -60,
  },
  glowSecondary: {
    width: 220,
    height: 220,
    bottom: -20,
    left: -70,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  },
  copy: {
    gap: 12,
  },
  title: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    lineHeight: 24,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});

export default AppSplash;
