import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import ar from '../locales/ar.json';
import fr from '../locales/fr.json';

const LANGUAGE_KEY = 'gcoop_language';

export const LANGUAGES = {
  ar: { label: 'العربية', direction: 'rtl' as const },
  fr: { label: 'Français', direction: 'ltr' as const },
};

export type LanguageCode = keyof typeof LANGUAGES;

async function loadLanguage(): Promise<LanguageCode> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && saved in LANGUAGES) {
      return saved as LanguageCode;
    }
  } catch {
    // ignore
  }
  return 'ar'; // Arabic is default
}

async function saveLanguage(lng: LanguageCode) {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch {
    // ignore
  }
}

function applyRTL(lng: LanguageCode) {
  const isRTL = LANGUAGES[lng].direction === 'rtl';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(isRTL);
  }
}

export async function initI18n() {
  const lng = await loadLanguage();
  applyRTL(lng);

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      lng,
      fallbackLng: 'ar',
      resources: {
        ar: { translation: ar },
        fr: { translation: fr },
      },
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
}

export async function changeLanguage(lng: LanguageCode) {
  await saveLanguage(lng);
  applyRTL(lng);
  await i18n.changeLanguage(lng);
}

export function isRTL(): boolean {
  return LANGUAGES[i18n.language as LanguageCode]?.direction === 'rtl';
}

export default i18n;
