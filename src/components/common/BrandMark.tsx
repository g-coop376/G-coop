import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text, useTheme } from 'react-native-paper';

interface BrandMarkProps {
  compact?: boolean;
}

function BrandMark({ compact = false }: BrandMarkProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={[styles.badge, compact ? styles.badgeCompact : styles.badgeLarge, { backgroundColor: theme.colors.primary }]}>
        <View style={[styles.badgeInner, { backgroundColor: theme.colors.secondary }]}>
          <MaterialCommunityIcons
            name="sprout-outline"
            color={theme.colors.onSecondary}
            size={compact ? 18 : 26}
          />
        </View>
      </View>
      <View style={styles.copy}>
        <Text variant={compact ? 'titleMedium' : 'headlineMedium'} style={{ color: theme.colors.onSurface }}>
          G-COOP
        </Text>
        <Text variant={compact ? 'bodySmall' : 'bodyMedium'} style={{ color: theme.colors.onSurfaceVariant }}>
          Cooperative workspace
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowCompact: {
    gap: 10,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  badgeLarge: {
    width: 72,
    height: 72,
    borderRadius: 24,
  },
  badgeCompact: {
    width: 48,
    height: 48,
    borderRadius: 18,
  },
  badgeInner: {
    width: '58%',
    height: '58%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 2,
  },
});

export default BrandMark;
