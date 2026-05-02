import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface EntityListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}

function EntityListItem({
  title,
  subtitle,
  meta,
  onEdit,
  onDelete,
  onPress,
}: EntityListItemProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: '#FFFFFF' }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: '#1F2937' }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: '#6B7280' }]}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={[styles.meta, { color: '#9CA3AF' }]}>
            {meta}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {onEdit ? (
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Icon name="pencil" size={20} color="#6B7280" />
          </TouchableOpacity>
        ) : null}
        {onDelete ? (
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Icon name="delete-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'right',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'right',
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default EntityListItem;