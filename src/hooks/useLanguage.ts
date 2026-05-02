import { useCallback, useEffect, useState } from 'react';
import { changeLanguage, initI18n, isRTL, type LanguageCode } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLanguage() {
  const [language, setLanguage] = useState<LanguageCode>('ar');
  const [rtl, setRtl] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function setup() {
      await initI18n();
      const saved = await AsyncStorage.getItem('gcoop_language');
      const lng = (saved && (saved === 'ar' || saved === 'fr') ? saved : 'ar') as LanguageCode;
      setLanguage(lng);
      setRtl(isRTL());
      setInitialized(true);
    }
    setup();
  }, []);

  const switchLanguage = useCallback(async (lng: LanguageCode) => {
    await changeLanguage(lng);
    setLanguage(lng);
    setRtl(isRTL());
  }, []);

  return {
    language,
    switchLanguage,
    isRTL: rtl,
    initialized,
  };
}
