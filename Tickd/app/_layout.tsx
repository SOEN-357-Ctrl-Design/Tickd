import { Stack } from 'expo-router';
import { UserProgressProvider } from '../context/UserProgressContext';

export default function RootLayout() {
  return (
    <UserProgressProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </UserProgressProvider>
  );
}
