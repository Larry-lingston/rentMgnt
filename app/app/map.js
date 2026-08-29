import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { PropertyMapView } from '../components/PropertyMapView';
import { LoadingScreen } from '../components/UI';
import { COLORS } from '../constants/theme';
import { getParam } from '../utils/params';

function buildPinFromParams(params) {
  const propertyId = getParam(params.propertyId);
  const latitude = parseFloat(getParam(params.latitude));
  const longitude = parseFloat(getParam(params.longitude));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return [{
    id: propertyId || 'property-pin',
    name: getParam(params.name) || 'Property',
    address: getParam(params.address) || '',
    latitude,
    longitude,
    type: getParam(params.type) || 'apartment',
  }];
}

export default function MapScreen() {
  const params = useLocalSearchParams();
  const propertyId = getParam(params.propertyId);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const fromParams = buildPinFromParams(params);
        if (fromParams) {
          setLocations(fromParams);
          return;
        }

        if (propertyId) {
          try {
            const loc = await api.getMapLocation(propertyId);
            setLocations([loc]);
            return;
          } catch {
            const loc = await api.getPublicMapLocation(propertyId);
            setLocations([loc]);
            return;
          }
        }

        setLocations(await api.getMapLocations());
      } catch (err) {
        setError(err.message || 'Could not load map');
        setLocations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, params.latitude, params.longitude, params.name, params.address]);

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Map unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PropertyMapView locations={locations} focusPropertyId={propertyId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: COLORS.background },
  errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  errorText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
});
