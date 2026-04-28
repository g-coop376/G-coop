import type { LinkingOptions } from '@react-navigation/native';
import { AUTH_LINK_PREFIX } from '../api/supabase';

type LinkingParamList = Record<string, object | undefined>;

export const linking: LinkingOptions<LinkingParamList> = {
  prefixes: [AUTH_LINK_PREFIX],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      SetPassword: 'set-password',
    },
  },
};
