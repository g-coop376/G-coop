import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Divider, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import SectionCard from '../../components/admin/SectionCard';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../theme/ThemeModeContext';

function AdminProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { profile, user, signOut } = useAuth();
  const { mode, preference, setPreference } = useThemeMode();

  const handleLogout = () => {
    Alert.alert(t('logout_confirm'), t('logout_action'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => signOut().catch(() => undefined) },
    ]);
  };

  return (
    <ScreenContainer backgroundColor={theme.colors.background}>
      <View style={styles.hero}>
        <Text variant="headlineMedium" style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
          {t('profile')}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('manage_identity')}
        </Text>
      </View>

      <SectionCard title={t('admin_account')} subtitle={t('current_identity')}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="shield-account-outline" color="#FFFFFF" size={28} />
          </View>
          <View style={styles.profileCopy}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {profile?.nom_complet ?? t('super_admin')}
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {user?.email ?? t('email_invalid')}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t('appearance')} subtitle={t('choose_theme')}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceCopy}>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {preference === 'system'
                ? `${t('system_mode')} (${mode === 'dark' ? t('dark_mode') : t('light_mode')})`
                : mode === 'dark'
                  ? t('dark_mode')
                  : t('light_mode')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('choose_theme')}
            </Text>
          </View>
        </View>
        <SegmentedButtons
          value={preference}
          onValueChange={value => setPreference(value as 'system' | 'light' | 'dark')}
          buttons={[
            { value: 'system', label: t('system_mode') },
            { value: 'light', label: t('light_mode') },
            { value: 'dark', label: t('dark_mode') },
          ]}
        />
      </SectionCard>

      <SectionCard title={t('session')} subtitle={t('secure_access')}>
        <View style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.colors.primary} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              {t('end_session')}
            </Text>
          </View>
          <Divider />
          <Button mode="contained" buttonColor="#C2410C" contentStyle={styles.logoutButton} onPress={handleLogout}>
            {t('logout')}
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
