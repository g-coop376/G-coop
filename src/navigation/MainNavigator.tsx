import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import ClientsListScreen from '../screens/clients/ClientsListScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import DocumentsListScreen from '../screens/documents/DocumentsListScreen';
import MoreScreen from '../screens/dashboard/MoreScreen';
import ProductsListScreen from '../screens/produits/ProductsListScreen';

const Tab = createBottomTabNavigator();

function icon(name: string) {
  return ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

function MainNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Tableau de bord', tabBarIcon: icon('view-dashboard-outline') }}
      />
      <Tab.Screen
        name="ClientsTab"
        component={ClientsListScreen}
        options={{ title: 'Clients', tabBarIcon: icon('account-group-outline') }}
      />
      <Tab.Screen
        name="ProduitsTab"
        component={ProductsListScreen}
        options={{ title: 'Produits', tabBarIcon: icon('package-variant-closed') }}
      />
      <Tab.Screen
        name="DocumentsTab"
        component={DocumentsListScreen}
        options={{ title: 'Documents', tabBarIcon: icon('file-document-outline') }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreScreen}
        options={{ title: 'Plus', tabBarIcon: icon('dots-horizontal-circle-outline') }}
      />
    </Tab.Navigator>
  );
}

export default MainNavigator;
