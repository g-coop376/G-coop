import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Divider, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenContainer from '../../components/common/ScreenContainer';
import SectionCard from '../../components/admin/SectionCard';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../theme/ThemeModeContext';

function AdminProfileScreen() {
  const theme = useTheme();
  const { profile, user, signOut } = useAuth();
  const { mode, preference, setPreference } = useThemeMode();

  const handleLogout = () => {
    Alert.alert('Logout', 'Do you want to sign out of the admin workspace?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut().catch(() => undefined) },
    ]);
  };

  return (
    <ScreenContainer backgroundColor={theme.colors.background}>
      <View style={styles.hero}>
        <Text variant="headlineMedium" style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
          Profile
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Manage admin identity, appearance, and session controls.
        </Text>
      </View>

      <SectionCard title="Admin account" subtitle="Current signed-in identity">
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="shield-account-outline" color="#FFFFFF" size={28} />
          </View>
          <View style={styles.profileCopy}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {profile?.nom_complet ?? 'Super Admin'}
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {user?.email ?? 'No email available'}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Appearance" subtitle="Choose the admin workspace theme">
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceCopy}>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {preference === 'system'
                ? `System mode (${mode === 'dark' ? 'dark' : 'light'})`
                : mode === 'dark'
                  ? 'Dark mode'
                  : 'Light mode'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Auto-detect the device appearance or force a manual light or dark theme.
            </Text>
          </View>
        </View>
        <SegmentedButtons
          value={preference}
          onValueChange={value => setPreference(value as 'system' | 'light' | 'dark')}
          buttons={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </SectionCard>

      <SectionCard title="Session" subtitle="Secure access controls">
        <View style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.colors.primary} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              End this admin session on the current device.
            </Text>
          </View>
          <Divider />
          <Button mode="contained" buttonColor="#C2410C" contentStyle={styles.logoutButton} onPress={handleLogout}>
            Logout
          </Button>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
  },
  heroTitle: {
    fontWeight: '700',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  sessionCard: {
    gap: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    height: 50,
  },
});

export default AdminProfileScreen;
