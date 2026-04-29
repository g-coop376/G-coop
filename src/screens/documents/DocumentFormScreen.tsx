import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentLineEditor, { type EditableDocumentLine } from '../../components/documents/DocumentLineEditor';
import { useDocuments } from '../../hooks/useDocuments';
import type { Client, DocumentType, DocumentWithRelations } from '../../types';

const COLORS = {
  primary: '#1A3C8F',
  primaryLight: '#EEF2FF',
  success: '#16A34A',
  danger: '#DC2626',
  gray: '#6B7280',
  grayLight: '#F9FAFB',
  border: '#E5E7EB',
  white: '#FFFFFF',
  dark: '#111827',
  orange: '#F97316',
};

const DOC_TYPES: { type: DocumentType; label: string; labelAr: string; icon: string; color: string }[] = [
  { type: 'DEV', label: 'Devis', labelAr: 'عرض السعر', icon: 'file-document-outline', color: '#7C3AED' },
  { type: 'FAC', label: 'Facture', labelAr: 'فاتورة', icon: 'receipt', color: '#1A3C8F' },
  { type: 'BDC', label: 'Bon de commande', labelAr: 'طلب شراء', icon: 'cart-outline', color: '#D97706' },
  { type: 'BDL', label: 'Bon de livraison', labelAr: 'وصل تسليم', icon: 'truck-delivery-outline', color: '#16A34A' },
];

