import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';

import { useAuthStore } from './store/authStore';
import { COLORS } from './constants';

// Auth
import LoginScreen from './app/(auth)/LoginScreen';
import RegisterScreen from './app/(auth)/RegisterScreen';

// Tabs
import HomeScreen from './app/(tabs)/HomeScreen';
import FavoritesScreen from './app/(tabs)/FavoritesScreen';
import ChatsScreen from './app/(tabs)/ChatsScreen';
import ProfileScreen from './app/(tabs)/ProfileScreen';

// Screens
import PropertyDetailScreen from './app/property/PropertyDetailScreen';
import ChatRoomScreen from './app/chat/ChatRoomScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = { Home: '🏠', Favorites: '❤️', Messages: '💬', Profile: '👤' };

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabel: ({ color }) => (
          <Text style={{ fontSize: 11, color }}>{route.name}</Text>
        ),
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 26 : 22 }}>{TAB_ICONS[route.name]}</Text>
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Messages" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

const SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontWeight: '700' },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: COLORS.background },
};

export default function App() {
  const { token, isLoading, initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  if (isLoading) return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 64, marginBottom: 20 }}>🏠</Text>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
        {!token ? (
          <Stack.Screen name="AuthStack" component={AuthStack} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Property' }} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Chat' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
