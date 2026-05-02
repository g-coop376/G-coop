import React from 'react';
import { Button, Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';

function MoreScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const { t } = useTranslation();
  const { organization, signOut } = useAuth();

  return (
    <ScreenContainer title={t('more_title')}>
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">{organization?.nom ?? t('organization')}</Text>
          <Text>{organization?.adresse ?? ''}</Text>
          <Text>TVA: {organization?.tva ?? 0}%</Text>
        </Card.Content>
      </Card>
      <Button mode="contained-tonal" onPress={() => navigation.navigate('Stock')}>
        {t('stock')}
      </Button>
      <Button mode="contained-tonal" onPress={() => navigation.navigate('Fournisseurs')}>
        {t('suppliers')}
      </Button>
      <Button mode="outlined" onPress={signOut}>
        {t('logout')}
      </Button>
    </ScreenContainer>
  );
}

export default MoreScreen;
