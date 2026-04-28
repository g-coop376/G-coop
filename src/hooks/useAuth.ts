import React from 'react';
import { Alert } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { buildAuthRedirectUrl, supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import type { Organization, Profile, OrganizationType } from '../types';
import { useAuthDeepLinking } from './useAuthDeepLinking';

async function fetchProfileAndOrganization(session: Session | null) {
  if (!session?.user) {
    useAuthStore.getState().reset();
    return;
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  const profile = (profileData as Profile | null) ?? null;
  let organization: Organization | null = null;

  if (profile?.organization_id) {
    const { data: organizationData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .maybeSingle();

    organization = (organizationData as Organization | null) ?? null;
  }

  useAuthStore.getState().bootstrap(session, session.user);
  useAuthStore.getState().setProfile(profile ?? null);
  useAuthStore.getState().setOrganization(organization ?? null);
  useAuthStore.getState().markInitialized();
}

export function useAuthBootstrap() {
  const initialized = useAuthStore(state => state.initialized);
  useAuthDeepLinking();

  React.useEffect(() => {
    let mounted = true;

    const timeoutId = setTimeout(() => {
      if (mounted && !initialized) {
        useAuthStore.getState().markInitialized();
      }
    }, 8000);

    supabase.auth.getSession().then(async ({ data }) => {
      clearTimeout(timeoutId);
      if (!mounted) {
        return;
      }

      const { session } = data;
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().bootstrap(session, session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const profile = (profileData as Profile | null) ?? null;

        useAuthStore.getState().setProfile(profile ?? null);

        if (profile?.organization_id) {
          const { data: organizationData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .maybeSingle();
          const organization = (organizationData as Organization | null) ?? null;
          useAuthStore.getState().setOrganization(organization ?? null);
        } else {
          useAuthStore.getState().setOrganization(null);
        }
      }

      useAuthStore.getState().markInitialized();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        await fetchProfileAndOrganization(session);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return initialized;
}

export function useAuth() {
  const authState = useAuthStore();

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Connexion impossible', error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
  };

  const sendReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthRedirectUrl('resetPassword'),
    });

    if (error) {
      Alert.alert('Erreur', error.message);
      return false;
    }

    return true;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      Alert.alert('Erreur', error.message);
      return false;
    }
    useAuthStore.getState().clearDeepLinkState();
    return true;
  };

  const completeOnboarding = async (payload: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    ice: string;
    rc: string;
    logo_url: string | null;
    tva: number;
  }) => {
    const { error } = await supabase.rpc('create_organization_from_invitation', {
      p_nom: payload.nom,
      p_adresse: payload.adresse,
      p_telephone: payload.telephone,
      p_email: payload.email,
      p_ice: payload.ice,
      p_rc: payload.rc,
      p_logo_url: payload.logo_url,
      p_tva: payload.tva,
    });

    if (error) {
      Alert.alert('Onboarding impossible', error.message);
      return false;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    await fetchProfileAndOrganization(sessionData.session);
    return true;
  };

  const sendInvitation = async (
    email: string,
    orgType: OrganizationType,
    organizationName?: string,
  ) => {
    const { error } = await supabase.functions.invoke('send-invitation', {
      body: { email, orgType, orgNom: organizationName },
    });

    if (error) {
      Alert.alert('Invitation', error.message);
      return false;
    }

    return true;
  };

  return {
    ...authState,
    signIn,
    signOut,
    sendReset,
    updatePassword,
    completeOnboarding,
    sendInvitation,
  };
}
