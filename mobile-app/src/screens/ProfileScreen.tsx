import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BG = '#0F172A'; const CARD = '#1E293B'; const BORDER = '#334155';
const ACCENT = '#2563EB'; const TEXT = '#FFFFFF'; const TEXT2 = '#94A3B8';
const DANGER = '#EF4444';

const MENU = [
  { icon: '🛍️', label: 'My Orders',           hint: 'View all your orders' },
  { icon: '↩️', label: 'Returns & Refunds',    hint: 'Manage return requests' },
  { icon: '🔔', label: 'Notifications',         hint: 'Alerts & updates' },
  { icon: '💬', label: 'My Reviews',            hint: 'Reviews you have written' },
  { icon: '📍', label: 'Saved Addresses',       hint: 'Manage delivery addresses' },
  { icon: '❓', label: 'Help Center',           hint: 'FAQs & support' },
  { icon: '⚙️', label: 'Settings',             hint: 'App preferences' },
  { icon: '📋', label: 'Terms & Privacy',       hint: 'Legal information' },
];

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing]     = useState(false);
  const [phone, setPhone]         = useState(user?.phone ?? '');
  const [address, setAddress]     = useState(user?.address ?? '');
  const [saving, setSaving]       = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fullName = user?.fullName ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  const saveProfile = async () => {
    try {
      setSaving(true);
      await api.put('/auth/profile', { phone: phone.replace(/\D/g, '').slice(0, 10), address: address.trim() });
      await refreshUser();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not save.');
    } finally { setSaving(false); }
  };

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
            <Text style={s.rolePillText}>🛒 Buyer</Text>
          </View>
          <Text style={s.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsCard}>
          {[
            { icon: '📦', value: '–', label: 'Orders'  },
            { icon: '↩️', value: '–', label: 'Returns' },
            { icon: '⭐', value: '–', label: 'Reviews' },
          ].map(({ icon, value, label }) => (
            <View key={label} style={s.statBox}>
              <Text style={s.statIcon}>{icon}</Text>
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
                <Text style={s.editBtnText}>✏️ Edit</Text>
              </Pressable>
            ) : null}
          </View>

          <InfoRow icon="✉️" label="Email" value={user?.email ?? '—'} />

          {editing ? (
            <>
              <Text style={s.fieldLabel}>Phone</Text>
              <TextInput style={s.input} value={phone} onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit phone" placeholderTextColor={TEXT2} keyboardType="phone-pad" />
              <Text style={s.fieldLabel}>Delivery Address</Text>
              <TextInput style={[s.input, s.textarea]} value={address} onChangeText={setAddress}
                placeholder="Your delivery address" placeholderTextColor={TEXT2}
                multiline numberOfLines={3} textAlignVertical="top" />
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
              <InfoRow icon="📞" label="Phone"   value={user?.phone   || 'Not set'} />
              <InfoRow icon="📍" label="Address" value={user?.address || 'Not set'} />
            </>
          )}
        </View>

        {/* Menu */}
        <View style={s.card}>
          {MENU.map((item, idx) => (
            <Pressable key={item.label} style={[s.menuRow, idx < MENU.length - 1 && s.menuRowBorder]}>
              <View style={s.menuIconBox}>
                <Text style={s.menuIcon}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuHint}>{item.hint}</Text>
              </View>
              <Text style={s.menuChevron}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={[s.logoutBtn, loggingOut && { opacity: 0.6 }]} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut
            ? <ActivityIndicator color={DANGER} />
            : <><Text style={s.logoutIcon}>→</Text><Text style={s.logoutText}>Log Out</Text></>
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
      <Text style={s.infoIcon}>{icon}</Text>
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
  email: { color: TEXT2, fontSize: 13, marginTop: 8 },

  statsCard: { flexDirection: 'row', backgroundColor: CARD, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 22 },
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

  fieldLabel: { color: TEXT, fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: TEXT, fontSize: 14 },
  textarea: { height: 80, paddingTop: 11 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, backgroundColor: BORDER, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: TEXT2, fontWeight: '700', fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: TEXT, fontWeight: '800', fontSize: 14 },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 18 },
  menuLabel: { color: TEXT, fontSize: 14, fontWeight: '700' },
  menuHint: { color: TEXT2, fontSize: 11, marginTop: 1 },
  menuChevron: { color: TEXT2, fontSize: 22 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: DANGER, borderRadius: 16, paddingVertical: 14, marginBottom: 16 },
  logoutIcon: { color: DANGER, fontSize: 18, fontWeight: '900' },
  logoutText: { color: DANGER, fontSize: 16, fontWeight: '900' },

  version: { textAlign: 'center', color: '#334155', fontSize: 12 },
});
