import React from 'react';
import { Linking } from 'react-native';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import {
  extractAuthDeepLinkError,
  extractAuthDeepLinkParams,
  getPendingAuthScreen,
} from '../utils/authDeepLinks';

const INVALID_LINK_MESSAGE = 'Le lien est invalide ou incomplet. Demandez un nouvel email.';
const EXPIRED_LINK_MESSAGE = 'Le lien est invalide ou a expire. Demandez un nouvel email.';

async function processAuthDeepLink(url: string) {
  const pendingAuthScreen = getPendingAuthScreen(url);
  if (!pendingAuthScreen) {
    return;
  }

  const authStore = useAuthStore.getState();
  authStore.setPendingAuthScreen(pendingAuthScreen);
  authStore.setDeepLinkError(null);
  authStore.setProcessingDeepLink(true);

  const deepLinkError = extractAuthDeepLinkError(url);
  if (deepLinkError) {
    authStore.setDeepLinkError(deepLinkError);
    authStore.setProcessingDeepLink(false);
    return;
  }

  const { access_token, refresh_token } = extractAuthDeepLinkParams(url);
  if (!access_token || !refresh_token) {
    authStore.setDeepLinkError(INVALID_LINK_MESSAGE);
    authStore.setProcessingDeepLink(false);
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    authStore.setDeepLinkError(EXPIRED_LINK_MESSAGE);
  }

  authStore.setProcessingDeepLink(false);
}

export function useAuthDeepLinking() {
  React.useEffect(() => {
    let mounted = true;

    Linking.getInitialURL()
      .then(url => {
        if (!mounted || !url) {
          return;
        }

        return processAuthDeepLink(url);
      })
      .catch(() => {
        useAuthStore.getState().setProcessingDeepLink(false);
      });

    const subscription = Linking.addEventListener('url', event => {
      processAuthDeepLink(event.url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
}
