import React from 'react';
import { FlatList } from 'react-native';
import { FAB, Button, Card, Text } from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useDocuments } from '../../hooks/useDocuments';
import type { DocumentWithRelations } from '../../types';
import { documentLabels, getDocumentImpact } from '../../utils/numerotation';

function DocumentActions({
  document,
  onValidate,
  onConvert,
  onShare,
}: {
  document: DocumentWithRelations;
  onValidate: () => void;
  onConvert: (type: 'FAC' | 'BDL') => void;
  onShare: () => void;
}) {
  return (
    <>
      {document.statut !== 'valide' ? <Button onPress={onValidate}>Valider</Button> : null}
      {document.type === 'DEV' ? <Button onPress={() => onConvert('FAC')}>Convertir en facture</Button> : null}
      {document.type === 'FAC' ? <Button onPress={() => onConvert('BDL')}>Générer BDL</Button> : null}
      <Button onPress={onShare}>PDF / Partager</Button>
    </>
  );
}

function DocumentsListScreen({
  navigation,
}: {
  navigation: { navigate: (screen: string, params?: { document?: DocumentWithRelations }) => void };
}) {
  const { documents, loading, updateStatus, duplicateDocument, exportAndShare } = useDocuments();

  return (
    <ScreenContainer title="Documents" loading={loading}>
      <FlatList
        data={documents}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleMedium">
                {documentLabels[item.type]} {item.numero}
              </Text>
              <Text>{item.total_ttc.toFixed(2)} MAD • {item.statut}</Text>
              <Text>{getDocumentImpact(item.type)}</Text>
              <Button onPress={() => navigation.navigate('DocumentForm', { document: item })}>
                Modifier
              </Button>
              <DocumentActions
                document={item}
                onValidate={() => updateStatus(item.id, 'valide')}
                onConvert={type => duplicateDocument(item, type)}
                onShare={() => exportAndShare(item)}
              />
            </Card.Content>
          </Card>
        )}
      />
      <FAB icon="plus" onPress={() => navigation.navigate('DocumentForm')} style={{ position: 'absolute', right: 16, bottom: 24 }} />
    </ScreenContainer>
  );
}

export default DocumentsListScreen;
