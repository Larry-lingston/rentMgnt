import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { COLORS, RADIUS } from '../constants/theme';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PropertyImagePicker({ images, onChange, minImages = 1 }) {
  const [picking, setPicking] = useState(false);

  async function ensureLibraryPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to choose images.');
      return false;
    }
    return true;
  }

  async function ensureCameraPermission() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take photos.');
      return false;
    }
    return true;
  }

  async function uploadAsset(asset) {
    const id = makeId();
    const localUri = asset.uri;
    onChange((prev) => [...prev, { id, uri: localUri, uploading: true }]);

    try {
      const { url } = await api.uploadImage(localUri, asset.mimeType, asset.fileName);
      onChange((prev) =>
        prev.map((img) => (img.id === id ? { ...img, url, uploading: false, error: undefined } : img))
      );
    } catch (err) {
      onChange((prev) =>
        prev.map((img) => (img.id === id ? { ...img, uploading: false, error: err.message } : img))
      );
    }
  }

  async function pickFromLibrary() {
    if (!(await ensureLibraryPermission())) return;
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAsset(result.assets[0]);
      }
    } finally {
      setPicking(false);
    }
  }

  async function takePhoto() {
    if (!(await ensureCameraPermission())) return;
    setPicking(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAsset(result.assets[0]);
      }
    } finally {
      setPicking(false);
    }
  }

  function showAddOptions() {
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from gallery', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function removeImage(id) {
    onChange((prev) => {
      if (prev.length <= minImages) {
        Alert.alert('Required', `At least ${minImages} photo${minImages > 1 ? 's' : ''} required.`);
        return prev;
      }
      return prev.filter((img) => img.id !== id);
    });
  }

  return (
    <View>
      <View style={styles.grid}>
        {images.map((img) => (
          <View key={img.id} style={styles.thumbWrap}>
            <Image source={{ uri: img.url || img.uri }} style={styles.thumb} />
            {img.uploading && (
              <View style={styles.thumbOverlay}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            )}
            {img.error && (
              <View style={[styles.thumbOverlay, styles.thumbError]}>
                <Ionicons name="alert-circle" size={22} color={COLORS.white} />
              </View>
            )}
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(img.id)}>
              <Ionicons name="close-circle" size={24} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addTile} onPress={showAddOptions} disabled={picking}>
          {picking ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="camera" size={28} color={COLORS.primary} />
              <Text style={styles.addText}>Add photo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {images.some((img) => img.error) && (
        <Text style={styles.errorHint}>Some uploads failed. Remove and try again.</Text>
      )}
    </View>
  );
}

export function getUploadedUrls(images) {
  return images.map((img) => img.url).filter(Boolean);
}

export function urlsToPickedImages(urls) {
  return urls.map((url, index) => ({
    id: `existing-${index}-${url}`,
    uri: url,
    url,
  }));
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: { width: 100, height: 100, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbError: { backgroundColor: 'rgba(229,62,62,0.75)' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: COLORS.white, borderRadius: 12 },
  addTile: {
    width: 100, height: 100, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card,
  },
  addText: { fontSize: 11, fontWeight: '600', color: COLORS.primary, marginTop: 4, textAlign: 'center' },
  errorHint: { fontSize: 12, color: COLORS.danger, marginTop: 8 },
});
