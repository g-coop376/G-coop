import React from 'react';
import { Button, Card, Text } from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';

function MoreScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const { organization, signOut } = useAuth();

  return (
    <ScreenContainer title="Plus">
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">{organization?.nom ?? 'Organisation'}</Text>
          <Text>{organization?.adresse ?? ''}</Text>
          <Text>TVA: {organization?.tva ?? 0}%</Text>
        </Card.Content>
      </Card>
      <Button mode="contained-tonal" onPress={() => navigation.navigate('Stock')}>
        Stock
      </Button>
      <Button mode="contained-tonal" onPress={() => navigation.navigate('Fournisseurs')}>
        Fournisseurs
      </Button>
      <Button mode="outlined" onPress={signOut}>
        Déconnexion
      </Button>
    </ScreenContainer>
  );
}

export default MoreScreen;
