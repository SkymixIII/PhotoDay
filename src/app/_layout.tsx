import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Loading } from '../components/ui';
import { AuthProvider, useAuth } from '../lib/auth';

function RootStack() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;

  const signedIn = !!session;
  return (
    <Stack screenOptions={{ headerTintColor: '#F97316', headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ title: 'Connexion', headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="index" options={{ title: 'PhotoDay' }} />
        <Stack.Screen name="capture" options={{ title: 'Selfie du jour', headerShown: false }} />
        <Stack.Screen name="groups/new" options={{ title: 'Nouveau groupe', presentation: 'modal' }} />
        <Stack.Screen name="groups/[id]" options={{ title: 'Groupe' }} />
        <Stack.Screen name="timelapse/[userId]" options={{ title: 'Timelapse' }} />
        <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}
