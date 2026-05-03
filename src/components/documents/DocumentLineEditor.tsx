import React from 'react';
import { StyleSheet, TouchableOpacity, View, I18nManager } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { Produit, EditableDocumentLine } from '../../types';
import { COLORS, RADIUS, SPACING } from '../../theme/theme';

export type { EditableDocumentLine };

interface DocumentLineEditorProps {
  produits: Produit[];
  lines: EditableDocumentLine[];
  onChange: (lines: EditableDocumentLine[]) => void;
  accentColor: string;
}

function LineItem({
  line,
  index,
  produits,
  onUpdate,
  onRemove,
  accentColor,
}: {
  line: EditableDocumentLine;
  index: number;
  produits: Produit[];
  onUpdate: (key: keyof EditableDocumentLine, value: string | number | null) => void;
  onRemove: () => void;
  accentColor: string;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isRTL = I18nManager.isRTL;

  const totalHt = line.quantite * line.prix_unitaire_ht;

  const selectProduit = (produit: Produit) => {
    onUpdate('produit_id', produit.id);
    onUpdate('ref', produit.nom.substring(0, 10).toUpperCase());
    onUpdate('designation', produit.nom);
    onUpdate('prix_unitaire_ht', produit.prix_unitaire);
    if (produit.unite) {
      onUpdate('unite', produit.unite);
    }
    setMenuOpen(false);
  };

  const incrementQty = () => {
    onUpdate('quantite', line.quantite + 1);
  };

  const decrementQty = () => {
    if (line.quantite > 1) {
      onUpdate('quantite', line.quantite - 1);
    }
  };

  return (
    <View style={styles.lineCard}>
      <View style={styles.lineHeader}>
        <View style={styles.lineHeaderLeft}>
          <View style={[styles.lineBadge, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.lineBadgeText, { color: accentColor }]}>{index + 1}</Text>
          </View>
          <Text style={styles.lineDesignation} numberOfLines={1}>
            {line.designation || t('select_product')}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onRemove}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.productSelector}>
        <TouchableOpacity
          style={styles.produitBtn}
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="package-variant" size={18} color={COLORS.textGray} />
          <Text style={styles.produitBtnText} numberOfLines={1}>
            {line.designation || t('select_product')}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.textGray} />
        </TouchableOpacity>

        <View style={styles.menuDropdown} pointerEvents={menuOpen ? 'auto' : 'none'}>
          {menuOpen && (
            <View style={styles.menuList}>
              {produits.map(produit => (
                <TouchableOpacity
                  key={produit.id}
                  style={styles.menuItem}
                  onPress={() => selectProduit(produit)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.menuItemText} numberOfLines={1}>{produit.nom}</Text>
                  <Text style={styles.menuItemPrice}>{produit.prix_unitaire} DH</Text>
                </TouchableOpacity>
              ))}
              {produits.length === 0 && (
                <View style={styles.menuEmpty}>
                  <Text style={styles.menuEmptyText}>{t('no_product')}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.fieldsGrid}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('ref')}</Text>
          <TextInput
            mode="outlined"
            value={line.ref}
            onChangeText={text => onUpdate('ref', text)}
            style={styles.fieldInput}
            contentStyle={styles.fieldContent}
            outlineStyle={[styles.fieldOutline, { borderColor: COLORS.border }]}
            dense
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('unit')}</Text>
          <TextInput
            mode="outlined"
            value={line.unite}
            onChangeText={text => onUpdate('unite', text)}
            placeholder="Pièce"
            style={styles.fieldInput}
            contentStyle={styles.fieldContent}
            outlineStyle={[styles.fieldOutline, { borderColor: COLORS.border }]}
            dense
          />
        </View>
      </View>

      <View style={styles.qtyPriceRow}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('qty')}</Text>
          <View style={styles.qtyStepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, line.quantite <= 1 && styles.stepperBtnDisabled]}
              onPress={decrementQty}
              disabled={line.quantite <= 1}
              activeOpacity={0.6}
            >
              <MaterialCommunityIcons
                name="minus"
                size={18}
                color={line.quantite <= 1 ? COLORS.grayMedium : COLORS.primary}
              />
            </TouchableOpacity>
            <TextInput
              mode="flat"
              keyboardType="numeric"
              value={String(line.quantite)}
              onChangeText={text => {
                const val = parseInt(text, 10);
                if (!isNaN(val) && val > 0) {
                  onUpdate('quantite', val);
                } else if (text === '') {
                  onUpdate('quantite', 1);
                }
              }}
              style={styles.qtyInput}
              contentStyle={[styles.qtyInputContent, { textAlign: isRTL ? 'right' : 'left' }]}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={incrementQty}
              activeOpacity={0.6}
            >
              <MaterialCommunityIcons name="plus" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.fieldGroup, styles.priceField]}>
          <Text style={styles.fieldLabel}>{t('price')} (DH)</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={String(line.prix_unitaire_ht)}
            onChangeText={text => {
              const val = parseFloat(text);
              onUpdate('prix_unitaire_ht', isNaN(val) ? 0 : val);
            }}
            style={styles.fieldInput}
            contentStyle={[styles.fieldContent, { textAlign: isRTL ? 'right' : 'left' }]}
            outlineStyle={[styles.fieldOutline, { borderColor: COLORS.border }]}
            dense
          />
        </View>
      </View>

      <View style={[styles.totalRow, { borderTopColor: COLORS.border }]}>
        <Text style={styles.totalLabel}>{t('total_line')}</Text>
        <Text style={[styles.totalValue, { color: accentColor }]}>{totalHt.toFixed(2)} DH</Text>
      </View>
    </View>
  );
}

