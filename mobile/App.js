import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, Linking, Alert } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';
import { supabase } from './src/config/supabase';

export default function App() {
  useEffect(() => {
    const handleAuthDeepLink = async (url) => {
      if (!url || !supabase) return;

      try {
        const { data, error } = await supabase.auth.getSessionFromUrl({ url });
        if (error) {
          console.warn('Auth deep link failed:', error.message || error);
          return;
        }

        if (data?.session) {
          console.log('Auth deep link processed successfully.');
        }
      } catch (error) {
        console.warn('Unhandled auth deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url) {
        handleAuthDeepLink(url);
      }
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleAuthDeepLink(url);
      }
    });

    return () => subscription?.remove?.();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
      <AppNavigator />
    </>
  );
}