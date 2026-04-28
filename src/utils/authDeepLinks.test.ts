import {
  extractAuthDeepLinkError,
  extractAuthDeepLinkParams,
  getPendingAuthScreen,
} from './authDeepLinks';

describe('authDeepLinks', () => {
  it('maps reset-password URLs to the reset screen', () => {
    expect(getPendingAuthScreen('myapp://reset-password')).toBe('ResetPassword');
  });

  it('maps set-password URLs to the set password screen', () => {
    expect(getPendingAuthScreen('myapp://set-password')).toBe('SetPassword');
  });

  it('extracts Supabase auth tokens from the URL hash', () => {
    expect(
      extractAuthDeepLinkParams(
        'myapp://reset-password#access_token=access-token&refresh_token=refresh-token&type=recovery',
      ),
    ).toMatchObject({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
  });

  it('extracts URL encoded errors from the deep link', () => {
    expect(
      extractAuthDeepLinkError(
        'myapp://set-password#error=access_denied&error_description=Link%20expired',
      ),
    ).toBe('Link expired');
  });
});
