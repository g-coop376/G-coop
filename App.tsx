import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeModeProvider } from './src/theme/ThemeModeContext';
import { configureGlobalTextRendering } from './src/theme/typography';
import { initI18n } from './src/utils/i18n';

configureGlobalTextRendering();

function App(): React.JSX.Element {
  const [i18nInstance, setI18nInstance] = useState<any>(null);

  useEffect(() => {
    async function setup() {
      const instance = await initI18n();
      setI18nInstance(instance);
    }
    setup();
  }, []);

  if (!i18nInstance) {
    return null as any;
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18nInstance}>
        <ThemeModeProvider>
          <AppNavigator />
        </ThemeModeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

export default App;
