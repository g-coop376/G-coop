import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput as PaperInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import DocumentLineEditor, { type EditableDocumentLine } from '../../components/documents/DocumentLineEditor';
import { useDocuments } from '../../hooks/useDocuments';
import type { Client, DocumentType, DocumentWithRelations } from '../../types';
import { DOC_TYPE_CONFIG } from '../../types';
import { COLORS, RADIUS, SPACING } from '../../theme/theme';

const DOC_TYPES: DocumentType[] = ['facture', 'bon_commande', 'bon_livraison'];

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
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{t('select_client')}</Text>
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
  const { t } = useTranslation();
  const document = route?.params?.document;
  const initialType = route?.params?.type ?? document?.type ?? 'facture';
  const { clients, produits, saveDocument, exportAndShare } = useDocuments();
  const isRTL = I18nManager.isRTL;

  const [type, setType] = React.useState<DocumentType>(initialType);
  const [date, setDate] = React.useState(document?.date_document ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState(document?.notes ?? '');
  const [clientId, setClientId] = React.useState<string | null>(document?.client_id ?? null);
  const [lieuLivraison, setLieuLivraison] = React.useState(document?.lieu_livraison ?? '');
  const [numeroCommande, setNumeroCommande] = React.useState(document?.numero_commande ?? '');
  const [paymentMethod, setPaymentMethod] = React.useState<string>('cash');
  const [deliveryFee, setDeliveryFee] = React.useState<number>(0);
  const [lines, setLines] = React.useState<EditableDocumentLine[]>(
    document?.lignes?.map(line => ({
      produit_id: line.produit_id,
      ref: line.ref ?? '',
      designation: line.designation,
      quantite: line.quantite,
      unite: line.unite || 'Pièce',
      prix_unitaire_ht: line.prix_unitaire_ht,
    })) ?? [{ produit_id: null, ref: '', designation: '', quantite: 1, unite: 'Pièce', prix_unitaire_ht: 0 }],
  );
  const [clientModal, setClientModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const selectedClient = clients.find(c => c.id === clientId);
  const config = DOC_TYPE_CONFIG[type];

  const subtotal = lines.reduce((s, l) => s + l.quantite * l.prix_unitaire_ht, 0);
  const totalTTC = subtotal + deliveryFee;

  const handleSave = async (andShare = false) => {
    if (!clientId) {
      Alert.alert(t('error'), t('select_client_required'));
      return;
    }
    if (lines.every(l => !l.designation && l.prix_unitaire_ht === 0)) {
      Alert.alert(t('error'), t('add_line_required'));
      return;
    }
    setSaving(true);
    const ok = await saveDocument({
      id: document?.id,
      type,
      date_document: date,
      client_id: clientId,
      lieu_livraison: type === 'bon_livraison' ? lieuLivraison : null,
      numero_commande: type === 'bon_commande' ? numeroCommande : null,
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

  const renderSectionCard = (title: string, icon: string, children: React.ReactNode) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIconBg, { backgroundColor: config.color + '15' }]}>
            <MaterialCommunityIcons name={icon} size={18} color={config.color} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <View style={[styles.header, { backgroundColor: config.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name={isRTL ? 'arrow-right' : 'arrow-left'} size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config.label}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => document && exportAndShare(document)}>
          <MaterialCommunityIcons name="share-variant" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type de document */}
        {renderSectionCard(t('document_type'), 'file-document-edit-outline', (
          <View style={styles.typeRow}>
            {DOC_TYPES.map(dt => {
              const dc = DOC_TYPE_CONFIG[dt];
              const isActive = type === dt;
              return (
                <TouchableOpacity
                  key={dt}
                  style={[
                    styles.typeChip,
                    isActive && { backgroundColor: dc.color, borderColor: dc.color },
                  ]}
                  onPress={() => setType(dt)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={dc.icon}
                    size={16}
                    color={isActive ? '#FFF' : dc.color}
                  />
                  <Text style={[styles.typeChipTxt, isActive && { color: '#FFF' }]}>
                    {dc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Info coopérative */}
        {renderSectionCard(t('coop_info'), 'office-building-outline', (
          <View style={styles.coopInfo}>
            <View style={styles.coopLogoRow}>
              <View style={[styles.coopLogo, { backgroundColor: config.color + '15' }]}>
                <MaterialCommunityIcons name="handshake" size={28} color={config.color} />
              </View>
              <View>
                <Text style={styles.coopName}>COOP ONAS9</Text>
                <Text style={styles.coopSubtitle}>Coopérative Agricole</Text>
              </View>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textGray} />
                <Text style={styles.infoText}>Douar Onas9, Commune Rurale Ait Ourir</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="phone-outline" size={14} color={COLORS.textGray} />
                <Text style={styles.infoText}>+212 6 12 34 56 78</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="card-account-details-outline" size={14} color={COLORS.textGray} />
                <Text style={styles.infoText}>ICE: 00123456700012</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="email-outline" size={14} color={COLORS.textGray} />
                <Text style={styles.infoText}>contact@cooponas9.ma</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Info document */}
        {renderSectionCard(t('document_info'), 'information-outline', (
          <>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('date')}</Text>
                <View style={styles.inputWrap}>
                  <MaterialCommunityIcons name="calendar" size={18} color={config.color} />
                  <PaperInput
                    value={date}
                    onChangeText={setDate}
                    style={styles.dateInput}
                    mode="flat"
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    dense
                  />
                </View>
              </View>
            </View>

            {type === 'bon_commande' && (
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('payment_delay')}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={config.color} />
                    <Text style={styles.inputValue}>30 jours</Text>
                  </View>
                </View>
              </View>
            )}

            {type === 'facture' && (
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('payment_method')}</Text>
                  <View style={styles.paymentRow}>
                    {[
                      { key: 'cash', icon: 'cash', label: t('cash') },
                      { key: 'check', icon: 'check', label: t('check') },
                      { key: 'transfer', icon: 'bank-transfer', label: t('transfer') },
                    ].map(pm => (
                      <TouchableOpacity
                        key={pm.key}
                        style={[styles.paymentChip, paymentMethod === pm.key && { backgroundColor: config.color, borderColor: config.color }]}
                        onPress={() => setPaymentMethod(pm.key)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={pm.icon}
                          size={14}
                          color={paymentMethod === pm.key ? '#FFF' : config.color}
                        />
                        <Text style={[styles.paymentChipTxt, paymentMethod === pm.key && { color: '#FFF' }]}>
                          {pm.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {type === 'bon_livraison' && (
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('delivery_location')}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="map-marker" size={18} color={config.color} />
                    <PaperInput
                      value={lieuLivraison}
                      onChangeText={setLieuLivraison}
                      placeholder="Taroudant"
                      style={styles.dateInput}
                      mode="flat"
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      dense
                    />
                  </View>
                </View>
              </View>
            )}
          </>
        ))}

        {/* Client */}
        {renderSectionCard(t('client'), 'account-outline', (
          <TouchableOpacity style={styles.selectBox} onPress={() => setClientModal(true)} activeOpacity={0.7}>
            {selectedClient ? (
              <View style={styles.selectRow}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarTxt}>{selectedClient.nom.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectVal}>{selectedClient.nom}</Text>
                  {selectedClient.telephone ? <Text style={styles.selectSub}>{selectedClient.telephone}</Text> : null}
                  {selectedClient.adresse ? <Text style={styles.selectSub}>{selectedClient.adresse}</Text> : null}
                </View>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textGray} />
              </View>
            ) : (
              <View style={styles.selectRow}>
                <MaterialCommunityIcons name="account-plus-outline" size={22} color={config.color} />
                <Text style={styles.selectPlaceholder}>{t('select_client')}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textGray} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Lignes de produits */}
        <View style={styles.card}>
          <DocumentLineEditor
            produits={produits}
            lines={lines}
            onChange={setLines}
            accentColor={config.color}
          />
        </View>

        {/* Totaux */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardIconBg, { backgroundColor: config.color + '15' }]}>
                <MaterialCommunityIcons name="calculator" size={18} color={config.color} />
              </View>
              <Text style={styles.cardTitle}>{t('total')}</Text>
            </View>
          </View>

          <View style={styles.totalsContainer}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLineLabel}>{t('subtotal')}</Text>
              <Text style={styles.totalLineValue}>{subtotal.toFixed(2)} DH</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLineLabel}>{t('delivery')}</Text>
              <Text style={styles.totalLineValue}>{deliveryFee.toFixed(2)} DH</Text>
            </View>
            <View style={[styles.totalLine, styles.totalGrand, { backgroundColor: config.color }]}>
              <Text style={styles.totalGrandLabel}>{t('net_to_pay')}</Text>
              <Text style={styles.totalGrandValue}>{totalTTC.toFixed(2)} DH</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {renderSectionCard(t('notes'), 'note-text-outline', (
          <View style={styles.notesArea}>
            <PaperInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('additional_notes')}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
          </View>
        ))}

        {/* Signatures */}
        {renderSectionCard(t('signature'), 'pencil-outline', (
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>{t('client_signature')}</Text>
              <View style={styles.signatureSpace}>
                <Text style={styles.signatureHint}>Signature</Text>
              </View>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>{t('supplier_signature')}</Text>
              <View style={styles.signatureSpace}>
                <View style={styles.stampPlaceholder}>
                  <MaterialCommunityIcons name="stamp" size={24} color={COLORS.grayMedium} />
                  <Text style={styles.stampText}>{t('stamp')}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Boutons d'action */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => handleSave(true)}
            disabled={saving}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={20} color={COLORS.danger} />
            <Text style={[styles.btnTxt, { color: COLORS.danger }]}>{t('save_and_print')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, { backgroundColor: config.color }, saving && { opacity: 0.6 }]}
            onPress={() => handleSave(false)}
            disabled={saving}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFF" />
            <Text style={[styles.btnTxt, { color: '#FFF' }]}>{t('save_document')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>

      <ClientPickerModal
        visible={clientModal}
        clients={clients}
        selectedId={clientId}
        onSelect={setClientId}
        onClose={() => setClientModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.lg,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  cardIconBg: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  typeChipTxt: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },

  coopInfo: { gap: SPACING.sm },
  coopLogoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  coopLogo: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coopName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  coopSubtitle: { fontSize: 12, color: COLORS.textGray },
  infoGrid: { gap: SPACING.xs },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoText: { fontSize: 13, color: COLORS.textGray },

  inputRow: { marginBottom: SPACING.sm },
  inputGroup: { gap: SPACING.xs },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textGray },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
  dateInput: { flex: 1, backgroundColor: 'transparent', height: 20, padding: 0 },

  paymentRow: { flexDirection: 'row', gap: SPACING.sm },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  paymentChipTxt: { fontSize: 11, fontWeight: '600', color: COLORS.textDark },

  selectBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  selectVal: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, flex: 1 },
  selectSub: { fontSize: 12, color: COLORS.textGray },
  selectPlaceholder: { flex: 1, color: COLORS.textGray, fontSize: 14 },

  clientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarTxt: { fontWeight: '700', color: COLORS.primary, fontSize: 16 },

  totalsContainer: { gap: SPACING.sm },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  totalLineLabel: { color: COLORS.textGray, fontSize: 14 },
  totalLineValue: { color: COLORS.textDark, fontSize: 14, fontWeight: '600' },
  totalGrand: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  totalGrandLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '700' },
  totalGrandValue: { color: '#FFF', fontSize: 20, fontWeight: '800' },

  notesArea: {
    minHeight: 80,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesInput: { backgroundColor: 'transparent', fontSize: 14 },

  signatureRow: { flexDirection: 'row', gap: SPACING.md },
  signatureBox: { flex: 1, gap: SPACING.sm },
  signatureTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textGray },
  signatureSpace: {
    height: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  signatureHint: { fontSize: 12, color: COLORS.grayMedium, fontStyle: 'italic' },
  stampPlaceholder: { alignItems: 'center', gap: 4 },
  stampText: { fontSize: 10, color: COLORS.grayMedium },

  btnRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnOutline: { backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.danger },
  btnTxt: { fontWeight: '700', fontSize: 15 },

  overlay: { flex: 1, backgroundColor: '#00000055' },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
    maxHeight: '70%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.lg },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, textAlign: 'center', marginBottom: SPACING.lg },

  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  clientRowSelected: { backgroundColor: COLORS.lightBlue, borderWidth: 1.5, borderColor: COLORS.primary },
  clientNom: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  clientTel: { fontSize: 12, color: COLORS.textGray },
});

export default DocumentFormScreen;