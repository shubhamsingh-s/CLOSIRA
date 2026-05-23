import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme/theme';

// Import Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { LeadsScreen } from '../screens/LeadsScreen';
import { EscalationsScreen } from '../screens/EscalationsScreen';
import { FollowUpsScreen } from '../screens/FollowUpsScreen';
import { ConversationDetailScreen } from '../screens/ConversationDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ name, color }: { name: string; color: string }) => {
  return <Feather name={name as any} size={20} color={color} />;
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primaryLight,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Theme.colors.card,
          borderTopColor: Theme.colors.border,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          ...Theme.shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Leads" 
        component={LeadsScreen} 
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="users" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Escalations" 
        component={EscalationsScreen} 
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="alert-triangle" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Follow-ups" 
        component={FollowUpsScreen} 
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="clock" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.colors.card,
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: Theme.colors.border,
        },
        headerTintColor: Theme.colors.textPrimary,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
        },
        cardStyle: {
          backgroundColor: Theme.colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ConversationDetail" 
        component={ConversationDetailScreen} 
        options={{ 
          title: 'Conversation Detail',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};
