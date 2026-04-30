import React from 'react';
import { Alert } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { buildAuthRedirectUrl, supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import type { Organization, Profile, OrganizationType } from '../types';
import { useAuthDeepLinking } from './useAuthDeepLinking';

async function fetchProfileAndOrganization(session: Session) {
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
  useAuthStore.getState().setProfile(profile);
  useAuthStore.getState().setOrganization(organization);
  useAuthStore.getState().markInitialized();
}

async function handleSignOut() {
  useAuthStore.getState().clearSession();
  useAuthStore.getState().markInitialized();
}

export function useAuthBootstrap() {
  const initialized = useAuthStore(state => state.initialized);
  const [isReady, setIsReady] = React.useState(initialized);
  useAuthDeepLinking();

  React.useEffect(() => {
    let mounted = true;
    let profileFetchStarted = false;

    const timeoutId = setTimeout(() => {
      if (mounted && !useAuthStore.getState().initialized) {
        useAuthStore.getState().markInitialized();
      }
    }, 8000);

    supabase.auth.getSession().then(async ({ data }) => {
      clearTimeout(timeoutId);
      if (!mounted) return;

      const { session } = data;
      profileFetchStarted = true;

      if (session) {
        await fetchProfileAndOrganization(session);
      } else {
        useAuthStore.getState().markInitialized();
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session) {
          await fetchProfileAndOrganization(session);
        } else if (event === 'SIGNED_OUT') {
          await handleSignOut();
        } else if (event === 'TOKEN_REFRESHED' && session && profileFetchStarted) {
          useAuthStore.getState().bootstrap(session, session.user);
        } else if (event === 'INITIAL_SESSION') {
          return;
        }
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (initialized && !isReady) {
      setIsReady(true);
    }
  }, [initialized, isReady]);

  return isReady;
}

export function useAuth() {
  const authState = useAuthStore();

  const signIn = async (email: string, password: string) => {
    useAuthStore.getState().setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Connexion impossible', error.message);
        return false;
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
      Alert.alert('Connexion impossible', message);
      return false;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
    }
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
    if (sessionData.session) {
      await fetchProfileAndOrganization(sessionData.session);
    }
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
