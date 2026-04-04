import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

// 🔥 Firebase
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
import ResourcesScreen from '../screens/ResourcesScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import ReportScreen from '../screens/ReportScreen';
import SOSScreen from '../screens/SOSScreen';

const db = getFirestore();
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

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="ReportTab" component={ReportScreen} />
      <Tab.Screen name="SOSTab" component={SOSScreen} />
      <Tab.Screen name="ResourcesTab" component={ResourcesScreen} />
      <Tab.Screen name="PrivacyTab" component={PrivacyScreen} />
    </Tab.Navigator>
  );
}

function MainApp() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Tabs" component={MainTabs} />
      <AppStack.Screen name="Track" component={CaseTrackingScreen} />
      <AppStack.Screen name="Chat" component={ChatScreen} />
    </AppStack.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Verify user is in "users" collection (mobile user, not staff)
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            // User is a valid mobile user
            // Only set user if registration is complete
            if (userDoc.data().registrationComplete === true) {
              setUser(u);
            } else {
              // Registration not complete, stay in auth flow
              setUser(null);
            }
          } else {
            // User exists in Firebase Auth but not in "users" collection
            // This is likely a staff account that shouldn't have mobile access
            await auth.signOut();
            setUser(null);
          }
        } catch (error) {
          console.error('Error verifying user:', error);
          await auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null; // or splash screen

  return (
    <NavigationContainer>
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