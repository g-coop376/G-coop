import React from 'react';
import { FlatList } from 'react-native';
import { Button, Card, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useStock } from '../../hooks/useStock';
import type { Produit } from '../../types';

function StockScreen() {
  const { t } = useTranslation();
  const { produits, mouvements, loading, adjustStock } = useStock();
  const [selectedProduit, setSelectedProduit] = React.useState<Produit | null>(null);
  const [quantity, setQuantity] = React.useState('0');
  const [note, setNote] = React.useState(t('adjustment_manual'));

  return (
    <ScreenContainer title={t('stock_title')} loading={loading}>
      <FlatList
        data={produits}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleMedium">{item.nom}</Text>
              <Text>{t('current_stock')}: {item.quantite_stock}</Text>
              <Text>{t('min_stock')}: {item.seuil_minimum}</Text>
              <Button mode="outlined" onPress={() => setSelectedProduit(item)}>
                {t('adjust')}
              </Button>
            </Card.Content>
          </Card>
        )}
      />
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">{t('recent_movements')}</Text>
          {mouvements.map(mouvement => (
            <Text key={mouvement.id}>
              {mouvement.mouvement_type} • {mouvement.quantite} • {new Date(mouvement.created_at).toLocaleDateString('fr-MA')}
            </Text>
          ))}
        </Card.Content>
      </Card>
      <Portal>
        <Dialog visible={Boolean(selectedProduit)} onDismiss={() => setSelectedProduit(null)}>
          <Dialog.Title>{t('adjust_stock_title')}</Dialog.Title>
          <Dialog.Content>
            <TextInput label={t('quantity')} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            <TextInput label={t('note')} value={note} onChangeText={setNote} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedProduit(null)}>{t('cancel')}</Button>
            <Button
              onPress={async () => {
                if (!selectedProduit) {
                  return;
                }
                const ok = await adjustStock(selectedProduit, Number(quantity) || 0, note);
                if (ok) {
                  setSelectedProduit(null);
                  setQuantity('0');
                }
              }}>
              {t('validate')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenContainer>
  );
}

export default StockScreen;
