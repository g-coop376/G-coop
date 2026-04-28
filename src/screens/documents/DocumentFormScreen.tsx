import React from 'react';
import { Button, Card, Menu, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import DocumentLineEditor, {
  type EditableDocumentLine,
} from '../../components/documents/DocumentLineEditor';
import { useDocuments } from '../../hooks/useDocuments';
import type { DocumentType, DocumentWithRelations } from '../../types';
import { documentLabels } from '../../utils/numerotation';

function DocumentFormScreen({
  route,
  navigation,
}: {
  route?: { params?: { document?: DocumentWithRelations } };
  navigation: { goBack: () => void };
}) {
  const document = route?.params?.document;
  const { clients, fournisseurs, produits, saveDocument } = useDocuments();
  const [type, setType] = React.useState<DocumentType>(document?.type ?? 'DEV');
  const [date, setDate] = React.useState(document?.date_document ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState(document?.notes ?? '');
  const [clientId, setClientId] = React.useState<string | null>(document?.client_id ?? null);
  const [fournisseurId, setFournisseurId] = React.useState<string | null>(document?.fournisseur_id ?? null);
  const [lines, setLines] = React.useState<EditableDocumentLine[]>(
    document?.lignes?.map(line => ({
      produit_id: line.produit_id,
      description: line.description,
      quantite: line.quantite,
      prix_unitaire: line.prix_unitaire,
    })) ?? [{ produit_id: null, description: '', quantite: 1, prix_unitaire: 0 }],
  );
  const [clientMenu, setClientMenu] = React.useState(false);
  const [fournisseurMenu, setFournisseurMenu] = React.useState(false);

  const subtotal = lines.reduce((sum, line) => sum + line.quantite * line.prix_unitaire, 0);

  return (
    <ScreenContainer title={document ? 'Modifier document' : 'Nouveau document'}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <SegmentedButtons
            value={type}
            onValueChange={value => setType(value as DocumentType)}
            buttons={(['DEV', 'FAC', 'BDC', 'BDL'] as DocumentType[]).map(item => ({
              value: item,
              label: item,
            }))}
          />
          <TextInput mode="outlined" label="Date" value={date} onChangeText={setDate} />
          <Menu
            visible={clientMenu}
            onDismiss={() => setClientMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setClientMenu(true)}>
                Client: {clients.find(item => item.id === clientId)?.nom ?? 'Choisir'}
              </Button>
            }>
            {clients.map(item => (
              <Menu.Item
                key={item.id}
                title={item.nom}
                onPress={() => {
                  setClientId(item.id);
                  setClientMenu(false);
                }}
              />
            ))}
          </Menu>
          <Menu
            visible={fournisseurMenu}
            onDismiss={() => setFournisseurMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setFournisseurMenu(true)}>
                Fournisseur: {fournisseurs.find(item => item.id === fournisseurId)?.nom ?? 'Choisir'}
              </Button>
            }>
            {fournisseurs.map(item => (
              <Menu.Item
                key={item.id}
                title={item.nom}
                onPress={() => {
                  setFournisseurId(item.id);
                  setFournisseurMenu(false);
                }}
              />
            ))}
          </Menu>
          <DocumentLineEditor produits={produits} lines={lines} onChange={setLines} />
          <TextInput mode="outlined" label="Notes" value={notes ?? ''} onChangeText={setNotes} multiline />
          <Text variant="titleMedium">
            {documentLabels[type]} • Sous-total estimé: {subtotal.toFixed(2)} MAD
          </Text>
          <Button
            mode="contained"
            onPress={async () => {
              const ok = await saveDocument({
                id: document?.id,
                type,
                date_document: date,
                client_id: clientId,
                fournisseur_id: fournisseurId,
                parent_document_id: document?.parent_document_id ?? null,
                notes,
                lines,
              });
              if (ok) {
                navigation.goBack();
              }
            }}>
            Enregistrer
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default DocumentFormScreen;
