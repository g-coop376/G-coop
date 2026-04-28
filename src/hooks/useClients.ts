import React from 'react';
import { Alert } from 'react-native';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import type { Client } from '../types';

export function useClients() {
  const organization = useAuthStore(state => state.organization);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const fetchClients = React.useCallback(async () => {
    if (!organization) {
      setClients([]);
      return;
    }

    setLoading(true);
    const query = supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organization.id)
      .order('nom');

    if (search.trim()) {
      query.ilike('nom', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    setLoading(false);

    if (error) {
      Alert.alert('Clients', error.message);
      return;
    }

    setClients((data as Client[]) ?? []);
  }, [organization, search]);

  React.useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const saveClient = async (payload: Partial<Client>) => {
    if (!organization) {
      return false;
    }

    const { error } = await supabase.from('clients').upsert({
      id: payload.id,
      organization_id: organization.id,
      nom: payload.nom,
      telephone: payload.telephone,
      adresse: payload.adresse,
      email: payload.email,
    });

    if (error) {
      Alert.alert('Client', error.message);
      return false;
    }

    await fetchClients();
    return true;
  };

  const removeClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      Alert.alert('Suppression', error.message);
      return false;
    }

    await fetchClients();
    return true;
  };

  return {
    clients,
    loading,
    search,
    setSearch,
    fetchClients,
    saveClient,
    removeClient,
  };
}
