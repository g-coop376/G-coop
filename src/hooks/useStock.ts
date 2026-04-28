import React from 'react';
import { Alert } from 'react-native';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import type { Produit, StockMouvement } from '../types';

export function useStock() {
  const organization = useAuthStore(state => state.organization);
  const [produits, setProduits] = React.useState<Produit[]>([]);
  const [mouvements, setMouvements] = React.useState<StockMouvement[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchStock = React.useCallback(async () => {
    if (!organization) {
      return;
    }

    setLoading(true);
    const [produitsRes, mouvementsRes] = await Promise.all([
      supabase
        .from('produits')
        .select('*')
        .eq('organization_id', organization.id)
        .order('nom'),
      supabase
        .from('stock_mouvements')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setLoading(false);

    if (produitsRes.error) {
      Alert.alert('Stock', produitsRes.error.message);
      return;
    }

    setProduits((produitsRes.data as Produit[]) ?? []);
    setMouvements((mouvementsRes.data as StockMouvement[]) ?? []);
  }, [organization]);

  React.useEffect(() => {
    void fetchStock();
  }, [fetchStock]);

  const adjustStock = async (produit: Produit, quantite: number, note: string) => {
    if (!organization) {
      return false;
    }

    const quantiteApres = produit.quantite_stock + quantite;
    if (quantiteApres < 0) {
      Alert.alert('Stock', 'Le stock ne peut pas devenir négatif.');
      return false;
    }

    const [{ error: updateError }, { error: mouvementError }] = await Promise.all([
      supabase
        .from('produits')
        .update({ quantite_stock: quantiteApres })
        .eq('id', produit.id),
      supabase.from('stock_mouvements').insert({
        organization_id: organization.id,
        produit_id: produit.id,
        mouvement_type: 'manual',
        quantite,
        quantite_avant: produit.quantite_stock,
        quantite_apres: quantiteApres,
        note,
      }),
    ]);

    if (updateError || mouvementError) {
      Alert.alert('Mouvement manuel', updateError?.message ?? mouvementError?.message);
      return false;
    }

    await fetchStock();
    return true;
  };

  return { produits, mouvements, loading, fetchStock, adjustStock };
}
