import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '@/theme/styles/app_profile';
import { Button } from '@/components/common/Button';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const user = session?.user;

  function handleComingSoon() {
    Alert.alert('Próximamente', 'Esta sección estará disponible en una próxima actualización.');
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={inlineLayoutStyles.profileHeaderSpacer} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) || 'V'}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.userName}>{user?.name || 'Vendedor'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'vendedor@campomaq.ec'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'Vendedor'}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handleComingSoon}>
          <Ionicons name="person-outline" size={20} color={colors.black} />
          <Text style={styles.menuText}>Datos personales</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} style={styles.menuArrow} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleComingSoon}>
          <Ionicons name="settings-outline" size={20} color={colors.black} />
          <Text style={styles.menuText}>Configuración</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} style={styles.menuArrow} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleComingSoon}>
          <Ionicons name="help-circle-outline" size={20} color={colors.black} />
          <Text style={styles.menuText}>Ayuda</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.logoutContainer}>
        <Button
          label="Cerrar sesión"
          variant="ghost"
          icon={<Ionicons name="log-out-outline" size={18} color={colors.danger} />}
          onPress={logout}
        />
      </View>
    </ScreenContainer>
  );
}

import { inlineLayoutStyles } from '@/theme/styles/inlineLayout';
