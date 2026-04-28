import React from 'react';
import { FlatList } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import ProductCard from '../../components/products/ProductCard';
import { useProduits } from '../../hooks/useProduits';
import type { Produit } from '../../types';

function ProductsListScreen({
  navigation,
}: {
  navigation: { navigate: (screen: string, params?: { produit?: Produit }) => void };
}) {
  const { produits, loading, search, setSearch, removeProduit } = useProduits();

  return (
    <ScreenContainer title="Produits" loading={loading}>
      <Searchbar placeholder="Rechercher un produit" value={search} onChangeText={setSearch} />
      <FlatList
        data={produits}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ProductCard
            produit={item}
            onEdit={() => navigation.navigate('ProductForm', { produit: item })}
            onDelete={() => removeProduit(item.id)}
          />
        )}
      />
      <FAB icon="plus" onPress={() => navigation.navigate('ProductForm')} style={{ position: 'absolute', right: 16, bottom: 24 }} />
    </ScreenContainer>
  );
}

export default ProductsListScreen;
