import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors } from '../theme';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// 🔥 Firebase
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';

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

const db = getFirestore();
let notificationsAvailable = true;

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  notificationsAvailable = false;
  console.warn('Notifications module not available yet:', error);
}

async function registerForPushNotificationsAsync(userUid) {
  try {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    if (!token) return null;

    const userRef = doc(db, 'users', userUid);
    try {
      const userSnap = await getDoc(userRef);
      const existingToken = userSnap.exists() ? userSnap.data()?.expoPushToken : null;
      if (existingToken !== token) {
        await updateDoc(userRef, { expoPushToken: token });
      }
    } catch (uploadError) {
      console.warn('Failed to update user push token:', uploadError);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.warn('Unable to register for push notifications', error);
    return null;
  }
}

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
    let unsubAuth, unsubFirestore;

    unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Verify user is in "users" collection (mobile user, not staff)
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            // User is a valid mobile user
            // Only set user if registration is complete
            if (userDoc.data().registrationComplete === true) {
              setUser(u);
              // Register push token when authenticated
              registerForPushNotificationsAsync(u.uid).catch((err) => {
                console.warn('Push registration error:', err);
              });
              // Ensure any old unsubFirestore is cleaned up
              unsubFirestore?.();
              unsubFirestore = undefined;
            } else {
              // Registration not complete, stay in auth flow
              setUser(null);
              // Unsubscribe from any old listener first
              unsubFirestore?.();
              // Listen for when registrationComplete becomes true (e.g., after RegisterSuccessScreen)
              const unsubUser = onSnapshot(
                doc(db, 'users', u.uid),
                async (snap) => {
                  if (snap.exists() && snap.data().registrationComplete === true) {
                    console.log('Registration completed detected, logging in user');
                    setUser(u);
                    registerForPushNotificationsAsync(u.uid).catch((err) => {
                      console.warn('Push registration error after registration complete:', err);
                    });
                  }
                },
                (error) => {
                  console.warn('Note: Waiting for registration to complete...', error.code);
                  // Listener error is expected while registration is in progress
                  // The listener will retry automatically
                }
              );
              unsubFirestore = unsubUser;
            }
          } else {
            // User exists in Firebase Auth but not in "users" collection
            // This is likely a staff account that shouldn't have mobile access
            unsubFirestore?.();
            await auth.signOut();
            setUser(null);
          }
        } catch (error) {
          console.error('Error verifying user:', error);
          unsubFirestore?.();
          await auth.signOut();
          setUser(null);
        }
      } else {
        // User logged out - clean up any existing listeners
        unsubFirestore?.();
        unsubFirestore = undefined;
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubAuth?.();
      unsubFirestore?.();
    };
  }, []);

  useEffect(() => {
    if (!notificationsAvailable || typeof Notifications.addNotificationResponseReceivedListener !== 'function') {
      return;
    }

    let subscription;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const payload = response?.notification?.request?.content?.data;
        const caseId = payload?.caseId;
        if (caseId && navigationRef?.isReady?.()) {
          navigationRef.navigate('MainApp', {
            screen: 'Chat',
            params: { caseId },
          });
        }
      });
    } catch (error) {
      console.warn('Failed to attach notification response listener:', error);
      return;
    }

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
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