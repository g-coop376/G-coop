import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

const statusConfig: Record<
  InvitationStatus,
  { label: string; backgroundColor: string; color: string }
> = {
  pending: {
    label: 'Pending',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  accepted: {
    label: 'Accepted',
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  expired: {
    label: 'Expired',
    backgroundColor: '#E2E8F0',
    color: '#475569',
  },
  cancelled: {
    label: 'Cancelled',
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
};

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text variant="labelMedium" style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: {
    fontWeight: '700',
  },
});

export default InvitationStatusBadge;
