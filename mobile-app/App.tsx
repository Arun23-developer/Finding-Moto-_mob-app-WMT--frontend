import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppProvider, useApp }   from './src/context/AppContext';

import LoginScreen    from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen     from './src/screens/HomeScreen';
import OrdersScreen   from './src/screens/OrdersScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen  from './src/screens/ProfileScreen';
import AIAssistant    from './src/components/AIAssistant';

// ── Design tokens ─────────────────────────────────────────
const BG     = '#0F172A';
const CARD   = '#1E293B';
const BORDER = '#334155';
const ACCENT = '#2563EB';
const TEXT   = '#FFFFFF';
const TEXT2  = '#94A3B8';

// ── Nav types ─────────────────────────────────────────────
type AuthStack  = { Login: undefined; Register: undefined };
type BuyerTabs  = { Home: undefined; Orders: undefined; Messages: undefined; Profile: undefined };

const AuthNav  = createNativeStackNavigator<AuthStack>();
const BuyerTab = createBottomTabNavigator<BuyerTabs>();

// ── Tab config ────────────────────────────────────────────
const TAB_META: Record<string, { icon: string; activeIcon: string; label: string }> = {
  Home:     { icon: '🏠', activeIcon: '🏠', label: 'Home'     },
  Orders:   { icon: '📦', activeIcon: '📦', label: 'Orders'   },
  Messages: { icon: '💬', activeIcon: '💬', label: 'Messages' },
  Profile:  { icon: '👤', activeIcon: '👤', label: 'Profile'  },
};

// ── Custom tab icon ───────────────────────────────────────
function TabIcon({ name, focused, badge }: { name: string; focused: boolean; badge?: number }) {
  const meta = TAB_META[name];
  return (
    <View style={t.iconWrap}>
      <Text style={[t.icon, focused && t.iconActive]}>
        {focused ? meta.activeIcon : meta.icon}
      </Text>
      {!!badge && (
        <View style={t.badge}>
          <Text style={t.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

// ── Auth navigator ────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthNav.Screen name="Login"    component={LoginScreen}    />
      <AuthNav.Screen name="Register" component={RegisterScreen} />
    </AuthNav.Navigator>
  );
}

// ── Buyer tab navigator ───────────────────────────────────
function BuyerNavigator() {
  const { unreadMessages } = useApp();
  return (
    <BuyerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: t.tabBar,
        tabBarShowLabel: true,
        tabBarLabel: ({ focused }) => (
          <Text style={[t.label, focused && t.labelActive]}>
            {TAB_META[route.name]?.label}
          </Text>
        ),
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            badge={route.name === 'Messages' ? unreadMessages : undefined}
          />
        ),
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarItemStyle: t.tabItem,
      })}
    >
      <BuyerTab.Screen name="Home"     component={HomeScreen}     />
      <BuyerTab.Screen name="Orders"   component={OrdersScreen}   />
      <BuyerTab.Screen name="Messages" component={MessagesScreen} />
      <BuyerTab.Screen name="Profile"  component={ProfileScreen}  />
    </BuyerTab.Navigator>
  );
}

// ── Root navigator (auth guard) ───────────────────────────
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={app.splash} edges={['top', 'bottom']}>
        <View style={app.splashLogoBox}>
          <Text style={app.splashEmoji}>🏍️</Text>
        </View>
        <Text style={app.splashTitle}>Finding Moto</Text>
        <Text style={app.splashSub}>Your motorbike marketplace</Text>
        <ActivityIndicator color={ACCENT} style={{ marginTop: 36 }} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer theme={{
      dark: true,
      colors: {
        primary:      ACCENT,
        background:   BG,
        card:         CARD,
        text:         TEXT,
        border:       BORDER,
        notification: '#EF4444',
      },
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium:  { fontFamily: 'System', fontWeight: '500' },
        bold:    { fontFamily: 'System', fontWeight: '700' },
        heavy:   { fontFamily: 'System', fontWeight: '900' },
      },
    }}>
      <View style={{ flex: 1 }}>
        {user?.role === 'buyer' ? <BuyerNavigator /> : <AuthNavigator />}
        {/* AI Assistant overlay — available on all buyer screens */}
        {user?.role === 'buyer' && <AIAssistant />}
      </View>
    </NavigationContainer>
  );
}

// ── App root ──────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={BG} />
      <AppProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

// ── Tab bar styles ────────────────────────────────────────
const t = StyleSheet.create({
  tabBar: {
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    height: Platform.OS === 'ios' ? 82 : 64,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 20,
  },
  tabItem: { borderRadius: 12, marginHorizontal: 2 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 36, height: 32, position: 'relative' },
  icon: { fontSize: 22, opacity: 0.4 },
  iconActive: { opacity: 1, transform: [{ scale: 1.18 }] },
  label: { fontSize: 10, color: TEXT2, fontWeight: '600', marginTop: -2 },
  labelActive: { color: ACCENT, fontWeight: '800' },
  badge: {
    position: 'absolute', top: -3, right: -5,
    backgroundColor: '#EF4444', borderRadius: 999,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: CARD,
  },
  badgeText: { color: TEXT, fontSize: 9, fontWeight: '900' },
});

// ── Splash styles ─────────────────────────────────────────
const app = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center',
  },
  splashLogoBox: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
    shadowColor: ACCENT, shadowOpacity: 0.5,
    shadowRadius: 28, elevation: 14,
  },
  splashEmoji: { fontSize: 48 },
  splashTitle: { color: TEXT, fontSize: 34, fontWeight: '900' },
  splashSub: { color: TEXT2, fontSize: 15, marginTop: 8 },
});
