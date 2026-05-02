import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Produit } from '../../types';

interface ProductCardProps {
  produit: Produit;
  onEdit: () => void;
  onDelete: () => void;
}

function ProductCard({ produit }: ProductCardProps) {
  const lowStock = produit.quantite_stock <= produit.seuil_minimum;
  const statusText = lowStock ? 'منخفض' : 'متوفّر';
  const statusColor = lowStock ? '#EA580C' : '#16A34A';
  const statusBg = lowStock ? '#FFF7ED' : '#DCFCE7';

  return (
    <View style={styles.container}>
      {/* Image + Info */}
      <View style={styles.productInfo}>
        <View style={styles.imageContainer}>
          {produit.photo_url ? (
            <Image source={{ uri: produit.photo_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Icon name="package-variant" size={24} color="#D1D5DB" />
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.productName} numberOfLines={1}>
            {produit.nom}
          </Text>
          <Text style={styles.productCategory}>
            {produit.description || 'مواد غذائية'}
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
        <Text style={styles.quantityText}>{produit.quantite_stock}</Text>
      </View>

      {/* Prix */}
      <View style={styles.priceCell}>
        <Text style={styles.priceText}>{produit.prix_unitaire.toFixed(2)}</Text>
        <Text style={styles.currencyText}>DH</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
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
});

export default ProductCard;