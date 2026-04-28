import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

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
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium">{title}</Text>
        {subtitle ? <Text variant="bodyMedium">{subtitle}</Text> : null}
        {meta ? <Text variant="bodySmall">{meta}</Text> : null}
        <View style={styles.actions}>
          {onEdit ? <Button onPress={onEdit}>Modifier</Button> : null}
          {onDelete ? <Button onPress={onDelete}>Supprimer</Button> : null}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF9',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});

export default EntityListItem;
