import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Theme } from '../theme/theme';

// Import Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { LeadsScreen } from '../screens/LeadsScreen';
import { EscalationsScreen } from '../screens/EscalationsScreen';
import { FollowUpsScreen } from '../screens/FollowUpsScreen';
import { ConversationDetailScreen } from '../screens/ConversationDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Simple mock icon component since we are stylesheet-based
const TabIcon = ({ color, label }: { color: string; label: string }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>●</Text>
    </View>
  );
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
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} label="H" />,
        }}
      />
      <Tab.Screen 
        name="Leads" 
        component={LeadsScreen} 
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} label="L" />,
        }}
      />
      <Tab.Screen 
        name="Escalations" 
        component={EscalationsScreen} 
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} label="E" />,
        }}
      />
      <Tab.Screen 
        name="Follow-ups" 
        component={FollowUpsScreen} 
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} label="F" />,
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
