import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeModeProvider } from './src/theme/ThemeModeContext';
import { configureGlobalTextRendering } from './src/theme/typography';

configureGlobalTextRendering();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeModeProvider>
        <AppNavigator />
      </ThemeModeProvider>
    </SafeAreaProvider>
  );
}

export default App;
