import { StatusBar, StyleSheet } from 'react-native';
import './src/i18n';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import DigitalSignature from './src/screens/DigitalSignature';
import AnimatedScreen from './src/screens/AnimatedScreen';
import TaskMapScreen from './src/screens/TaskMapScreen';
import DocumentPdfScreen from './src/screens/DocumentPdfScreen';
import ImageOptimizationScreen from './src/screens/ImageOptimizationScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, clientPersister } from './src/services/queryClient';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';

const storage = createMMKV();
const Stack = createNativeStackNavigator();

const MainApp = () => {
  const { paperTheme, navTheme, isDark } = useAppTheme();
  const hasToken = storage.getString('accessToken');

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={paperTheme.colors.background}
      />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator initialRouteName={hasToken ? 'ToDoList' : 'LoginScreen'}>
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
          <Stack.Screen
            name="TaskMapScreen"
            component={TaskMapScreen}
            options={{ title: 'Task Map & Location' }}
          />
          <Stack.Screen
            name="AnimatedScreen"
            component={AnimatedScreen}
            options={{ title: 'Animations' }}
          />
          <Stack.Screen
            name="DigitalSignature"
            component={DigitalSignature}
            options={{ title: 'Digital Signature' }}
          />
          <Stack.Screen
            name="DocumentPdfScreen"
            component={DocumentPdfScreen}
            options={{ title: '📄 Document & PDF Generator' }}
          />
          <Stack.Screen
            name="ImageOptimizationScreen"
            component={ImageOptimizationScreen}
            options={{ title: '🖼️ Image Optimization Studio' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

const App = () => {
  const requestPermission = async () => {
    const authStatus = await messaging().requestPermission();
    await notifee.requestPermission();
    console.log('Permission status:', authStatus);
  };

  const getToken = async () => {
    const token = await messaging().getToken();
    console.log('FCM TOKEN:', token);
  };

  useEffect(() => {
    requestPermission();
    getToken();
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Notification received:', remoteMessage);

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title:
          remoteMessage.notification?.title ||
          (remoteMessage.data?.title as string) ||
          'New Notification',
        body:
          remoteMessage.notification?.body ||
          (remoteMessage.data?.body as string) ||
          'You have a new message',
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: clientPersister }}
    >
      <GestureHandlerRootView style={styles.container}>
        <StripeProvider publishableKey="pk_test_51TBYJ9QNh8SDUnEiEtP4jvCHB9sQisRomDLDl0SkepHgjqA5ezJV9mVtkgbbjZqtbWE3ztGEONF0A1sZXIJukAx100FjKK3STp">
          <SafeAreaProvider>
            <ThemeProvider>
              <MainApp />
            </ThemeProvider>
          </SafeAreaProvider>
        </StripeProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
