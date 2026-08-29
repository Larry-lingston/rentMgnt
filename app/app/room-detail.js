import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen, Card } from '../components/UI';
import { RoomImage, RoomImageGallery } from '../components/RoomImage';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { getParam } from '../utils/params';
import { formatMoney } from '../utils/currency';

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

export default function RoomDetailScreen() {
  const params = useLocalSearchParams();
  const roomId = getParam(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (roomId) {
      api.getListing(roomId).then(setRoom).catch(console.error).finally(() => setLoading(false));
    }
  }, [roomId]);

  async function handleBook() {
    if (!user) {
      Alert.alert('Sign in required', 'Create a free account to request this room.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Register', onPress: () => router.push({ pathname: '/register', params: { accountType: 'renter', roomId } }) },
        { text: 'Login', onPress: () => router.push({ pathname: '/login', params: { roomId } }) },
      ]);
      return;
    }
    if (user.role === 'tenant') {
      Alert.alert('Already a tenant', 'You already have a rented unit.');
      return;
    }
    if (user.role === 'admin') {
      Alert.alert('Landlord account', 'Switch to a renter account to book a room.');
      return;
    }
    if (user.role !== 'seeker') {
      Alert.alert('Cannot book', 'Only renter accounts can request rooms.');
      return;
    }

    setBooking(true);
    try {
      await api.createBooking(roomId, message);
      Alert.alert('Request sent!', 'The landlord will review your booking.', [
        { text: 'OK', onPress: () => router.replace('/(seeker-tabs)/requests') },
      ]);
    } catch (err) {
      Alert.alert('Booking failed', err.message);
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!room) {
    return (
      <View style={styles.center}>
        <Ionicons name="close-circle-outline" size={48} color={COLORS.textLight} />
        <Text style={styles.error}>Room not available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <RoomImageGallery room={room} height={260} />
      <View style={styles.heroOverlay}>
        <Text style={styles.rentHero}>{formatMoney(room.rentAmount)}<Text style={styles.perMo}>/month</Text></Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.propertyName}>{room.property?.name}</Text>
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="bed-outline" size={14} color={COLORS.primary} />
            <Text style={styles.chipText}>{room.roomNumber}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="business-outline" size={14} color={COLORS.primary} />
            <Text style={styles.chipText}>{room.property?.type}</Text>
          </View>
        </View>

        <Card style={styles.detailsCard}>
          <DetailRow icon="location-outline" label="Address" value={room.property?.address} />
          <DetailRow icon="person-outline" label="Landlord" value={room.property?.user?.name} />
          {room.property?.description ? (
            <DetailRow icon="information-circle-outline" label="About" value={room.property.description} />
          ) : null}
        </Card>

        {user?.role === 'seeker' && (
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Message to landlord (optional)</Text>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Introduce yourself..."
              placeholderTextColor={COLORS.textLight}
              multiline
            />
          </View>
        )}

        <TouchableOpacity style={[styles.bookButton, SHADOW.sm]} onPress={handleBook} disabled={booking}>
          <Ionicons name="calendar" size={22} color={COLORS.white} />
          <Text style={styles.bookText}>{booking ? 'Sending...' : 'Request to Book'}</Text>
        </TouchableOpacity>

        {room.property?.latitude != null && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => router.push({
              pathname: '/map',
              params: {
                propertyId: room.property.id,
                latitude: String(room.property.latitude),
                longitude: String(room.property.longitude),
                name: room.property.name,
                address: room.property.address,
                type: room.property.type,
              },
            })}
          >
            <Ionicons name="map" size={20} color={COLORS.primary} />
            <Text style={styles.mapText}>View on Map</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hero: { width: '100%', height: 240 },
  heroOverlay: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(26,54,93,0.9)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md,
  },
  rentHero: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  perMo: { fontSize: 14, fontWeight: '500' },
  content: { padding: 20 },
  propertyName: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary + '12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
  detailsCard: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 14 },
  detailIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  detailContent: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textLight, marginBottom: 2 },
  value: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  section: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 14, fontSize: 15, backgroundColor: COLORS.card, minHeight: 88, textAlignVertical: 'top',
  },
  bookButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, padding: 16, borderRadius: RADIUS.md, marginTop: 4,
  },
  bookText: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginLeft: 8 },
  mapButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 8,
  },
  mapText: { color: COLORS.primary, fontSize: 15, fontWeight: '600', marginLeft: 6 },
  error: { fontSize: 16, color: COLORS.textLight },
});
