import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

const headerOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '600' },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(tenant-tabs)" />
        <Stack.Screen name="(staff-tabs)" />
        <Stack.Screen name="(seeker-tabs)" />
        <Stack.Screen
          name="browse"
          options={{ ...headerOptions, title: 'Available Rooms' }}
        />
        <Stack.Screen
          name="room-detail"
          options={{ ...headerOptions, title: 'Room Details' }}
        />
        <Stack.Screen
          name="property-form"
          options={{ ...headerOptions, presentation: 'modal', title: 'Property' }}
        />
        <Stack.Screen
          name="tenant-form"
          options={{ ...headerOptions, presentation: 'modal', title: 'Tenant' }}
        />
        <Stack.Screen
          name="payment-form"
          options={{ ...headerOptions, presentation: 'modal', title: 'Record Payment' }}
        />
        <Stack.Screen
          name="maintenance-form"
          options={{ ...headerOptions, presentation: 'modal', title: 'Maintenance Request' }}
        />
        <Stack.Screen
          name="tenant-detail"
          options={{ ...headerOptions, title: 'Tenant Details' }}
        />
        <Stack.Screen
          name="map"
          options={{ ...headerOptions, title: 'Property Map' }}
        />
      </Stack>
    </AuthProvider>
  );
}
