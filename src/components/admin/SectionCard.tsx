import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function SectionCard({ title, subtitle, children }: SectionCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  header: {
    gap: 4,
  },
});

export default SectionCard;
