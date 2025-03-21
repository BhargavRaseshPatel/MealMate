import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { getCurrentUser, getUserRole } from '../services/appwrite';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          // Check user role
          const role = await getUserRole();
          
          if (role === 'customer') {
            setInitialRoute('customer-home');
          } else if (role === 'chef') {
            setInitialRoute('chef-home');
          } else {
            setInitialRoute('role-selection');
          }
        } else {
          setInitialRoute('login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setInitialRoute('login');
      }
    };
    
    checkAuthStatus();
    SplashScreen.hideAsync();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
    <Stack
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" redirect={true} />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="chef-home" />
      <Stack.Screen name="customer-home" />
    </Stack>
  );
}
