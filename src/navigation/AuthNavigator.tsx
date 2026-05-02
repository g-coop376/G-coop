import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import type { PendingAuthScreen } from '../types';

const Stack = createNativeStackNavigator();

function AuthNavigator({
  initialRouteName = 'Splash',
}: {
  initialRouteName?: Exclude<PendingAuthScreen, null> | 'Login' | 'Welcome' | 'Splash';
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: t('login') }} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: t('forgot_password_title') }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: t('new_password_title') }}
      />
      <Stack.Screen
        name="SetPassword"
        component={SetPasswordScreen}
        options={{ title: t('new_password_title') }}
      />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
