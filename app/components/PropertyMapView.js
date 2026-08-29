import { useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, Platform, TouchableOpacity, Linking,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { COLORS } from '../constants/theme';

const DEFAULT_REGION = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function hasCoords(loc) {
  return loc?.latitude != null && loc?.longitude != null;
}

function openInMaps(loc) {
  const query = hasCoords(loc)
    ? `${loc.latitude},${loc.longitude}`
    : encodeURIComponent(loc.address || loc.name);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

export function PropertyMapView({ locations = [], focusPropertyId }) {
  const mapRef = useRef(null);
  const mapped = locations.filter(hasCoords);
  const missing = locations.filter((l) => !hasCoords(l));

  const initialRegion = useMemo(() => {
    if (focusPropertyId) {
      const focus = mapped.find((l) => l.id === focusPropertyId);
      if (focus) {
        return {
          latitude: focus.latitude,
          longitude: focus.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
      }
    }
    if (mapped.length === 1) {
      return {
        latitude: mapped[0].latitude,
        longitude: mapped[0].longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    if (mapped.length > 1) {
      const lats = mapped.map((l) => l.latitude);
      const lngs = mapped.map((l) => l.longitude);
      const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const latDelta = Math.max(0.02, (Math.max(...lats) - Math.min(...lats)) * 1.5 + 0.02);
      const lngDelta = Math.max(0.02, (Math.max(...lngs) - Math.min(...lngs)) * 1.5 + 0.02);
      return { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
    }
    return DEFAULT_REGION;
  }, [locations, focusPropertyId, mapped]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fallback}>
        {locations.map((loc) => (
          <TouchableOpacity key={loc.id} style={styles.fallbackCard} onPress={() => openInMaps(loc)}>
            <Text style={styles.fallbackTitle}>{loc.name}</Text>
            <Text style={styles.fallbackAddress}>{loc.address}</Text>
            <Text style={styles.fallbackLink}>Open in Google Maps →</Text>
          </TouchableOpacity>
        ))}
        {locations.length === 0 && <Text style={styles.empty}>No properties to show</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {mapped.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={loc.name}
            description={loc.address}
            pinColor={focusPropertyId === loc.id ? COLORS.secondary : COLORS.primary}
          >
            <Callout onPress={() => openInMaps(loc)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{loc.name}</Text>
                <Text style={styles.calloutAddress}>{loc.address}</Text>
                <Text style={styles.calloutLink}>Open in Maps</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {missing.length > 0 && (
        <View style={styles.missingBanner}>
          {missing.map((loc) => (
            <TouchableOpacity key={loc.id} onPress={() => openInMaps(loc)}>
              <Text style={styles.missingText}>{loc.name} — open by address</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {locations.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.empty}>No properties available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  callout: { padding: 8, maxWidth: 220 },
  calloutTitle: { fontWeight: '700', marginBottom: 4 },
  calloutAddress: { fontSize: 12, color: COLORS.textLight },
  calloutLink: { fontSize: 12, color: COLORS.primary, marginTop: 6, fontWeight: '600' },
  missingBanner: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: COLORS.card, borderRadius: 10, padding: 12, elevation: 4,
  },
  missingText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background,
  },
  empty: { fontSize: 16, color: COLORS.textLight },
  fallback: { flex: 1, padding: 16, backgroundColor: COLORS.background },
  fallbackCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12,
  },
  fallbackTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  fallbackAddress: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  fallbackLink: { fontSize: 14, color: COLORS.primary, marginTop: 10, fontWeight: '600' },
});
