import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface AdminKpiChartItem {
  label: string;
  value: number;
  color: string;
}

function AdminKpiChart({ items }: { items: AdminKpiChartItem[] }) {
  const theme = useTheme();
  const maxValue = Math.max(...items.map(item => item.value), 1);

  return (
    <View style={styles.container}>
      {items.map(item => (
        <View key={item.label} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
              {item.label}
            </Text>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.value}
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${(item.value / maxValue) * 100}%` as const,
                  backgroundColor: item.color,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  row: {
    gap: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});

export default AdminKpiChart;
