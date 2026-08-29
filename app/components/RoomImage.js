import { Image, View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function parsePropertyImages(property) {
  if (!property) return [];
  let urls = [];
  if (property.images) {
    try {
      const parsed = JSON.parse(property.images);
      if (Array.isArray(parsed)) urls = parsed;
    } catch {
      urls = [];
    }
  }
  if (property.imageUrl && !urls.includes(property.imageUrl)) {
    urls.unshift(property.imageUrl);
  }
  return urls.filter(Boolean);
}

export function getRoomGalleryImages(room) {
  if (room?.galleryImages?.length) return room.galleryImages;
  const fromProperty = parsePropertyImages(room?.property);
  const urls = [];
  if (room?.imageUrl) urls.push(room.imageUrl);
  fromProperty.forEach((u) => {
    if (!urls.includes(u)) urls.push(u);
  });
  return urls.length ? urls : [PLACEHOLDER];
}

export function getRoomImageUrl(room) {
  const gallery = getRoomGalleryImages(room);
  return gallery[0] || PLACEHOLDER;
}

export function RoomImage({ room, style, imageStyle, resizeMode = 'cover' }) {
  const uri = getRoomImageUrl(room);

  return (
    <View style={[styles.wrap, style]}>
      <Image source={{ uri }} style={[styles.image, imageStyle]} resizeMode={resizeMode} />
    </View>
  );
}

export function RoomImageGallery({ room, height = 240 }) {
  const images = getRoomGalleryImages(room);

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{ height }}
    >
      {images.map((uri, index) => (
        <Image
          key={`${uri}-${index}`}
          source={{ uri }}
          style={{ width: SCREEN_WIDTH, height, backgroundColor: COLORS.border }}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}

export function RoomImagePlaceholder({ style }) {
  return (
    <View style={[styles.wrap, styles.placeholder, style]}>
      <Ionicons name="image-outline" size={40} color={COLORS.textLight} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
