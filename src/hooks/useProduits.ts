import React from 'react';
import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import type { Fournisseur, Produit } from '../types';

async function uploadProductImage(organizationId: string) {
  const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
  const asset = result.assets?.[0];

  if (!asset?.uri) {
    return null;
  }

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const path = `${organizationId}/${Date.now()}-${asset.fileName ?? 'produit.jpg'}`;

  const { error } = await supabase.storage.from('produits').upload(path, blob, {
    upsert: true,
    contentType: asset.type ?? 'image/jpeg',
  });

  if (error) {
    Alert.alert('Upload image', error.message);
    return null;
  }

  const { data } = supabase.storage.from('produits').getPublicUrl(path);
  return data.publicUrl;
}

export function useProduits() {
  const organization = useAuthStore(state => state.organization);
  const [produits, setProduits] = React.useState<Produit[]>([]);
  const [fournisseurs, setFournisseurs] = React.useState<Fournisseur[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const fetchProduits = React.useCallback(async () => {
    if (!organization) {
      return;
    }

    setLoading(true);
    const produitQuery = supabase
      .from('produits')
      .select('*')
      .eq('organization_id', organization.id)
      .order('nom');

    if (search.trim()) {
      produitQuery.ilike('nom', `%${search.trim()}%`);
    }

    const [{ data: produitsData, error }, { data: fournisseursData }] =
      await Promise.all([
        produitQuery,
        supabase
          .from('fournisseurs')
          .select('*')
          .eq('organization_id', organization.id)
          .order('nom'),
      ]);

    setLoading(false);

    if (error) {
      Alert.alert('Produits', error.message);
      return;
    }

    setProduits((produitsData as Produit[]) ?? []);
    setFournisseurs((fournisseursData as Fournisseur[]) ?? []);
  }, [organization, search]);

  React.useEffect(() => {
    void fetchProduits();
  }, [fetchProduits]);

  const saveProduit = async (payload: Partial<Produit>, withImage: boolean) => {
    if (!organization) {
      return false;
    }

    const photoUrl =
      withImage && !payload.photo_url
        ? await uploadProductImage(organization.id)
        : payload.photo_url;

    const { error } = await supabase.from('produits').upsert({
      id: payload.id,
      organization_id: organization.id,
      fournisseur_id: payload.fournisseur_id,
      nom: payload.nom,
      description: payload.description,
      prix_unitaire: payload.prix_unitaire,
      quantite_stock: payload.quantite_stock,
      seuil_minimum: payload.seuil_minimum,
      photo_url: photoUrl,
      unite: payload.unite ?? 'u',
    });

    if (error) {
      Alert.alert('Produit', error.message);
      return false;
    }

    await fetchProduits();
    return true;
  };

  const removeProduit = async (id: string) => {
    const { error } = await supabase.from('produits').delete().eq('id', id);
    if (error) {
      Alert.alert('Suppression produit', error.message);
      return false;
    }

    await fetchProduits();
    return true;
  };

  return {
    produits,
    fournisseurs,
    loading,
    search,
    setSearch,
    saveProduit,
    removeProduit,
    fetchProduits,
  };
}