function ClientPickerModal({
  visible,
  clients,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  clients: Client[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>اختر العميل</Text>
        <FlatList
          data={clients}
          keyExtractor={c => c.id}
          style={{ maxHeight: 380 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.clientRow, item.id === selectedId && styles.clientRowSelected]}
              onPress={() => { onSelect(item.id); onClose(); }}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarTxt}>{item.nom.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientNom}>{item.nom}</Text>
                {item.telephone ? <Text style={styles.clientTel}>{item.telephone}</Text> : null}
              </View>
              {item.id === selectedId && (
                <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

function DocumentFormScreen({
  route,
  navigation,
}: {
  route?: { params?: { document?: DocumentWithRelations; type?: DocumentType } };
  navigation: { goBack: () => void; setOptions: (opts: object) => void };
}) {
  const document = route?.params?.document;
  const initialType = route?.params?.type ?? document?.type ?? 'FAC';
  const { clients, fournisseurs, produits, saveDocument, exportAndShare } = useDocuments();

  const [type, setType] = React.useState<DocumentType>(initialType);
  const [date, setDate] = React.useState(document?.date_document ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState(document?.notes ?? '');
  const [clientId, setClientId] = React.useState<string | null>(document?.client_id ?? null);
  const [fournisseurId] = React.useState<string | null>(document?.fournisseur_id ?? null);
  const [lines, setLines] = React.useState<EditableDocumentLine[]>(
    document?.lignes?.map(line => ({
      produit_id: line.produit_id,
      description: line.description,
      quantite: line.quantite,
      prix_unitaire: line.prix_unitaire,
    })) ?? [{ produit_id: null, description: '', quantite: 1, prix_unitaire: 0 }],
  );
  const [clientModal, setClientModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const selectedClient = clients.find(c => c.id === clientId);
  const subtotal = lines.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const selectedDocType = DOC_TYPES.find(d => d.type === type)!;

  const handleSave = async (andShare = false) => {
    if (!clientId && !fournisseurId) {
      Alert.alert('تنبيه', 'يرجى اختيار عميل أو مورد');
      return;
    }
    if (lines.every(l => !l.description && l.prix_unitaire === 0)) {
      Alert.alert('تنبيه', 'أضف منتجاً على الأقل');
      return;
    }
    setSaving(true);
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
    setSaving(false);
    if (ok) {
      if (andShare && document) {
        await exportAndShare(document);
      }
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-right" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{document ? 'تعديل وثيقة' : 'وثيقة جديدة'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>نوع الوثيقة</Text>
          <View style={styles.typeRow}>
            {DOC_TYPES.map(dt => (
              <TouchableOpacity
                key={dt.type}
                style={[styles.typeChip, type === dt.type && { backgroundColor: dt.color, borderColor: dt.color }]}
                onPress={() => setType(dt.type)}>
                <MaterialCommunityIcons
                  name={dt.icon}
                  size={16}
                  color={type === dt.type ? '#FFF' : dt.color}
                />
                <Text style={[styles.typeChipTxt, type === dt.type && { color: '#FFF' }]}>
                  {dt.labelAr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>التاريخ</Text>
          <View style={styles.inputWrap}>
      <View style={{ marginLeft: 12 }}>
  <MaterialCommunityIcons name="calendar" size={20} color={COLORS.primary} />
</View>
            <TextInput
              style={styles.input}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>العميل</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setClientModal(true)}>
            {selectedClient ? (
              <View style={styles.selectRow}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarTxt}>{selectedClient.nom.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectVal}>{selectedClient.nom}</Text>
                  {selectedClient.telephone ? <Text style={styles.selectSub}>{selectedClient.telephone}</Text> : null}
                </View>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.gray} />
              </View>
            ) : (
              <View style={styles.selectRow}>
                <MaterialCommunityIcons name="account-plus-outline" size={22} color={COLORS.primary} />
                <Text style={styles.selectPlaceholder}>اختر عميلاً</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.gray} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Lines */}
        <View style={styles.section}>
          <DocumentLineEditor produits={produits} lines={lines} onChange={setLines} />
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>المجموع الفرعي HT</Text>
            <Text style={styles.summaryVal}>{subtotal.toFixed(2)} DH</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>المجموع الكلي</Text>
            <Text style={styles.totalVal}>{subtotal.toFixed(2)} DH</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ملاحظات</Text>
          <TextInput
            mode="outlined"
            value={notes}
            onChangeText={setNotes}
            placeholder="ملاحظات إضافية..."
            multiline
            numberOfLines={3}
            outlineStyle={{ borderColor: COLORS.border, borderRadius: 12 }}
          />
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => handleSave(true)}
            disabled={saving}>
            <MaterialCommunityIcons name="file-pdf-box" size={20} color={COLORS.danger} />
            <Text style={[styles.btnTxt, { color: COLORS.danger }]}>حفظ و طباعة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, saving && { opacity: 0.6 }]}
            onPress={() => handleSave(false)}
            disabled={saving}>
            <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFF" />
            <Text style={[styles.btnTxt, { color: '#FFF' }]}>حفظ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ClientPickerModal
        visible={clientModal}
        clients={clients}
        selectedId={clientId}
        onSelect={setClientId}
        onClose={() => setClientModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.grayLight },

  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray, textAlign: 'right' },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  typeChipTxt: { fontSize: 12, fontWeight: '600', color: COLORS.dark },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  input: { flex: 1, backgroundColor: 'transparent', fontSize: 15 },

  selectBox: {
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 12,
  },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectVal: { fontSize: 15, fontWeight: '600', color: COLORS.dark, flex: 1 },
  selectSub: { fontSize: 12, color: COLORS.gray },
  selectPlaceholder: { flex: 1, color: COLORS.gray, fontSize: 14 },

  clientAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  clientAvatarTxt: { fontWeight: '700', color: COLORS.primary, fontSize: 15 },

  summaryBox: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: COLORS.gray, fontSize: 14 },
  summaryVal: { color: COLORS.dark, fontSize: 14, fontWeight: '600' },
  summaryTotal: {
    paddingTop: 10, marginTop: 4,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  totalLabel: { color: COLORS.dark, fontSize: 16, fontWeight: '700' },
  totalVal: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnOutline: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.danger },
  btnTxt: { fontWeight: '700', fontSize: 15 },

  overlay: { flex: 1, backgroundColor: '#00000055' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '70%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginBottom: 16 },

  clientRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, marginBottom: 8,
    backgroundColor: COLORS.grayLight,
  },
  clientRowSelected: { backgroundColor: COLORS.primaryLight, borderWidth: 1.5, borderColor: COLORS.primary },
  clientNom: { fontSize: 15, fontWeight: '600', color: COLORS.dark },
  clientTel: { fontSize: 12, color: COLORS.gray },
});

export default DocumentFormScreen;