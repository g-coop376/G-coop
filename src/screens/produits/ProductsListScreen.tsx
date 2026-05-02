import React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { FAB, Searchbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProduits } from '../../hooks/useProduits';
import type { Produit } from '../../types';

function ProductsListScreen({
  navigation,
}: {
  navigation: { navigate: (screen: string, params?: { produit?: Produit }) => void };
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { produits, loading, search, setSearch } = useProduits();

  // Header bleu
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Icon name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المنتجات</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm')}>
          <Icon name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Search bar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchWrapper}>
        <Icon name="magnify" size={22} color="#9CA3AF" />
        <Searchbar
          placeholder="بحث عن منتج..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon={() => null}
          clearIcon={() => <Icon name="close" size={20} color="#9CA3AF" />}
        />
      </View>
      <TouchableOpacity style={styles.filterButton}>
        <Icon name="filter-variant" size={22} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  // En-têtes du tableau
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, { flex: 1.5, textAlign: 'right' }]}>المنتج</Text>
      <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>الكمية</Text>
      <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>السعر</Text>
    </View>
  );

  // Composant pour l'image avec gestion d'erreur
  const ProductImage = ({ photoUrl }: { photoUrl: string | null }) => {
    const [error, setError] = React.useState(false);
    const [imgLoading, setImgLoading] = React.useState(true);

    if (!photoUrl || error) {
      return (
        <View style={[styles.productImage, styles.placeholderImage]}>
          <Icon name="package-variant" size={24} color="#D1D5DB" />
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        {imgLoading && (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <ActivityIndicator size="small" color="#9CA3AF" />
          </View>
        )}
        <Image
          source={{ uri: photoUrl }}
          style={styles.productImage}
          resizeMode="cover"
          onLoadStart={() => setImgLoading(true)}
          onLoadEnd={() => setImgLoading(false)}
          onError={() => {
            setError(true);
            setImgLoading(false);
          }}
        />
      </View>
    );
  };

  // Item produit
  const renderProductItem = ({ item }: { item: Produit }) => {
    const lowStock = item.quantite_stock <= item.seuil_minimum;
    const statusText = lowStock ? 'منخفض' : 'متوفّر';
    const statusColor = lowStock ? '#EA580C' : '#16A34A';
    const statusBg = lowStock ? '#FFF7ED' : '#DCFCE7';

    return (
      <TouchableOpacity 
        style={styles.productRow}
        onPress={() => navigation.navigate('ProductForm', { produit: item })}
        activeOpacity={0.7}
      >
        {/* Image + Info */}
        <View style={styles.productInfo}>
          <ProductImage photoUrl={item.photo_url} />
          <View style={styles.textContainer}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.nom}
            </Text>
            <Text style={styles.productCategory}>
              {item.description || 'مواد غذائية'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {/* Quantité */}
        <View style={styles.quantityCell}>
          <Text style={styles.quantityText}>{item.quantite_stock}</Text>
        </View>

        {/* Prix */}
        <View style={styles.priceCell}>
          <Text style={styles.priceText}>{item.prix_unitaire.toFixed(2)}</Text>
          <Text style={styles.currencyText}>DH</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && produits.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <View style={styles.content}>
        {renderSearchBar()}
        {renderTableHeader()}

        <FlatList
          data={produits}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="package-variant" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>لا توجد منتجات</Text>
            </View>
          }
        />
      </View>

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('ProductForm')}
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  searchInput: {
    fontSize: 14,
    textAlign: 'right',
    color: '#1F2937',
    minHeight: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
  },
  headerText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  productCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'right',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quantityCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  priceCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  currencyText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1E40AF',
    borderRadius: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
});

export default ProductsListScreen;