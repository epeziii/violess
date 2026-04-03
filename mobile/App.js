import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
      <AppNavigator />
    </>
  );
}