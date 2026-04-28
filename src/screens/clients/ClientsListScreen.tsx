import React from 'react';
import { FlatList } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import EntityListItem from '../../components/common/EntityListItem';
import { useClients } from '../../hooks/useClients';
import type { Client } from '../../types';

function ClientsListScreen({
  navigation,
}: {
  navigation: { navigate: (screen: string, params?: { client?: Client }) => void };
}) {
  const { clients, loading, search, setSearch, removeClient } = useClients();

  return (
    <ScreenContainer title="Clients" loading={loading}>
      <Searchbar placeholder="Rechercher un client" value={search} onChangeText={setSearch} />
      <FlatList
        data={clients}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EntityListItem
            title={item.nom}
            subtitle={item.telephone}
            meta={item.email ?? item.adresse ?? undefined}
            onEdit={() => navigation.navigate('ClientForm', { client: item })}
            onDelete={() => removeClient(item.id)}
          />
        )}
      />
      <FAB icon="plus" onPress={() => navigation.navigate('ClientForm')} style={{ position: 'absolute', right: 16, bottom: 24 }} />
    </ScreenContainer>
  );
}

export default ClientsListScreen;
