import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth, useAuthBootstrap } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import ClientFormScreen from '../screens/clients/ClientFormScreen';
import ProductFormScreen from '../screens/produits/ProductFormScreen';
import SupplierFormScreen from '../screens/fournisseurs/SupplierFormScreen';
import FournisseursListScreen from '../screens/fournisseurs/FournisseursListScreen';
import StockScreen from '../screens/stock/StockScreen';
import DocumentFormScreen from '../screens/documents/DocumentFormScreen';
import type { PendingAuthScreen, Profile } from '../types';
import type { Session } from '@supabase/supabase-js';
import { useNavigationTheme } from '../theme/ThemeModeContext';
import { linking } from './linking';
import AppSplash from '../components/common/AppSplash';

const RootStack = createNativeStackNavigator();

export function resolveAppFlow(
  session: Session | null,
  profile: Profile | null,
  pendingAuthScreen: PendingAuthScreen,
) {
  if (pendingAuthScreen) {
    return 'auth';
  }

  if (!session) {
    return 'auth';
  }

  if (profile?.role === 'super_admin') {
    return 'super_admin';
  }

  if (!profile?.organization_id) {
    return 'onboarding';
  }

  return 'main';
}

function Loader() {
  const { t } = useTranslation();
  return <AppSplash title="G-COOP" tagline={t('welcome_subtitle')} caption={t('app_tagline')} showLoader />;
}

function AppNavigator() {
  const { t } = useTranslation();
  const initialized = useAuthBootstrap();
  const { session, profile, pendingAuthScreen, processingDeepLink } = useAuth();
  const navigationTheme = useNavigationTheme();
  const theme = useTheme();
  const flow = resolveAppFlow(session, profile, pendingAuthScreen);

  if (!initialized || processingDeepLink) {
    return <Loader />;
  }

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      {flow === 'auth' ? (
        <AuthNavigator key={pendingAuthScreen ?? 'Splash'} initialRouteName={pendingAuthScreen ?? 'Splash'} />
      ) : flow === 'super_admin' ? (
        <SuperAdminNavigator />
      ) : flow === 'onboarding' ? (
        <RootStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}>
          <RootStack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ title: t('onboarding_title') }}
          />
        </RootStack.Navigator>
      ) : (
        <RootStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}>
          <RootStack.Screen name="MainTabs" component={MainNavigator} options={{ headerShown: false }} />
          <RootStack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: t('clients') }} />
          <RootStack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: t('products') }} />
          <RootStack.Screen
            name="SupplierForm"
            component={SupplierFormScreen}
            options={{ title: t('suppliers_title') }}
          />
          <RootStack.Screen
            name="Fournisseurs"
            component={FournisseursListScreen}
            options={{ title: t('suppliers_title') }}
          />
          <RootStack.Screen name="Stock" component={StockScreen} options={{ title: t('stock_title') }} />
          <RootStack.Screen
            name="DocumentForm"
            component={DocumentFormScreen}
            options={{ title: t('documents') }}
          />
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default AppNavigator;
