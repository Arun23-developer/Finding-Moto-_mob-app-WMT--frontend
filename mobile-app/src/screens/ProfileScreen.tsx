import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator, Alert, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const BG = '#0F172A'; const CARD = '#1E293B'; const BORDER = '#334155';
const ACCENT = '#2563EB'; const TEXT = '#FFFFFF'; const TEXT2 = '#94A3B8';
const DANGER = '#EF4444';

const MENU = [
  { icon: 'package-variant-closed', label: 'My Orders', hint: 'View all your orders' },
  { icon: 'keyboard-return', label: 'Returns & Refunds', hint: 'Manage return requests' },
  { icon: 'bell-outline', label: 'Notifications', hint: 'Alerts & updates' },
  { icon: 'chat-outline', label: 'My Reviews', hint: 'Reviews you have written' },
  { icon: 'map-marker-outline', label: 'Saved Addresses', hint: 'Manage delivery addresses' },
  { icon: 'help-circle-outline', label: 'Help Center', hint: 'FAQs & support' },
  { icon: 'cog-outline', label: 'Settings', hint: 'App preferences' },
  { icon: 'file-document-outline', label: 'Terms & Privacy', hint: 'Legal information' },
];

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [returnsCount, setReturnsCount] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const [ordersRes, returnsRes, reviewsRes] = await Promise.allSettled([
        api.get('/orders/my'),
        api.get('/returns/my'),
        api.get('/reviews/my'),
      ]);

      if (ordersRes.status === 'fulfilled') {
        const d = ordersRes.value.data;
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setOrdersCount(list.length);
      } else setOrdersCount(0);

      if (returnsRes.status === 'fulfilled') {
        const d = returnsRes.value.data;
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setReturnsCount(list.length);
      } else setReturnsCount(0);

      if (reviewsRes.status === 'fulfilled') {
        const d = reviewsRes.value.data;
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setReviewsCount(list.length);
      } else setReviewsCount(0);
    } catch {
      setOrdersCount(0); setReturnsCount(0); setReviewsCount(0);
    }
  }, []);

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fullName = user?.fullName ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  const saveProfile = async () => {
    try {
      setSaving(true);
      await api.put('/auth/profile', { phone: phone.replace(/\D/g, '').slice(0, 10), address: address.trim() });
      await refreshUser();
      void fetchCounts();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not save.');
    } finally { setSaving(false); }
  };

  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  useFocusEffect(
    useCallback(() => { void fetchCounts(); }, [fetchCounts])
  );

  const handleLogout = () =>
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { setLoggingOut(true); await logout(); } },
    ]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar hero */}
        <View style={s.hero}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={s.name}>{fullName}</Text>
          <View style={s.rolePill}>
            <View style={s.inlineIconText}>
              <MaterialCommunityIcons name="cart-outline" size={14} color="#93C5FD" />
              <Text style={s.rolePillText}>Buyer</Text>
            </View>
          </View>
          <Text style={s.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsCard}>
          {[
            { icon: 'package-variant-closed', value: ordersCount ?? '–', label: 'Orders' },
            { icon: 'keyboard-return', value: returnsCount ?? '–', label: 'Returns' },
            { icon: 'star-outline', value: reviewsCount ?? '–', label: 'Reviews' },
          ].map(({ icon, value, label }) => (
            <View key={label} style={s.statBox}>
              <MaterialCommunityIcons name={icon as any} size={22} color={TEXT} />
              <Text style={s.statValue}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Profile card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Account Details</Text>
            {!editing ? (
              <Pressable style={s.editBtn} onPress={() => { setPhone(user?.phone ?? ''); setAddress(user?.address ?? ''); setEditing(true); }}>
                <View style={s.inlineIconText}>
                  <MaterialCommunityIcons name="pencil-outline" size={14} color="#93C5FD" />
                  <Text style={s.editBtnText}>Edit</Text>
                </View>
              </Pressable>
            ) : null}
          </View>

          <InfoRow icon="email-outline" label="Email" value={user?.email ?? '—'} />
          <Text style={s.sectionNote}>Your saved delivery address is used automatically at checkout.</Text>

          {editing ? (
            <>
              <Text style={s.fieldLabel}>Phone</Text>
              <TextInput style={s.input} value={phone} onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit phone" placeholderTextColor={TEXT2} keyboardType="phone-pad" />
              <Text style={s.fieldLabel}>Delivery Address</Text>
              <TextInput style={[s.input, s.textarea]} value={address} onChangeText={setAddress}
                placeholder="Your delivery address" placeholderTextColor={TEXT2}
                multiline numberOfLines={3} textAlignVertical="top" />
              <Text style={s.helperText}>This address will be saved and reused for cart checkout.</Text>
              <View style={s.actionRow}>
                <Pressable style={s.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color={TEXT} size="small" /> : <Text style={s.saveBtnText}>Save</Text>}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <InfoRow icon="phone-outline" label="Phone" value={user?.phone || 'Not set'} />
              <InfoRow icon="map-marker-outline" label="Address" value={user?.address || 'Not set'} />
            </>
          )}
        </View>

        {/* Menu */}
        <View style={s.card}>
          {MENU.map((item, idx) => (
            <Pressable
              key={item.label}
              style={[s.menuRow, idx < MENU.length - 1 && s.menuRowBorder]}
              onPress={() => {
                if (item.label === 'My Orders') {
                  navigation.navigate('Orders');
                } else if (item.label === 'Returns & Refunds') {
                  navigation.navigate('Returns');
                }
              }}
            >
              <View style={s.menuIconBox}>
                <MaterialCommunityIcons name={item.icon as any} size={18} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuHint}>{item.hint}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={TEXT2} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={[s.logoutBtn, loggingOut && { opacity: 0.6 }]} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut
            ? <ActivityIndicator color={DANGER} />
            : <View style={s.inlineIconText}><MaterialCommunityIcons name="logout" size={18} color={DANGER} /><Text style={s.logoutText}>Log Out</Text></View>
          }
        </Pressable>

        <Text style={s.version}>Finding Moto · Buyer App v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color={TEXT2} style={s.infoIcon} />
      <View>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 16, paddingBottom: 50 },

  hero: { alignItems: 'center', paddingVertical: 28 },
  avatarRing: { padding: 3, borderRadius: 52, borderWidth: 2, borderColor: ACCENT, marginBottom: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: TEXT, fontSize: 34, fontWeight: '900' },
  name: { color: TEXT, fontSize: 22, fontWeight: '900' },
  rolePill: { marginTop: 8, backgroundColor: '#1E3A5F', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: ACCENT },
  rolePillText: { color: '#93C5FD', fontWeight: '800', fontSize: 13 },
  inlineIconText: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  email: { color: TEXT2, fontSize: 13, marginTop: 8 },

  statsCard: { flexDirection: 'row', backgroundColor: CARD, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: TEXT, fontSize: 20, fontWeight: '900' },
  statLabel: { color: TEXT2, fontSize: 11, fontWeight: '600' },

  card: { backgroundColor: CARD, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: '800' },
  editBtn: { backgroundColor: '#1E3A5F', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: ACCENT },
  editBtnText: { color: '#93C5FD', fontWeight: '700', fontSize: 12 },

  infoRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER, alignItems: 'flex-start' },
  infoIcon: { fontSize: 18, marginTop: 1 },
  infoLabel: { color: TEXT2, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { color: TEXT, fontSize: 14, fontWeight: '600', marginTop: 2 },
  sectionNote: { color: '#93C5FD', fontSize: 12, fontWeight: '600', marginTop: 12, lineHeight: 18 },

  fieldLabel: { color: TEXT, fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: TEXT, fontSize: 14 },
  textarea: { height: 80, paddingTop: 11 },
  helperText: { color: TEXT2, fontSize: 11, marginTop: 8, lineHeight: 16 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, backgroundColor: BORDER, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: TEXT2, fontWeight: '700', fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: TEXT, fontWeight: '800', fontSize: 14 },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { color: TEXT, fontSize: 14, fontWeight: '700' },
  menuHint: { color: TEXT2, fontSize: 11, marginTop: 1 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: DANGER, borderRadius: 16, paddingVertical: 14, marginBottom: 16 },
  logoutText: { color: DANGER, fontSize: 16, fontWeight: '900' },

  version: { textAlign: 'center', color: '#334155', fontSize: 12 },
});