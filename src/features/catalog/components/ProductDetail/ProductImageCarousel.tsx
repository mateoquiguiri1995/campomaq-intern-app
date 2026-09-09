import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { styles } from '@/theme/styles/src_features_catalog_components_ProductDetail_ProductImageCarousel';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface ProductImageCarouselProps {
  images: string[];
}

const IMAGE_HEIGHT = 260;

/** Carrusel de imágenes del producto, con puntos de paginación. */
export function ProductImageCarousel({ images }: ProductImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const slideWidth = screenWidth - spacing.md * 2;

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / slideWidth
    );
    setActiveIndex(index);
  }

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(item, index) => `${item}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: slideWidth }]}>
            <Image
              source={{ uri: item }}
              style={styles.image}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
        )}
      />

      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((image, index) => (
            <View
              key={image}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

