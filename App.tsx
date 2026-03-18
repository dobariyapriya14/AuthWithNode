/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import './src/i18n';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import ToDoList from './src/screens/ToDoList';
import { PaperProvider } from 'react-native-paper';
import { createMMKV } from 'react-native-mmkv';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useEffect } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

const storage = createMMKV();

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const hasToken = storage.getString("accessToken");

  const requestPermission = async () => {
    const authStatus = await messaging().requestPermission();
    await notifee.requestPermission();
    console.log("Permission status:", authStatus);
  };

  const getToken = async () => {
    const token = await messaging().getToken();
    console.log("FCM TOKEN:", token);
  };

  useEffect(() => {
    requestPermission();
    getToken();
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log("Notification received:", remoteMessage);

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || (remoteMessage.data?.title as string) || 'New Notification',
        body: remoteMessage.notification?.body || (remoteMessage.data?.body as string) || 'You have a new message',
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    return unsubscribe;

  }, []);

  return (
    <StripeProvider publishableKey="pk_test_51TBYJ9QNh8SDUnEiEtP4jvCHB9sQisRomDLDl0SkepHgjqA5ezJV9mVtkgbbjZqtbWE3ztGEONF0A1sZXIJukAx100FjKK3STp">
      <SafeAreaProvider>
        <PaperProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <NavigationContainer>
            <Stack.Navigator initialRouteName={hasToken ? "ToDoList" : "LoginScreen"}>
              <Stack.Screen
                name="LoginScreen"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ToDoList"
                component={ToDoList}
                options={{ title: 'My Tasks', headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
