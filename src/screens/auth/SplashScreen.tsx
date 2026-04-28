import React from 'react';
import AppSplash from '../../components/common/AppSplash';

function SplashScreen({ navigation }: { navigation: { replace: (screen: string) => void } }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 1600);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <AppSplash
      title="G-COOP"
      tagline="Discover Moroccan products and run your cooperative with confidence."
      caption="A calmer way to manage stock, documents, and daily trade."
      showLoader
    />
  );
}

export default SplashScreen;
