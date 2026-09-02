import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { parsePropertyImages } from '../components/RoomImage';
import {
  PropertyImagePicker,
  getUploadedUrls,
  urlsToPickedImages,
} from '../components/PropertyImagePicker';
import { COLORS, RADIUS } from '../constants/theme';
import { getParam } from '../utils/params';
import {
  isRequired, isPositiveInt, validateLatitude, validateLongitude, trim,
} from '../utils/validation';
import { formatCoordinate, getCurrentCoordinates } from '../utils/location';

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment' },
  { id: 'house', label: 'House' },
  { id: 'commercial', label: 'Commercial' },
];

export default function PropertyFormScreen() {
  const params = useLocalSearchParams();
  const id = getParam(params.id);
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', address: '', type: 'apartment', totalRooms: '1', description: '',
    latitude: '', longitude: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (id) {
      api.getProperty(id).then((p) => {
        const imgs = parsePropertyImages(p);
        setForm({
          name: p.name,
          address: p.address,
          type: p.type,
          totalRooms: String(p.totalRooms),
          description: p.description || '',
          latitude: p.latitude != null ? String(p.latitude) : '',
          longitude: p.longitude != null ? String(p.longitude) : '',
        });
        setImages(imgs.length ? urlsToPickedImages(imgs) : []);
      });
    }
  }, [id]);

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      if (!coords) return;

      setForm((prev) => ({
        ...prev,
        latitude: formatCoordinate(coords.latitude),
        longitude: formatCoordinate(coords.longitude),
      }));
      Alert.alert('Location captured', 'Latitude and longitude have been filled from your current position.');
    } catch (err) {
      Alert.alert('Location unavailable', err.message || 'Could not get your current location. Try again or enter coordinates manually.');
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    if (!isRequired(form.name) || !isRequired(form.address)) {
      Alert.alert('Error', 'Name and address are required');
      return;
    }

    if (!id && !isPositiveInt(form.totalRooms)) {
      Alert.alert('Error', 'Total rooms must be at least 1');
      return;
    }

    const latError = validateLatitude(form.latitude);
    if (latError) {
      Alert.alert('Error', latError);
      return;
    }

    const lngError = validateLongitude(form.longitude);
    if (lngError) {
      Alert.alert('Error', lngError);
      return;
    }

    if (images.some((img) => img.uploading)) {
      Alert.alert('Please wait', 'Photos are still uploading.');
      return;
    }

    if (images.some((img) => img.error)) {
      Alert.alert('Upload failed', 'Remove failed photos or retry before saving.');
      return;
    }

    const uploadedImages = getUploadedUrls(images);
    if (uploadedImages.length === 0) {
      Alert.alert(
        'Photos required',
        'Add at least one photo from your camera or gallery so renters can see the property before booking.'
      );
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: trim(form.name),
        address: trim(form.address),
        type: form.type,
        description: trim(form.description),
        totalRooms: parseInt(form.totalRooms, 10) || 1,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        images: uploadedImages,
      };
      if (id) {
        await api.updateProperty(id, data);
      } else {
        await api.createProperty(data);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.requiredBanner}>
        <Ionicons name="images" size={22} color={COLORS.primary} />
        <Text style={styles.requiredText}>
          Property photos are required — take or choose pictures renters can view before booking.
        </Text>
      </View>

      {['name', 'address', 'description'].map((field) => (
        <View key={field}>
          <Text style={styles.label}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
            {field !== 'description' ? ' *' : ''}
          </Text>
          <TextInput
            style={[styles.input, field === 'description' && styles.multiline]}
            value={form[field]}
            onChangeText={(v) => setForm((prev) => ({ ...prev, [field]: v }))}
            multiline={field === 'description'}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      ))}

      <Text style={styles.label}>Property type *</Text>
      <View style={styles.typeRow}>
        {PROPERTY_TYPES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.typeChip, form.type === t.id && styles.typeChipActive]}
            onPress={() => setForm((prev) => ({ ...prev, type: t.id }))}
          >
            <Text style={[styles.typeChipText, form.type === t.id && styles.typeChipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!id && (
        <View>
          <Text style={styles.label}>Total Rooms *</Text>
          <TextInput
            style={styles.input}
            value={form.totalRooms}
            onChangeText={(v) => setForm((prev) => ({ ...prev, totalRooms: v }))}
            keyboardType="number-pad"
          />
        </View>
      )}

      <Text style={styles.label}>Property photos *</Text>
      <Text style={styles.hint}>Tap Add photo to take a picture or choose from your gallery.</Text>
      <PropertyImagePicker images={images} onChange={setImages} minImages={1} />

      <Text style={styles.label}>Property location (optional)</Text>
      <Text style={styles.hint}>
        Pin the property on the map by using your phone's GPS, or enter coordinates manually.
      </Text>

      <TouchableOpacity
        style={[styles.locationButton, locating && styles.locationButtonDisabled]}
        onPress={handleUseCurrentLocation}
        disabled={locating}
      >
        <Ionicons name="locate" size={20} color={COLORS.white} />
        <Text style={styles.locationButtonText}>
          {locating ? 'Getting location...' : 'Use my current location'}
        </Text>
      </TouchableOpacity>

      {form.latitude && form.longitude ? (
        <View style={styles.coordsPreview}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
          <Text style={styles.coordsPreviewText}>
            {form.latitude}, {form.longitude}
          </Text>
        </View>
      ) : null}

      <View style={styles.coordsRow}>
        <View style={styles.coordField}>
          <Text style={styles.coordLabel}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={form.latitude}
            onChangeText={(v) => setForm((prev) => ({ ...prev, latitude: v }))}
            keyboardType="decimal-pad"
            placeholder="e.g. 5.6350"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <View style={styles.coordField}>
          <Text style={styles.coordLabel}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={form.longitude}
            onChangeText={(v) => setForm((prev) => ({ ...prev, longitude: v }))}
            keyboardType="decimal-pad"
            placeholder="e.g. -0.1670"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Ionicons name="save-outline" size={22} color={COLORS.white} />
        <Text style={styles.buttonText}>{loading ? 'Saving...' : id ? 'Update Property' : 'Add Property'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  requiredBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primary + '12', padding: 14, borderRadius: RADIUS.md,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  requiredText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 20, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  hint: { fontSize: 12, color: COLORS.textLight, marginBottom: 10, lineHeight: 18 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 14, fontSize: 16, backgroundColor: COLORS.card, color: COLORS.text,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  typeChipTextActive: { color: COLORS.white },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 4,
  },
  locationButtonDisabled: { opacity: 0.7 },
  locationButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  coordsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondary + '12',
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  coordsPreviewText: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '500' },
  coordsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  coordField: { flex: 1 },
  coordLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textLight, marginBottom: 6 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, marginBottom: 40,
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
