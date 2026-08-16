import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, Linking } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';
import { supabase } from './src/config/supabase';

const parseDeepLinkParams = (urlString) => {
  if (!urlString) return {};

  try {
    const url = new URL(urlString);
    const params = Object.fromEntries(url.searchParams.entries());
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    Object.entries(Object.fromEntries(hashParams.entries())).forEach(([key, value]) => {
      params[key] = value;
    });
    return params;
  } catch (error) {
    console.warn('Unable to parse auth deep link:', error);
    return {};
  }
};

export default function App() {
  useEffect(() => {
    const handleAuthDeepLink = async (url) => {
      if (!url || !supabase) return;

      try {
        const params = parseDeepLinkParams(url);
        const code = params.code;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn('Auth code exchange failed:', error.message || error);
            return;
          }

          if (data?.session) {
            console.log('Auth deep link processed successfully.');
          }
          return;
        }

        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;
        const expiresIn = params.expires_in;
        const tokenType = params.token_type || 'bearer';

        if (accessToken && refreshToken && expiresIn) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: Number(expiresIn),
            token_type: tokenType,
          });

          if (error) {
            console.warn('Auth session set failed:', error.message || error);
            return;
          }

          if (data?.session) {
            console.log('Auth deep link processed successfully.');
          }
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