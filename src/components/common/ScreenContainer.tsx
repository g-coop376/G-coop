import React from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

interface ScreenContainerProps {
  children: React.ReactNode;
  loading?: boolean;
  title?: string;
  scrollable?: boolean;
  backgroundColor?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

function ScreenContainer({
  children,
  loading,
  title,
  scrollable = true,
  backgroundColor,
  refreshControl,
}: ScreenContainerProps) {
  const theme = useTheme();
  const resolvedBackgroundColor = backgroundColor ?? theme.colors.background;

  const content = (
    <View style={styles.inner}>
      {title ? (
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          {title}
        </Text>
      ) : null}
      {loading ? <ActivityIndicator style={styles.loader} /> : children}
    </View>
  );

  if (!scrollable) {
    return (
      <View style={[styles.container, styles.fixedContainer, { backgroundColor: resolvedBackgroundColor }]}>
        {content}
      </View>
    );
  }

  return (
    <ScrollView
      style={[{ flex: 1 }, { backgroundColor: resolvedBackgroundColor }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={refreshControl}>
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
    minHeight: '100%',
    padding: 20,
    paddingBottom: 100,
  },
  inner: {
    gap: 20,
    flex: 1,
  },
  fixedContainer: {
    flex: 1,
  },
  loader: {
    marginTop: 48,
  },
});

export default ScreenContainer;
