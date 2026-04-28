import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import SuperAdminDashboardScreen from '../screens/super-admin/SuperAdminDashboardScreen';
import SendInvitationScreen from '../screens/super-admin/SendInvitationScreen';
import AdminProfileScreen from '../screens/super-admin/AdminProfileScreen';

const Tab = createBottomTabNavigator();

function icon(name: string) {
  return ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

function SuperAdminNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
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
        name="SuperAdminDashboard"
        component={SuperAdminDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: icon('view-grid-outline'),
        }}
      />
      <Tab.Screen
        name="SendInvitation"
        component={SendInvitationScreen}
        options={{
          title: 'Invitations',
          tabBarIcon: icon('email-send-outline'),
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: icon('account-circle-outline'),
        }}
      />
    </Tab.Navigator>
  );
}

export default SuperAdminNavigator;
