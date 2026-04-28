import React from 'react';
import { FlatList } from 'react-native';
import { Button, Card, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useStock } from '../../hooks/useStock';
import type { Produit } from '../../types';

function StockScreen() {
  const { produits, mouvements, loading, adjustStock } = useStock();
  const [selectedProduit, setSelectedProduit] = React.useState<Produit | null>(null);
  const [quantity, setQuantity] = React.useState('0');
  const [note, setNote] = React.useState('Ajustement manuel');

  return (
    <ScreenContainer title="Stock" loading={loading}>
      <FlatList
        data={produits}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleMedium">{item.nom}</Text>
              <Text>Stock actuel: {item.quantite_stock}</Text>
              <Text>Seuil minimum: {item.seuil_minimum}</Text>
              <Button mode="outlined" onPress={() => setSelectedProduit(item)}>
                Ajuster
              </Button>
            </Card.Content>
          </Card>
        )}
      />
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">Derniers mouvements</Text>
          {mouvements.map(mouvement => (
            <Text key={mouvement.id}>
              {mouvement.mouvement_type} • {mouvement.quantite} • {new Date(mouvement.created_at).toLocaleDateString('fr-MA')}
            </Text>
          ))}
        </Card.Content>
      </Card>
      <Portal>
        <Dialog visible={Boolean(selectedProduit)} onDismiss={() => setSelectedProduit(null)}>
          <Dialog.Title>Ajuster le stock</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Quantité (+/-)" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            <TextInput label="Note" value={note} onChangeText={setNote} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedProduit(null)}>Annuler</Button>
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
              Valider
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenContainer>
  );
}

export default StockScreen;
