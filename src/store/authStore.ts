import { create } from 'zustand';
import type { AuthState, Organization, Profile } from '../types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthStore extends AuthState {
  setLoading: (loading: boolean) => void;
  setProcessingDeepLink: (processingDeepLink: boolean) => void;
  bootstrap: (session: Session | null, user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setOrganization: (organization: Organization | null) => void;
  setPendingAuthScreen: (screen: AuthState['pendingAuthScreen']) => void;
  setDeepLinkError: (error: string | null) => void;
  clearDeepLinkState: () => void;
  markInitialized: () => void;
  reset: () => void;
}

const initialState: AuthState = {
  initialized: false,
  loading: false,
  processingDeepLink: false,
  session: null,
  user: null,
  profile: null,
  organization: null,
  pendingAuthScreen: null,
  deepLinkError: null,
};

export const useAuthStore = create<AuthStore>(set => ({
  ...initialState,
  setLoading: loading => set({ loading }),
  setProcessingDeepLink: processingDeepLink => set({ processingDeepLink }),
  bootstrap: (session, user) => set({ session, user }),
  setProfile: profile => set({ profile }),
  setOrganization: organization => set({ organization }),
  setPendingAuthScreen: pendingAuthScreen => set({ pendingAuthScreen }),
  setDeepLinkError: deepLinkError => set({ deepLinkError }),
  clearDeepLinkState: () => set({ pendingAuthScreen: null, deepLinkError: null, processingDeepLink: false }),
  markInitialized: () => set({ initialized: true, loading: false }),
  reset: () => set({ ...initialState, initialized: true }),
}));
