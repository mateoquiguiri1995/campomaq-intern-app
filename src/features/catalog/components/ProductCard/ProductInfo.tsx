import { styles } from '@/theme/styles/src_features_catalog_components_ProductCard_ProductInfo';
import { formatCurrency } from '@/utils/currency';
import { Text, View } from 'react-native';
import type { Product } from '../../types';

interface Props {
  product: Product;
}

export function ProductInfo({
  product,
}: Props) {
  const isLowStock = product.stockQty <= 12;
  const stockText = isLowStock ? `Stock: ${product.stockQty}` : `Disponible: ${product.stockQty}`;

  const isNew = product.isNew;
  const discount = product.discount;
  const hasDiscount = discount !== undefined && discount > 0;

  return (
    <View style={styles.container}>
      {/* Categoría */}
      <Text style={styles.category} numberOfLines={1}>
        {product.category}
      </Text>

      {/* Nombre del Producto */}
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>

      {/* Stock Badge */}
      <View style={styles.stockBadgeRow}>
        <View style={isLowStock ? styles.badgeLowStock : styles.badgeInStock}>
          <Text style={isLowStock ? styles.badgeLowStockText : styles.badgeInStockText}>
            {stockText}
          </Text>
        </View>
      </View>

      {/* Fila Inferior: Precio y Badge de Estado */}
      <View style={styles.bottomRow}>
        <View style={styles.priceCol}>
          <Text style={styles.priceText}>
            {formatCurrency(product.priceA)}
          </Text>
          <Text style={styles.priceSub}>
            PVP · {product.iva ? 'IVA 15%' : 'IVA 0%'}
          </Text>
        </View>

        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Nuevo</Text>
          </View>
        )}

        {hasDiscount && !isNew && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>-{discount}% Dcto.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

