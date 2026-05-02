import React from 'react';
import { useTranslation } from 'react-i18next';
import AppSplash from '../../components/common/AppSplash';

function SplashScreen({ navigation }: { navigation: { replace: (screen: string) => void } }) {
  const { t } = useTranslation();
  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 1600);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <AppSplash
      title="G-COOP"
      tagline={t('welcome_subtitle')}
      caption={t('app_tagline')}
      showLoader
    />
  );
}

export default SplashScreen;