function DocumentLineEditor({
  produits,
  lines,
  onChange,
  accentColor,
}: DocumentLineEditorProps) {
  const { t } = useTranslation();

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
      { produit_id: null, ref: '', designation: '', quantite: 1, unite: 'Pièce', prix_unitaire_ht: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <View style={styles.tableHeaderLeft}>
          <MaterialCommunityIcons name="table" size={18} color={accentColor} />
          <Text style={styles.tableHeaderTitle}>{t('products_table')}</Text>
        </View>
        <View style={[styles.tableHeaderCount, { backgroundColor: accentColor + '15' }]}>
          <Text style={[styles.tableHeaderCountText, { color: accentColor }]}>
            {lines.length} {t('line')}{lines.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.columnHeaders}>
        <Text style={styles.colHeader}>{t('ref')}</Text>
        <Text style={styles.colHeader}>{t('description')}</Text>
        <Text style={styles.colHeaderCenter}>{t('qty')}</Text>
        <Text style={styles.colHeaderCenter}>{t('unit')}</Text>
        <Text style={styles.colHeaderCenter}>{t('price')}</Text>
        <Text style={styles.colHeaderCenter}>{t('total_line')}</Text>
      </View>

      {lines.map((line, index) => (
        <LineItem
          key={`${line.produit_id ?? 'line'}-${index}`}
          line={line}
          index={index}
          produits={produits}
          onUpdate={(key, value) => updateLine(index, key, value)}
          onRemove={() => removeLine(index)}
          accentColor={accentColor}
        />
      ))}

      <TouchableOpacity
        style={[styles.addBtn, { borderColor: COLORS.border }]}
        onPress={addLine}
        activeOpacity={0.6}
      >
        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.primary} />
        <Text style={styles.addBtnText}>{t('add_line')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  tableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tableHeaderTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  tableHeaderCount: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tableHeaderCountText: { fontSize: 12, fontWeight: '600' },

  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.grayLight,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  colHeader: { flex: 2, fontSize: 11, fontWeight: '600', color: COLORS.textGray },
  colHeaderCenter: { flex: 1, fontSize: 11, fontWeight: '600', color: COLORS.textGray, textAlign: 'center' },

  lineCard: {
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: SPACING.sm,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  lineBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineBadgeText: { fontSize: 12, fontWeight: '700' },
  lineDesignation: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, flex: 1 },
  deleteBtn: { padding: SPACING.xs },

  productSelector: { position: 'relative' },
  produitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  produitBtnText: { flex: 1, fontSize: 13, color: COLORS.textDark },
  menuDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100 },
  menuList: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 180,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: { fontSize: 13, color: COLORS.textDark, flex: 1 },
  menuItemPrice: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  menuEmpty: { padding: SPACING.xxl, alignItems: 'center' },
  menuEmptyText: { fontSize: 13, color: COLORS.textGray },

  fieldsGrid: { flexDirection: 'row', gap: SPACING.sm },
  fieldGroup: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textGray },
  fieldInput: { backgroundColor: 'transparent' },
  fieldContent: { fontSize: 13, height: 24 },
  fieldOutline: { borderRadius: RADIUS.sm, height: 40 },

  qtyPriceRow: { flexDirection: 'row', gap: SPACING.sm },
  priceField: { flex: 1.2 },

  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
  },
  stepperBtnDisabled: { backgroundColor: COLORS.grayLight },
  qtyInput: { flex: 1, backgroundColor: 'transparent' },
  qtyInputContent: { fontSize: 14, fontWeight: '600', height: 40 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textGray },
  totalValue: { fontSize: 15, fontWeight: '700' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: COLORS.lightBlue + '40',
    marginTop: SPACING.xs,
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});

export default DocumentLineEditor;