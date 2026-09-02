import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

export async function getCurrentCoordinates() {
  const { status: existing } = await Location.getForegroundPermissionsAsync();
  let status = existing;

  if (existing !== 'granted') {
    const requested = await Location.requestForegroundPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    Alert.alert(
      'Location permission needed',
      'Allow location access so Rent Manager can fill in the property coordinates automatically. You can still enter them manually.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export function formatCoordinate(value) {
  return Number(value).toFixed(6);
}
