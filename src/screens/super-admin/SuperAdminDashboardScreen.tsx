import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import StatCard from '../../components/common/StatCard';
import SectionCard from '../../components/admin/SectionCard';
import AdminKpiChart from '../../components/admin/AdminKpiChart';
import { supabase } from '../../api/supabase';
import { appColors } from '../../theme/theme';

interface DashboardStats {
  organizations: number;
  users: number;
  products: number;
  documents: number;
  invitationsPending: number;
  invitationsAccepted: number;
}

const initialStats: DashboardStats = {
  organizations: 0,
  users: 0,
  products: 0,
  documents: 0,
  invitationsPending: 0,
  invitationsAccepted: 0,
};

function formatRatio(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return value / total;
}

function SuperAdminDashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [stats, setStats] = React.useState<DashboardStats>(initialStats);
  const [loading, setLoading] = React.useState(true);

  const loadStats = React.useCallback(async () => {
    setLoading(true);

    const [
      organizationsResult,
      usersResult,
      productsResult,
      documentsResult,
      pendingResult,
      acceptedResult,
    ] = await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('produits').select('*', { count: 'exact', head: true }),
      supabase.from('documents').select('*', { count: 'exact', head: true }),
      supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('statut', 'pending'),
      supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('statut', 'accepted'),
    ]);

    const firstError =
      organizationsResult.error ??
      usersResult.error ??
      productsResult.error ??
      documentsResult.error ??
      pendingResult.error ??
      acceptedResult.error;

    if (firstError) {
      Alert.alert('Administration', firstError.message);
      setLoading(false);
      return;
    }

    setStats({
      organizations: organizationsResult.count ?? 0,
      users: usersResult.count ?? 0,
      products: productsResult.count ?? 0,
      documents: documentsResult.count ?? 0,
      invitationsPending: pendingResult.count ?? 0,
      invitationsAccepted: acceptedResult.count ?? 0,
    });
    setLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadStats().catch(() => undefined);
    }, [loadStats]),
  );

  const totalInvitations = stats.invitationsPending + stats.invitationsAccepted;

  return (
    <ScreenContainer backgroundColor={theme.colors.background} loading={loading}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text variant="headlineMedium" style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
            {t('admin_dashboard')}
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('clean_workflow')}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard
          label={t('stats_organizations')}
          value={String(stats.organizations)}
          helper={t('active_tenants')}
          icon="office-building-outline"
          accentColor={appColors.brand}
        />
        <StatCard
          label={t('stats_users')}
          value={String(stats.users)}
          helper={t('profiles_with_access')}
          icon="account-group-outline"
          accentColor={appColors.info}
        />
        <StatCard
          label={t('stats_products')}
          value={String(stats.products)}
          helper={t('catalog_items')}
          icon="package-variant-closed"
          accentColor={appColors.accent}
        />
        <StatCard
          label={t('stats_documents')}
          value={String(stats.documents)}
          helper={t('generated_records')}
          icon="file-document-multiple-outline"
          accentColor={appColors.success}
        />
      </View>

      <SectionCard
        title={t('invitation_health')}
        subtitle={t('live_distribution')}>
        <View style={styles.invitationSummary}>
          <StatCard
            label={t('pending')}
            value={String(stats.invitationsPending)}
            helper={t('waiting_for_action')}
            icon="clock-outline"
            accentColor={appColors.accent}
            trendLabel={totalInvitations > 0 ? `${Math.round(formatRatio(stats.invitationsPending, totalInvitations) * 100)}%` : '0%'}
            progress={formatRatio(stats.invitationsPending, Math.max(totalInvitations, 1))}
          />
          <StatCard
            label={t('accepted')}
            value={String(stats.invitationsAccepted)}
            helper={t('completed_onboarding')}
            icon="check-decagram-outline"
            accentColor={appColors.success}
            trendLabel={totalInvitations > 0 ? `${Math.round(formatRatio(stats.invitationsAccepted, totalInvitations) * 100)}%` : '0%'}
            progress={formatRatio(stats.invitationsAccepted, Math.max(totalInvitations, 1))}
          />
        </View>
        <AdminKpiChart
          items={[
            { label: t('stats_organizations'), value: stats.organizations, color: appColors.brand },
            { label: t('stats_users'), value: stats.users, color: appColors.info },
            { label: t('stats_products'), value: stats.products, color: appColors.accent },
            { label: t('stats_documents'), value: stats.documents, color: appColors.success },
          ]}
        />
      </SectionCard>

      <SectionCard
        title={t('operational_snapshot')}
        subtitle={t('high_level_signals')}>
        <View style={styles.snapshotRow}>
          <View
            style={[
              styles.snapshotCard,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('pending_load')}
            </Text>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              {stats.invitationsPending > 0 ? t('needs_follow_up') : t('stable')}
            </Text>
          </View>
          <View
            style={[
              styles.snapshotCard,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('adoption_signal')}
            </Text>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              {stats.organizations > 0 ? Math.round((stats.users / stats.organizations) * 10) / 10 : 0} {t('users_per_org')}
            </Text>
          </View>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 16,
  },
  heroCopy: {
    gap: 8,
  },
  heroTitle: {
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  invitationSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  snapshotRow: {
    gap: 12,
  },
  snapshotCard: {
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
});

export default SuperAdminDashboardScreen;
