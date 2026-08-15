import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors } from '../theme';

import { supabase } from '../config/supabase';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import {
  AnonymousScreen,
  RegisterSuccessScreen,
  ForgotPasswordScreen,
} from '../screens/auth/AuthScreens';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import CaseTrackingScreen from '../screens/CaseTrackingScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ResourceDetailScreen from '../screens/ResourceDetailScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import ReportScreen from '../screens/ReportScreen';
import SOSScreen from '../screens/SOSScreen';
import ProfileScreen from '../screens/ProfileScreen';

const db = {};

const TAB_ICON_MAP = {
  Home: 'house',
  Report: 'file-circle-plus',
  SOS: 'triangle-exclamation',
  Resources: 'book',
  Settings: 'gear',
};

const TAB_ICON_MAP_KEYS = Object.keys(TAB_ICON_MAP);
const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} />
      <AuthStack.Screen name="Anonymous" component={AnonymousScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(194,24,91,0.1)',
    height: 65,
    paddingBottom: Platform.OS === 'ios' ? 10 : 5,
  },
  sosIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.sos,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});

function SOSTabIcon() {
  return (
    <View style={styles.sosIconContainer}>
      <FontAwesome6 name="triangle-exclamation" size={24} color="#fff" />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color, size }) => (
          <FontAwesome6 name={TAB_ICON_MAP.Home} size={size} color={color} />
        )}}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{ tabBarLabel: 'Report', tabBarIcon: ({ color, size }) => (
          <FontAwesome6 name={TAB_ICON_MAP.Report} size={size} color={color} />
        )}}
      />
      <Tab.Screen
        name="SOS"
        component={SOSScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => <SOSTabIcon />,
        }}
      />
      <Tab.Screen
        name="Resources"
        component={ResourcesScreen}
        options={{ tabBarLabel: 'Resources', tabBarIcon: ({ color, size }) => (
          <FontAwesome6 name={TAB_ICON_MAP.Resources} size={size} color={color} />
        )}}
      />
      <Tab.Screen
        name="Settings"
        component={PrivacyScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name={TAB_ICON_MAP.Settings} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainApp() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Tabs" component={MainTabs} />
      <AppStack.Screen name="Track" component={CaseTrackingScreen} />
      <AppStack.Screen name="Chat" component={ChatScreen} />
      <AppStack.Screen name="Chatbot" component={ChatbotScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="ResourceDetail" component={ResourceDetailScreen} />
    </AppStack.Navigator>
  );
}

const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const syncUser = async () => {
      try {
        const { data: { session } = {}, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentUser = session?.user ?? null;
        if (!currentUser) {
          if (active) setUser(null);
          if (active) setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const isValidMobileUser = !!profile && (profile.registration_complete ?? profile.registrationComplete ?? true) !== false;
        if (active) setUser(isValidMobileUser ? currentUser : null);
      } catch (error) {
        console.error('Error verifying Supabase user session:', error);
        if (active) {
          setUser(null);
          try { await supabase.auth.signOut(); } catch (signOutError) { console.warn('Sign out cleanup failed', signOutError); }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    syncUser();

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) return null; // or splash screen

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="MainApp" component={MainApp} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}