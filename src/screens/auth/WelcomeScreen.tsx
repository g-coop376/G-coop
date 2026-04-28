import React from 'react';
import { Platform, StyleSheet, Text as RNText, View } from 'react-native';
import { Button, Chip, Surface, Text, useTheme } from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import BrandMark from '../../components/common/BrandMark';

const emojiStyle = Platform.select({
  android: { fontFamily: undefined },
  default: {},
});

function EmojiText({ children, style }: { children: string; style?: object }) {
  return (
    <RNText style={[emojiStyle, style]}>{children}</RNText>
  );
}

function WelcomeScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const theme = useTheme();

  return (
    <ScreenContainer scrollable={false} backgroundColor={theme.colors.background}>
      <View style={styles.screen}>
        <View style={styles.hero}>
          <View style={[styles.orb, styles.orbPrimary, { backgroundColor: `${theme.colors.primary}1A` }]} />
          <View style={[styles.orb, styles.orbSecondary, { backgroundColor: `${theme.colors.secondary}2B` }]} />

          <Surface style={[styles.heroCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <BrandMark />
            <View style={styles.copy}>
              <Text variant="headlineLarge" style={{ color: theme.colors.onSurface }}>
                Welcome to a cleaner cooperative workflow
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                Discover Moroccan products, organize your stock, and keep documents under control from one calm place.
              </Text>
            </View>

            <View style={styles.chips}>
              <Chip compact icon="leaf-circle-outline">
                <EmojiText>🌿</EmojiText> Local
              </Chip>
              <Chip compact icon="package-variant-closed">
                <EmojiText>📦</EmojiText> Organized
              </Chip>
              <Chip compact icon="file-document-outline">
                <EmojiText>🧾</EmojiText> Ready
              </Chip>
            </View>

            <View style={[styles.emojiPanel, { backgroundColor: theme.colors.elevation.level1 }]}>
              <EmojiText style={{ color: theme.colors.onSurface, fontSize: 20 }}>
                🇲🇦 🫒 🍯 🌾 📈
              </EmojiText>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Clean records, smooth follow-up, and a modern first step for your team.
              </Text>
            </View>
          </Surface>
        </View>

        <View style={styles.footer}>
          <Button mode="contained" contentStyle={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            Get Started
          </Button>
          <Button textColor={theme.colors.onSurfaceVariant} onPress={() => navigation.navigate('Login')}>
            Already have an account?
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  hero: {
    position: 'relative',
    flex: 0,
    justifyContent: 'center',
    minHeight: 520,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPrimary: {
    width: 220,
    height: 220,
    top: 24,
    right: -40,
  },
  orbSecondary: {
    width: 180,
    height: 180,
    bottom: 20,
    left: -60,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    gap: 24,
  },
  copy: {
    gap: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiPanel: {
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  footer: {
    gap: 8,
    marginTop: 8,
  },
  primaryButton: {
    height: 56,
  },
});

export default WelcomeScreen;
