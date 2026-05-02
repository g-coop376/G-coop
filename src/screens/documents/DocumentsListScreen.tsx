import React from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useDocuments } from '../../hooks/useDocuments';
import type { DocumentType, DocumentWithRelations } from '../../types';
import { DOC_TYPE_CONFIG, getStatusColor, getStatusLabel } from '../../types';

const DOC_TYPES: DocumentType[] = ['bon_livraison', 'devis', 'facture'];

const COLORS = {
  bg: '#F4F6FA',
  white: '#FFFFFF',
  dark: '#0F1C2E',
  gray: '#8A96A8',
  border: '#E8ECF2',
  headerBg: '#0F1C2E',
};

function DocumentCard({
  doc,
  onPress,
}: {
  doc: DocumentWithRelations;
  onPress: () => void;
}) {
  const config = DOC_TYPE_CONFIG[doc.type];
  const statusColor = getStatusColor(doc.statut);
  const statusLabel = getStatusLabel(doc.statut);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: config.color }]} />

      <View style={styles.cardInner}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={[styles.iconCircle, { backgroundColor: config.color + '18' }]}>
              <MaterialCommunityIcons name={config.icon} size={18} color={config.color} />
            </View>
            <Text style={styles.cardNumero}>{doc.numero}</Text>
          </View>
          <Text style={[styles.montant, { color: config.color }]}>
            {doc.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
          </Text>
        </View>

        {/* Client */}
        <Text style={styles.clientName} numberOfLines={1}>
          {doc.client?.nom ?? 'Client non spécifié'}
        </Text>

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-outline" size={13} color={COLORS.gray} />
            <Text style={styles.dateText}>
              {new Date(doc.date_document).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '15', borderColor: statusColor + '40', borderWidth: 1 }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DocumentsListScreen({
  navigation,
}: {
  navigation: {
    navigate: (screen: string, params?: object) => void;
    addListener: (event: string, callback: () => void) => () => void;
  };
}) {
  const { t } = useTranslation();
  const { documents, loading, fetchDocuments } = useDocuments();
  const [activeTab, setActiveTab] = React.useState<DocumentType>('bon_livraison');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void fetchDocuments();
    });
    return unsubscribe;
  }, [navigation, fetchDocuments]);

  const filteredDocs = documents
    .filter(d => d.type === activeTab)
    .filter(d => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        d.numero?.toLowerCase().includes(q) ||
        d.client?.nom?.toLowerCase().includes(q)
      );
    });

  const config = DOC_TYPE_CONFIG[activeTab];

  // Count per type
  const counts = DOC_TYPES.reduce((acc, t) => {
    acc[t] = documents.filter(d => d.type === t).length;
    return acc;
  }, {} as Record<DocumentType, number>);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('documents')}</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: config.color }]}
            onPress={() => navigation.navigate('DocumentForm', { type: activeTab })}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_document')}
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs — underline style */}
      <View style={styles.tabBar}>
        {DOC_TYPES.map(type => {
          const tc = DOC_TYPE_CONFIG[type];
          const isActive = type === activeTab;
          return (
            <TouchableOpacity
              key={type}
              style={styles.tabItem}
              onPress={() => setActiveTab(type)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <MaterialCommunityIcons
                  name={tc.icon}
                  size={16}
                  color={isActive ? tc.color : COLORS.gray}
                />
                <Text style={[styles.tabLabel, isActive && { color: tc.color }]}>
                  {tc.label}
                </Text>
                {counts[type] > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: isActive ? tc.color : COLORS.border }]}>
                    <Text style={[styles.tabBadgeText, { color: isActive ? '#FFF' : COLORS.gray }]}>
                      {counts[type]}
                    </Text>
                  </View>
                )}
              </View>
              {isActive && <View style={[styles.tabUnderline, { backgroundColor: tc.color }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {filteredDocs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: config.color + '12' }]}>
            <MaterialCommunityIcons name={config.icon} size={48} color={config.color + '80'} />
          </View>
          <Text style={styles.emptyTitle}>{t('no_document')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('tap_to_create')} {config.label.toLowerCase()}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDocs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              doc={item}
              onPress={() => navigation.navigate('DocumentForm', { document: item })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchDocuments}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    backgroundColor: COLORS.headerBg,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    padding: 0,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 3,
  },

  // List
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 100,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: { width: 4 },
  cardInner: { flex: 1, padding: 14, gap: 6 },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumero: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  montant: {
    fontSize: 16,
    fontWeight: '800',
  },

  clientName: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DocumentsListScreen;