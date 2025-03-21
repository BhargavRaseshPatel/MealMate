import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { getCurrentUser, getUserRole } from '../services/appwrite';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          // User is authenticated, check role
          const role = await getUserRole();
          
          if (role === 'customer') {
            router.replace('customer-home');
          } else if (role === 'chef') {
            router.replace('chef-home');
          } else {
            router.replace('role-selection');
          }
        } else {
          // Not authenticated, go to login
          router.replace('login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('login');
      }
    };
    
    checkAuthStatus();
  }, [router]);

  // Return a loading state or a redirect to login as fallback
  return <Redirect href="login" />;
} 