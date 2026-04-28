import { AUTH_REDIRECT_PATHS } from '../api/supabase';
import type { PendingAuthScreen } from '../types';

type AuthDeepLinkParams = {
  access_token: string | null;
  refresh_token: string | null;
  error: string | null;
  error_description: string | null;
};

function normalizeUrlPath(url: URL) {
  const host = url.host.replace(/^\/+|\/+$/g, '');
  const pathname = url.pathname.replace(/^\/+|\/+$/g, '');

  if (pathname) {
    return pathname;
  }

  return host;
}

function getMergedParams(url: URL) {
  const params = new URLSearchParams(url.search);
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);

  hashParams.forEach((value, key) => {
    params.set(key, value);
  });

  return params;
}

export function getPendingAuthScreen(url: string): PendingAuthScreen {
  const parsedUrl = new URL(url);
  const path = normalizeUrlPath(parsedUrl);

  if (path === AUTH_REDIRECT_PATHS.resetPassword) {
    return 'ResetPassword';
  }

  if (path === AUTH_REDIRECT_PATHS.setPassword) {
    return 'SetPassword';
  }

  return null;
}

export function extractAuthDeepLinkParams(url: string): AuthDeepLinkParams {
  const parsedUrl = new URL(url);
  const params = getMergedParams(parsedUrl);

  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    error: params.get('error'),
    error_description: params.get('error_description'),
  };
}

export function extractAuthDeepLinkError(url: string) {
  const { error, error_description } = extractAuthDeepLinkParams(url);

  if (!error && !error_description) {
    return null;
  }

  return decodeURIComponent(error_description ?? error ?? 'Lien invalide ou expire.');
}
