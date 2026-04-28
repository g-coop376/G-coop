import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, Text, useTheme } from 'react-native-paper';

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: string;
  accentColor?: string;
  trendLabel?: string;
  progress?: number;
}

function StatCard({
  label,
  value,
  helper,
  icon = 'chart-box-outline',
  accentColor,
  trendLabel,
  progress,
}: StatCardProps) {
  const theme = useTheme();
  const color = accentColor ?? theme.colors.primary;
  const progressWidth =
    typeof progress === 'number'
      ? (`${Math.max(0, Math.min(progress, 1)) * 100}%` as const)
      : undefined;

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${color}18` },
            ]}>
            <MaterialCommunityIcons name={icon} color={color} size={20} />
          </View>
          {trendLabel ? (
            <Text variant="labelMedium" style={[styles.trend, { color }]}>
              {trendLabel}
            </Text>
          ) : null}
        </View>

        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="headlineMedium" style={styles.value}>
          {value}
        </Text>
        {helper ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {helper}
          </Text>
        ) : null}
        {progressWidth ? (
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={[styles.progressFill, { width: progressWidth, backgroundColor: color }]} />
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    borderRadius: 24,
    elevation: 0,
  },
  content: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: 2,
    fontWeight: '700',
  },
  trend: {
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});

export default StatCard;
