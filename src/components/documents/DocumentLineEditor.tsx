import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Menu, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Produit } from '../../types';

export interface EditableDocumentLine {
  produit_id: string | null;
  ref: string;
  designation: string;
  quantite: number;
  prix_unitaire_ht: number;
}

interface DocumentLineEditorProps {
  produits: Produit[];
  lines: EditableDocumentLine[];
  onChange: (lines: EditableDocumentLine[]) => void;
}

function LineItem({
  line,
  index,
  produits,
  onUpdate,
  onRemove,
}: {
  line: EditableDocumentLine;
  index: number;
  produits: Produit[];
  onUpdate: (key: keyof EditableDocumentLine, value: string | number | null) => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const totalHt = line.quantite * line.prix_unitaire_ht;

  const selectProduit = (produit: Produit) => {
    onUpdate('produit_id', produit.id);
    onUpdate('ref', produit.nom.substring(0, 10).toUpperCase());
    onUpdate('designation', produit.nom);
    onUpdate('prix_unitaire_ht', produit.prix_unitaire);
    setMenuOpen(false);
  };

  return (
    <View style={styles.lineCard}>
          <View style={styles.lineHeader}>
            <Text style={styles.lineNumber}>Ligne {index + 1}</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={onRemove}>
              <MaterialCommunityIcons name="delete-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>

          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={
              <TouchableOpacity style={styles.produitBtn} onPress={() => setMenuOpen(true)}>
                <MaterialCommunityIcons name="package-variant" size={18} color="#6B7280" />
                <Text style={styles.produitBtnText}>
                  {line.designation || 'Choisir un produit'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color="#6B7280" />
              </TouchableOpacity>
            }
          >
            {produits.map(produit => (
              <Menu.Item
                key={produit.id}
                title={`${produit.nom} - ${produit.prix_unitaire} DH`}
                onPress={() => selectProduit(produit)}
              />
            ))}
          </Menu>

          <View style={styles.fieldsRow}>
            <View style={styles.smallField}>
              <TextInput
                mode="outlined"
                label="Ref"
                value={line.ref}
                onChangeText={text => onUpdate('ref', text)}
                style={styles.input}
                outlineStyle={styles.outlineStyle}
              />
            </View>
            <View style={styles.smallField}>
              <TextInput
                mode="outlined"
                label="Qté"
                keyboardType="numeric"
                value={String(line.quantite)}
                onChangeText={text => onUpdate('quantite', Number(text) || 0)}
                style={styles.input}
                outlineStyle={styles.outlineStyle}
              />
            </View>
            <View style={styles.smallField}>
              <TextInput
                mode="outlined"
                label="Prix unit. HT"
                keyboardType="numeric"
                value={String(line.prix_unitaire_ht)}
                onChangeText={text => onUpdate('prix_unitaire_ht', Number(text) || 0)}
                style={styles.input}
                outlineStyle={styles.outlineStyle}
              />
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT:</Text>
            <Text style={styles.totalValue}>{totalHt.toFixed(2)} DH</Text>
          </View>
      </View>
  );
}

function DocumentLineEditor({
  produits,
  lines,
  onChange,
}: DocumentLineEditorProps) {
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
      { produit_id: null, ref: '', designation: '', quantite: 1, prix_unitaire_ht: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderTitle}>Lignes du document</Text>
        <Text style={styles.tableHeaderCount}>{lines.length} ligne{lines.length > 1 ? 's' : ''}</Text>
      </View>

      {lines.map((line, index) => (
        <LineItem
          key={`${line.produit_id ?? 'line'}-${index}`}
          line={line}
          index={index}
          produits={produits}
          onUpdate={(key, value) => updateLine(index, key, value)}
          onRemove={() => removeLine(index)}
        />
      ))}

      <Button
        mode="outlined"
        onPress={addLine}
        icon="plus"
        style={styles.addBtn}
        labelStyle={styles.addBtnLabel}
      >
        Ajouter une ligne
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tableHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tableHeaderCount: { fontSize: 13, color: '#6B7280' },

  lineCard: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineNumber: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  deleteBtn: { padding: 4 },

  produitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  produitBtnText: { flex: 1, fontSize: 14, color: '#111827' },

  fieldsRow: { flexDirection: 'row', gap: 8 },
  smallField: { flex: 1 },
  input: { backgroundColor: 'transparent', fontSize: 14 },
  outlineStyle: { borderRadius: 8 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  totalValue: { fontSize: 14, fontWeight: '700', color: '#1A3C8F' },

  addBtn: { marginTop: 4, borderRadius: 10, borderColor: '#E5E7EB' },
  addBtnLabel: { fontWeight: '600' },
});

export default DocumentLineEditor;
