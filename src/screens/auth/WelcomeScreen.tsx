import React from 'react';
import { Platform, StyleSheet, Text as RNText, View } from 'react-native';
import { Button, Chip, Surface, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import BrandMark from '../../components/common/BrandMark';
import { useLanguage } from '../../hooks/useLanguage';
import type { LanguageCode } from '../../utils/i18n';

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
  const { t } = useTranslation();
  const { language, switchLanguage } = useLanguage();
  const languages: Record<string, { label: string }> = {
    ar: { label: 'العربية' },
    fr: { label: 'Français' },
  };

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
                {t('welcome_title')}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('welcome_subtitle')}
              </Text>
            </View>

            <View style={styles.chips}>
              <Chip compact icon="leaf-circle-outline">
                <EmojiText>🌿</EmojiText> {t('welcome_chip_local')}
              </Chip>
              <Chip compact icon="package-variant-closed">
                <EmojiText>📦</EmojiText> {t('welcome_chip_organized')}
              </Chip>
              <Chip compact icon="file-document-outline">
                <EmojiText>🧾</EmojiText> {t('welcome_chip_ready')}
              </Chip>
            </View>

            <View style={[styles.emojiPanel, { backgroundColor: theme.colors.elevation.level1 }]}>
              <EmojiText style={{ color: theme.colors.onSurface, fontSize: 20 }}>
                {t('welcome_emoji_morocco')}
              </EmojiText>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('welcome_emoji_panel')}
              </Text>
            </View>
          </Surface>
        </View>

        <View style={styles.languageRow}>
          {Object.entries(languages).map(([code, { label }]) => (
            <Chip
              key={code}
              compact
              selected={language === code}
              onPress={() => switchLanguage(code as LanguageCode)}
              style={language === code ? { backgroundColor: theme.colors.primaryContainer } : {}}
            >
              {label}
            </Chip>
          ))}
        </View>

        <View style={styles.footer}>
          <Button mode="contained" contentStyle={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            {t('get_started')}
          </Button>
          <Button textColor={theme.colors.onSurfaceVariant} onPress={() => navigation.navigate('Login')}>
            {t('already_have_account')}
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
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
