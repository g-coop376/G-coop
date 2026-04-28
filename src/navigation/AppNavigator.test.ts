import { resolveAppFlow } from './AppNavigator';
import type { Profile } from '../types';

const session = { access_token: 'token' } as never;

function makeProfile(overrides: Partial<Profile>): Profile {
  return {
    id: 'user-1',
    organization_id: null,
    role: 'mol_org',
    nom_complet: null,
    ...overrides,
  };
}

describe('resolveAppFlow', () => {
  it('returns auth when no session exists', () => {
    expect(resolveAppFlow(null, null, null)).toBe('auth');
  });

  it('returns auth while a password deep link is pending', () => {
    expect(resolveAppFlow(session, makeProfile({ organization_id: 'org-1' }), 'ResetPassword')).toBe('auth');
  });

  it('returns super_admin for super admin profiles', () => {
    expect(resolveAppFlow(session, makeProfile({ role: 'super_admin' }), null)).toBe('super_admin');
  });

  it('returns onboarding for org users without organization', () => {
    expect(resolveAppFlow(session, makeProfile({ organization_id: null }), null)).toBe('onboarding');
  });

  it('returns main for org users with organization', () => {
    expect(resolveAppFlow(session, makeProfile({ organization_id: 'org-1' }), null)).toBe('main');
  });
});
