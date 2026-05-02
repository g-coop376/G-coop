import React from 'react';
import { FlatList } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import EntityListItem from '../../components/common/EntityListItem';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Fournisseur } from '../../types';

function FournisseursListScreen({
  navigation,
}: {
  navigation: { navigate: (screen: string, params?: { fournisseur?: Fournisseur }) => void };
}) {
  const { t } = useTranslation();
  const organization = useAuthStore(state => state.organization);
  const [fournisseurs, setFournisseurs] = React.useState<Fournisseur[]>([]);
  const [search, setSearch] = React.useState('');

  const fetchFournisseurs = React.useCallback(async () => {
    if (!organization) {
      return;
    }

    const query = supabase
      .from('fournisseurs')
      .select('*')
      .eq('organization_id', organization.id)
      .order('nom');

    if (search.trim()) {
      query.ilike('nom', `%${search.trim()}%`);
    }

    const { data } = await query;
    setFournisseurs((data as Fournisseur[]) ?? []);
  }, [organization, search]);

  React.useEffect(() => {
    void fetchFournisseurs();
  }, [fetchFournisseurs]);

  const removeFournisseur = async (id: string) => {
    await supabase.from('fournisseurs').delete().eq('id', id);
    await fetchFournisseurs();
  };

  return (
    <ScreenContainer title={t('suppliers_title')}>
      <Searchbar placeholder={t('search_supplier')} value={search} onChangeText={setSearch} />
      <FlatList
        data={fournisseurs}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EntityListItem
            title={item.nom}
            subtitle={item.telephone}
            meta={item.email ?? item.adresse ?? undefined}
            onEdit={() => navigation.navigate('SupplierForm', { fournisseur: item })}
            onDelete={() => removeFournisseur(item.id)}
          />
        )}
      />
      <FAB icon="plus" onPress={() => navigation.navigate('SupplierForm')} style={{ position: 'absolute', right: 16, bottom: 24 }} />
    </ScreenContainer>
  );
}

export default FournisseursListScreen;
