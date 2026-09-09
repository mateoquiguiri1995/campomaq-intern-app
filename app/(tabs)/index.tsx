import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, RefreshControl, Image as RNImage, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// Importes de servicios y tipos reales
import { useAppBootstrap } from '@/features/bootstrap/AppBootstrapProvider';
import type { Product } from '@/features/catalog/types';
import { useQuoteBuilder } from '@/features/quotes/QuoteBuilderProvider';
import { listQuotes } from '@/features/quotes/services/quoteService';
import { getQuoteTotals } from '@/features/quotes/services/quoteCalculations';
import type { PriceTier, Quote, QuoteItem } from '@/features/quotes/types';
import { useSellerDashboard } from '@/features/sellers/SellerProvider';
import { formatCurrency } from '@/utils/currency';

function getHeaderDate(): string {
  const date = new Date();
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getQuoteTotal(quote: Quote): number {
  return getQuoteTotals(quote.items).total;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) {
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `Hace ${diffMins} min`;
  }
  if (diffHrs < 24) {
    return `Hace ${diffHrs} h`;
  }
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}

export default function HomeScreen() {
  const { session, logout, updateAvatar } = useAuth();
  const userId = session?.user.id;
  const { resetBuilder } = useQuoteBuilder();
  const { seller, refresh: refreshSeller } = useSellerDashboard();
  const { reload, isLoading: isRefreshingData } = useAppBootstrap();
  const user = session?.user;
  const userName = user?.name ? user.name.split(' ')[0] : 'Vendedor';

  const avatarRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ top: 0, right: 0 });

  function handleNewQuote() {
    resetBuilder();
    router.push('/quotes/select-client');
  }

  function openMenu() {
    avatarRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      const windowWidth = Dimensions.get('window').width;
      setMenuAnchor({
        top: y + height + spacing.xs,
        right: Math.max(spacing.md, windowWidth - (x + width)),
      });
      setMenuVisible(true);
    });
  }

  async function handlePickPhoto() {
    setMenuVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
        await updateAvatar(result.assets[0].uri);
        Alert.alert('Foto actualizada', 'Tu foto de perfil se ha actualizado con éxito.');
      } catch (err) {
        Alert.alert('Error', 'No pudimos actualizar la foto de perfil.');
      }
    }
  }

  async function handleLogout() {
    setMenuVisible(false);
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          logout().catch(() => {
            Alert.alert('Error', 'No se pudo cerrar la sesión.');
          });
        },
      },
    ]);
  }

  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Evita actualizar el estado si la pantalla ya se desmontó (p. ej. si el
  // usuario navega fuera justo cuando listQuotes() resuelve).
  const isMountedRef = useRef(true);
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDashboardData = useCallback(() => {
    if (userId) {
      listQuotes(userId)
        .then((data) => {
          if (isMountedRef.current) setQuotes(data);
        })
        .catch(() => {});
    }
  }, [userId]);

  const handleRefresh = useCallback(() => {
    reload();
    loadDashboardData();
    refreshSeller();
  }, [loadDashboardData, refreshSeller, reload]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const getUserInitials = () => {
    if (!user?.name) return 'MS';
    const parts = user.name.split(' ');
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts[1]?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || 'MS';
  };

  // 1. Cálculo dinámico de la meta del mes
  const target = seller?.monthlyGoal ?? 0;
  const achieved = seller?.currentMonthSales ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const missing = Math.max(0, target - achieved);

  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = lastDay - today.getDate();

  const totalQuotesCount = quotes.length;
  // Actividad reciente: datos locales generados dentro de la aplicación.
  const categoryTotal = seller?.salesByCategory.reduce((sum, item) => sum + item.totalValue, 0) ?? 0;
  const displayCategories = seller?.salesByCategory.slice(0, 4) ?? [];
  const displayTopClients = seller?.topClients.slice(0, 3) ?? [];
  const displayTopProducts = seller?.topProducts.slice(0, 3) ?? [];

  const recentActivitiesList: Array<{
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    time: string;
    rightContent: React.ReactNode;
    timestamp: string;
  }> = [];

  quotes.forEach(q => {
    const clientName = q.client.client.name;
    const total = getQuoteTotal(q);
    
    let activityIcon: keyof typeof Ionicons.glyphMap = 'document-text';
    let activityTitle = '';
    let activityStyle: any = styles.activityDark;
    let pricePrefix = '';

    if (q.status === 'Aceptada') {
      activityIcon = 'checkmark-circle';
      activityTitle = `Cotización aceptada - ${clientName}`;
      activityStyle = styles.activityGreen;
      pricePrefix = '';
    } else if (q.status === 'Enviada') {
      activityIcon = 'send';
      activityTitle = `Cotización enviada - ${clientName}`;
    } else if (q.status === 'Rechazada') {
      activityIcon = 'document-text';
      activityTitle = `Cotización rechazada - ${clientName}`;
    } else {
      activityIcon = 'document-text';
      activityTitle = `Cotización guardada - ${clientName}`;
    }

    recentActivitiesList.push({
      id: q.id,
      icon: activityIcon,
      title: activityTitle,
      time: formatTimeAgo(q.updatedAt),
      timestamp: q.updatedAt,
      rightContent: (
        <Text style={activityStyle}>
          {pricePrefix}{formatCurrency(Math.round(total))}
        </Text>
      ),
    });
  });

  const sortedActivities = recentActivitiesList.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const displayActivities = sortedActivities.slice(0, 5);

  return (
    <ScreenContainer scroll={false} edges={['top']} style={styles.screenContent}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshingData} onRefresh={handleRefresh} colors={[colors.primaryDark]} />}
      >
        {/* Cabecera Personalizada */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.dateText}>{getHeaderDate()}</Text>
            <Text style={styles.greetingText}>Buenos días, {userName}</Text>
          </View>
          <TouchableOpacity
            ref={avatarRef}
            style={styles.avatar}
            activeOpacity={0.7}
            onPress={openMenu}
          >
            {user?.avatar ? (
              <RNImage source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            )}
          </TouchableOpacity>
        </View>

      {/* Meta del Mes Card */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>META DEL MES</Text>
          <Text style={styles.goalPercentage}>{pct}%</Text>
        </View>
        <Text style={styles.goalValues}>
          {formatCurrency(Math.round(achieved))} <Text style={styles.goalTarget}>/ {formatCurrency(Math.round(target))}</Text>
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.goalFooter}>
          Faltan {formatCurrency(Math.round(missing))} para la meta - {daysRemaining} días restantes
        </Text>
      </View>

      {/* Métricas Rejilla 2x2 */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="cash-outline" size={16} color={colors.black} />
              </View>
              <Text style={styles.metricValue}>{formatCurrency(seller?.yearTotalSales ?? 0)}</Text>
              <Text style={styles.metricLabel}>Venta anual</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="document-text" size={16} color={colors.black} />
            </View>
            <Text style={styles.metricValue}>{totalQuotesCount > 0 ? totalQuotesCount : 0}</Text>
            <Text style={styles.metricLabel}>Cotizaciones</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="cart" size={16} color={colors.black} />
            </View>
            <Text style={styles.metricValue}>{seller?.yearSalesCount ?? 0}</Text>
            <Text style={styles.metricLabel}>Ventas del año</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="trending-up" size={16} color={colors.black} />
            </View>
            <Text style={styles.metricValue}>{formatCurrency(seller?.yearAverageTicket ?? 0)}</Text>
            <Text style={styles.metricLabel}>Ticket promedio</Text>
          </View>
        </View>
      </View>

      {/* Acciones Rápidas */}
      <Text style={styles.sectionTitle}>ACCIONES RÁPIDAS</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={handleNewQuote}
        >
          <Ionicons name="document-text" size={20} color={colors.black} />
          <Text style={styles.actionBtnText}>Cotizar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/clients')}
        >
          <Ionicons name="people" size={20} color={colors.black} />
          <Text style={styles.actionBtnText}>Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/catalog')}
        >
          <Ionicons name="grid" size={20} color={colors.black} />
          <Text style={styles.actionBtnText}>Catálogo</Text>
        </TouchableOpacity>
      </View>

      {/* Ventas por Categoría */}
      <Text style={styles.sectionTitle}>VENTAS POR CATEGORÍA</Text>
      <View style={styles.categoryCard}>
        {displayCategories.map((category, index) => (
          <CategoryRow
            key={category.categoryName}
            label={category.categoryName}
            percentage={categoryTotal > 0 ? Math.round((category.totalValue / categoryTotal) * 100) : 0}
            color={['#1A1A1A', colors.primary, '#8A8A8A', '#D9D9D9'][index]}
          />
        ))}
      </View>

      {/* Mejores Clientes */}
      <Text style={styles.sectionTitle}>MEJORES CLIENTES</Text>
      <View style={styles.rankingCard}>
        {displayTopClients.map((c, idx) => (
          <RankingRow
            key={c.clientCode}
            index={idx + 1}
            name={c.clientName}
            value={formatCurrency(c.totalValue)}
            badgeStyle={idx === 0 ? styles.goldBadge : idx === 1 ? styles.silverBadge : styles.bronzeBadge}
          />
        ))}
      </View>

      {/* Top Productos */}
      <Text style={styles.sectionTitle}>TOP PRODUCTOS DEL MES</Text>
      <View style={styles.rankingCard}>
        {displayTopProducts.map((p, idx) => (
          <ProductRankingRow
            key={idx}
            index={idx + 1}
            name={p.productName}
            total={formatCurrency(p.totalValue)}
            subtitle={`${p.quantity} ${p.quantity === 1 ? 'unidad' : 'unidades'}`}
          />
        ))}
      </View>

      {/* Actividad Reciente */}
      <Text style={styles.sectionTitle}>ACTIVIDAD RECIENTE</Text>
      <View style={styles.activityCard}>
        {displayActivities.map((act) => (
          <ActivityRow
            key={act.id}
            icon={act.icon}
            title={act.title}
            time={act.time}
            rightContent={act.rightContent}
          />
        ))}
      </View>
    </ScrollView>

      {/* Botón flotante FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
        onPress={handleNewQuote}
      >
        <Ionicons name="add" size={28} color={colors.black} />
      </TouchableOpacity>

      {/* Modal del Menu de Avatar (Cerrar Sesión) */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { top: menuAnchor.top, right: menuAnchor.right }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handlePickPhoto} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={18} color={colors.black} />
              <Text style={styles.menuItemText}>Cambiar foto</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function CategoryRow({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <View style={styles.catRow}>
      <View style={styles.catInfo}>
        <Text style={styles.catLabel}>{label}</Text>
        <Text style={styles.catPercentage}>{percentage}%</Text>
      </View>
      <View style={styles.catTrack}>
        <View style={[styles.catBar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function RankingRow({
  index,
  name,
  value,
  badgeStyle,
}: {
  index: number;
  name: string;
  value: string;
  badgeStyle?: any;
}) {
  return (
    <View style={styles.rankingRow}>
      <View style={[styles.rankingBadge, badgeStyle]}>
        <Text style={styles.rankingIndexText}>{index}</Text>
      </View>
      <Text style={styles.rankingName} numberOfLines={1}>{name}</Text>
      <Text style={styles.rankingValue}>{value}</Text>
    </View>
  );
}

function ProductRankingRow({
  index,
  name,
  total,
  subtitle,
}: {
  index: number;
  name: string;
  total: string;
  subtitle: string;
}) {
  return (
    <View style={styles.rankingRow}>
      <View style={styles.blackBadge}>
        <Text style={styles.blackBadgeText}>{index}</Text>
      </View>
      <Text style={styles.rankingName} numberOfLines={1}>{name}</Text>
      <View style={styles.rankingRight}>
        <Text style={styles.rankingValue}>{total}</Text>
        <Text style={styles.rankingSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ActivityRow({
  icon,
  title,
  time,
  rightContent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  time: string;
  rightContent: React.ReactNode;
}) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIconCircle}>
        <Ionicons name={icon} size={16} color={colors.black} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
      {rightContent && <View style={styles.activityRight}>{rightContent}</View>}
    </View>
  );
}

import { styles } from '@/theme/styles/app_tabs_index';

