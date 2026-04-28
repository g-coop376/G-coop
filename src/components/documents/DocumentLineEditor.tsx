import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Menu, Text, TextInput } from 'react-native-paper';
import type { Produit } from '../../types';

export interface EditableDocumentLine {
  produit_id: string | null;
  description: string;
  quantite: number;
  prix_unitaire: number;
}

interface DocumentLineEditorProps {
  produits: Produit[];
  lines: EditableDocumentLine[];
  onChange: (lines: EditableDocumentLine[]) => void;
}

function DocumentLineEditor({
  produits,
  lines,
  onChange,
}: DocumentLineEditorProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const updateLine = (
    index: number,
    key: keyof EditableDocumentLine,
    value: string | number | null,
  ) => {
    const next = [...lines];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const addLine = () => {
    onChange([
      ...lines,
      { produit_id: null, description: '', quantite: 1, prix_unitaire: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    onChange(lines.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Lignes du document</Text>
      {lines.map((line, index) => (
        <View key={`${line.produit_id ?? 'line'}-${index}`} style={styles.line}>
          <Menu
            visible={openIndex === index}
            onDismiss={() => setOpenIndex(null)}
            anchor={
              <Button mode="outlined" onPress={() => setOpenIndex(index)}>
                {line.description || 'Choisir un produit'}
              </Button>
            }>
            {produits.map(produit => (
              <Menu.Item
                key={produit.id}
                title={produit.nom}
                onPress={() => {
                  updateLine(index, 'produit_id', produit.id);
                  updateLine(index, 'description', produit.nom);
                  updateLine(index, 'prix_unitaire', produit.prix_unitaire);
                  setOpenIndex(null);
                }}
              />
            ))}
          </Menu>
          <TextInput
            mode="outlined"
            label="Description"
            value={line.description}
            onChangeText={text => updateLine(index, 'description', text)}
          />
          <View style={styles.row}>
            <TextInput
              style={styles.field}
              mode="outlined"
              label="Qté"
              keyboardType="numeric"
              value={String(line.quantite)}
              onChangeText={text =>
                updateLine(index, 'quantite', Number(text) || 0)
              }
            />
            <TextInput
              style={styles.field}
              mode="outlined"
              label="PU"
              keyboardType="numeric"
              value={String(line.prix_unitaire)}
              onChangeText={text =>
                updateLine(index, 'prix_unitaire', Number(text) || 0)
              }
            />
          </View>
          <Button onPress={() => removeLine(index)}>Retirer</Button>
        </View>
      ))}
      <Button mode="contained-tonal" onPress={addLine}>
        Ajouter une ligne
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  line: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  field: {
    flex: 1,
  },
});

export default DocumentLineEditor;
