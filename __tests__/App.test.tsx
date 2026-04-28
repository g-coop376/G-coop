/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Linking } from 'react-native';
import { supabase } from '../src/api/supabase';
import App from '../App';

jest.mock('../src/navigation/AppNavigator', () => 'AppNavigator');

jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
  data: { session: null },
  error: null,
});

jest.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
  data: {
    subscription: {
      id: 1,
      callback: jest.fn(),
      unsubscribe: jest.fn(),
    },
  },
} as never);

jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
jest.spyOn(Linking, 'addEventListener').mockReturnValue({
  remove: jest.fn(),
} as never);

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    renderer?.unmount();
  });

  expect(renderer).toBeDefined();
});
