jest.mock('react-native-config', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => null),
  removeItem: jest.fn(async () => null),
}));

jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(async () => ({ filePath: '/tmp/test.pdf' })),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(async () => null),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ assets: [] })),
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
}));
