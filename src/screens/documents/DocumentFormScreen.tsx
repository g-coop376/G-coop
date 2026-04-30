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
import { DOC_TYPE_CONFIG } from '../../types';

const COLORS = {
  grayLight: '#F9FAFB',
  white: '#FFFFFF',
  dark: '#111827',
  gray: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
};

const DOC_TYPES: DocumentType[] = ['bon_livraison', 'devis', 'facture'];

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
        <Text style={styles.sheetTitle}>Sélectionner un client</Text>
        <FlatList
          data={clients}
          keyExtractor={c => c.id}
          style={{ maxHeight: 380 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.clientRow, item.id === selectedId && styles.clientRowSelected]}
              onPress={() => { onSelect(item.id); onClose(); }}
            >
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarTxt}>{item.nom.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientNom}>{item.nom}</Text>
                {item.telephone ? <Text style={styles.clientTel}>{item.telephone}</Text> : null}
              </View>
              {item.id === selectedId && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#1A3C8F" />
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
  const initialType = route?.params?.type ?? document?.type ?? 'devis';
  const { clients, produits, saveDocument, exportAndShare } = useDocuments();

  const [type, setType] = React.useState<DocumentType>(initialType);
  const [date, setDate] = React.useState(document?.date_document ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState(document?.notes ?? '');
  const [clientId, setClientId] = React.useState<string | null>(document?.client_id ?? null);
  const [lieuLivraison, setLieuLivraison] = React.useState(document?.lieu_livraison ?? '');
  const [numeroCommande, setNumeroCommande] = React.useState(document?.numero_commande ?? '');
  const [lines, setLines] = React.useState<EditableDocumentLine[]>(
    document?.lignes?.map(line => ({
      produit_id: line.produit_id,
      ref: line.ref,
      designation: line.designation,
      quantite: line.quantite,
      prix_unitaire_ht: line.prix_unitaire_ht,
    })) ?? [{ produit_id: null, ref: '', designation: '', quantite: 1, prix_unitaire_ht: 0 }],
  );
  const [clientModal, setClientModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const selectedClient = clients.find(c => c.id === clientId);
  const config = DOC_TYPE_CONFIG[type];
  const subtotal = lines.reduce((s, l) => s + l.quantite * l.prix_unitaire_ht, 0);
  const tvaRate = 20;
  const tvaAmount = subtotal * (tvaRate / 100);
  const totalTTC = subtotal + tvaAmount;

  const handleSave = async (andShare = false) => {
    if (!clientId) {
      Alert.alert('Attention', 'Veuillez sélectionner un client');
      return;
    }
    if (lines.every(l => !l.designation && l.prix_unitaire_ht === 0)) {
      Alert.alert('Attention', 'Ajoutez au moins une ligne');
      return;
    }
    setSaving(true);
    const ok = await saveDocument({
      id: document?.id,
      type,
      date_document: date,
      client_id: clientId,
      lieu_livraison: type === 'bon_livraison' ? lieuLivraison : null,
      numero_commande: type === 'bon_livraison' ? numeroCommande : null,
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
      <View style={[styles.header, { backgroundColor: config.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {document ? 'Modifier' : 'Nouveau'} {config.label}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Type de document</Text>
          <View style={styles.typeRow}>
            {DOC_TYPES.map(dt => {
              const dc = DOC_TYPE_CONFIG[dt];
              return (
                <TouchableOpacity
                  key={dt}
                  style={[
                    styles.typeChip,
                    type === dt && { backgroundColor: dc.color, borderColor: dc.color },
                  ]}
                  onPress={() => setType(dt)}
                >
                  <MaterialCommunityIcons
                    name={dc.icon}
                    size={16}
                    color={type === dt ? '#FFF' : dc.color}
                  />
                  <Text style={[styles.typeChipTxt, type === dt && { color: '#FFF' }]}>
                    {dc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <View style={styles.inputWrap}>
            <View style={{ marginRight: 12 }}>
              <MaterialCommunityIcons name="calendar" size={20} color={config.color} />
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Client</Text>
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
                <MaterialCommunityIcons name="account-plus-outline" size={22} color={config.color} />
                <Text style={styles.selectPlaceholder}>Sélectionner un client</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.gray} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {type === 'bon_livraison' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Lieu de livraison</Text>
              <View style={styles.inputWrap}>
                <View style={{ marginRight: 12 }}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={config.color} />
                </View>
                <TextInput
                  style={styles.input}
                  mode="flat"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  value={lieuLivraison}
                  onChangeText={setLieuLivraison}
                  placeholder="Adresse de livraison"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Numéro de commande</Text>
              <View style={styles.inputWrap}>
                <View style={{ marginRight: 12 }}>
                  <MaterialCommunityIcons name="format-list-numbered" size={20} color={config.color} />
                </View>
                <TextInput
                  style={styles.input}
                  mode="flat"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  value={numeroCommande}
                  onChangeText={setNumeroCommande}
                  placeholder="N° commande client"
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <DocumentLineEditor produits={produits} lines={lines} onChange={setLines} />
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Montant HT</Text>
            <Text style={styles.summaryVal}>{subtotal.toFixed(2)} DH</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TVA (20%)</Text>
            <Text style={styles.summaryVal}>{tvaAmount.toFixed(2)} DH</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Montant TTC</Text>
            <Text style={[styles.totalVal, { color: config.color }]}>{totalTTC.toFixed(2)} DH</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            mode="outlined"
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes supplémentaires..."
            multiline
            numberOfLines={3}
            outlineStyle={{ borderColor: COLORS.border, borderRadius: 12 }}
          />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => handleSave(true)}
            disabled={saving}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={20} color={COLORS.danger} />
            <Text style={[styles.btnTxt, { color: COLORS.danger }]}>Sauvegarder & Imprimer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, { backgroundColor: config.color }, saving && { opacity: 0.6 }]}
            onPress={() => handleSave(false)}
            disabled={saving}
          >
            <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFF" />
            <Text style={[styles.btnTxt, { color: '#FFF' }]}>Sauvegarder</Text>
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
  sectionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray },

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
    backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center',
  },
  clientAvatarTxt: { fontWeight: '700', color: '#1A3C8F', fontSize: 15 },

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
  totalVal: { fontSize: 18, fontWeight: '800' },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  btnPrimary: { backgroundColor: '#1A3C8F' },
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
  clientRowSelected: { backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#1A3C8F' },
  clientNom: { fontSize: 15, fontWeight: '600', color: COLORS.dark },
  clientTel: { fontSize: 12, color: COLORS.gray },
});

export default DocumentFormScreen;
