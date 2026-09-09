import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/spacing';
import type { Product } from '../../types';

import { ProductImage } from './ProductImage';
import { ProductInfo } from './ProductInfo';

interface ProductCardProps {
  product: Product;
  onPressDetails?: (product: Product) => void;
}

function ProductCardComponent({
  product,
  onPressDetails,
}: ProductCardProps) {
  const handlePress = useCallback(() => {
    onPressDetails?.(product);
  }, [onPressDetails, product]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <ProductImage
          code={product.code}
          imageUrl={product.imageUrl}
        />

        <View style={styles.rightColumn}>
          <ProductInfo product={product} />
        </View>
      </View>
    </Pressable>
  );
}

// Evita re-renderizar cada tarjeta visible cuando el padre (CatalogScreen)
// cambia de estado por algo ajeno a la lista (buscador, modales, etc.).
export const ProductCard = memo(ProductCardComponent);

import { styles } from '@/theme/styles/src_features_catalog_components_ProductCard_index';
