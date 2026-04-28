import React from 'react';
import { Alert, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Button,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import SectionCard from '../../components/admin/SectionCard';
import InvitationStatusBadge from '../../components/admin/InvitationStatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../api/supabase';
import type { OrganizationType } from '../../types';

interface InvitationListItem {
  id: string;
  email: string;
  org_type: OrganizationType;
  statut: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SendInvitationScreen() {
  const theme = useTheme();
  const { sendInvitation } = useAuth();
  const [organizationName, setOrganizationName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [organizationType, setOrganizationType] = React.useState<OrganizationType>('cooperative');
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [invitations, setInvitations] = React.useState<InvitationListItem[]>([]);

  const loadInvitations = React.useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, org_type, statut, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      Alert.alert('Invitations', error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setInvitations((data as InvitationListItem[] | null) ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadInvitations().catch(() => undefined);
    }, [loadInvitations]),
  );

  const handleSubmit = async () => {
    const trimmedName = organizationName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      Alert.alert('Invitation', "Organization name is required.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invitation', 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const ok = await sendInvitation(normalizedEmail, organizationType, trimmedName);
    setSubmitting(false);

    if (!ok) {
      return;
    }

    setOrganizationName('');
    setEmail('');
    Alert.alert('Invitation', `Invitation sent to ${normalizedEmail}`);
    await loadInvitations(false);
  };

  return (
    <ScreenContainer
      backgroundColor={theme.colors.background}
      loading={loading}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadInvitations(false).catch(() => undefined);
          }}
          tintColor={theme.colors.primary}
        />
      }>
      <View style={styles.hero}>
        <Text variant="headlineMedium" style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
          Invitations
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Invite new organizations and monitor recent invitation activity from one place.
        </Text>
      </View>

      <SectionCard
        title="Send invitation"
        subtitle="Create a new admin onboarding invite">
        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label="Organization name"
            value={organizationName}
            onChangeText={setOrganizationName}
          />

          <TextInput
            mode="outlined"
            label="Admin email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.fieldGroup}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
              Organization type
            </Text>
            <SegmentedButtons
              value={organizationType}
              onValueChange={value => setOrganizationType(value as OrganizationType)}
              buttons={[
                { label: 'Cooperative', value: 'cooperative' },
                { label: 'Company', value: 'societe' },
              ]}
            />
          </View>

          <Button
            mode="contained"
            contentStyle={styles.buttonContent}
            loading={submitting}
            disabled={submitting}
            onPress={handleSubmit}>
            Send invitation
          </Button>
        </View>
      </SectionCard>

      <SectionCard
        title="Sent invitations"
        subtitle="Latest 20 invitations">
        <View style={styles.list}>
          {invitations.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                No invitations sent yet.
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                New invitations will appear here with their current status.
              </Text>
            </View>
          ) : (
            invitations.map(invitation => (
              <View
                key={invitation.id}
                style={[
                  styles.listItem,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}>
                <View style={styles.listItemHeader}>
                  <View style={styles.listItemCopy}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                      {invitation.email}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {invitation.org_type === 'cooperative' ? 'Cooperative' : 'Company'} • Sent {formatDate(invitation.created_at)}
                    </Text>
                  </View>
                  <InvitationStatusBadge status={invitation.statut} />
                </View>
              </View>
            ))
          )}
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
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 10,
  },
  buttonContent: {
    height: 50,
  },
  list: {
    gap: 12,
  },
  emptyState: {
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  listItem: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  listItemCopy: {
    flex: 1,
    gap: 4,
  },
});

export default SendInvitationScreen;
