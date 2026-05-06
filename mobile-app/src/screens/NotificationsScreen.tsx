import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const DARK = '#0f172a';
const MUTED = '#64748b';
const BG = '#f1f5f9';
const SURFACE = '#ffffff';
const ACCENT = '#e11d48';

const TYPE_CONFIG: Record<string, { icon: string; bg: string; text: string }> = {
  order: { icon: 'package-variant-closed', bg: '#dbeafe', text: '#1e40af' },
  delivery: { icon: 'truck-delivery-outline', bg: '#d1fae5', text: '#065f46' },
  return: { icon: 'keyboard-return', bg: '#fce7f3', text: '#9d174d' },
  payment: { icon: 'credit-card-outline', bg: '#fef9c3', text: '#854d0e' },
  message: { icon: 'chat-outline', bg: '#e0e7ff', text: '#3730a3' },
  admin: { icon: 'bell-outline', bg: '#fee2e2', text: '#991b1b' },
  system: { icon: 'cog-outline', bg: '#f3f4f6', text: '#374151' },
};

function getType(t: string) {
  return TYPE_CONFIG[t] ?? TYPE_CONFIG.system;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TABS = ['All', 'Unread', 'Orders', 'Delivery'];

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('All');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setNotifs(list.sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchNotifs(); }, [fetchNotifs]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch { }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { } finally {
      setMarkingAll(false);
    }
  };

  const filtered = notifs.filter((n) => {
    if (tab === 'All') return true;
    if (tab === 'Unread') return !n.isRead;
    if (tab === 'Orders') return n.type === 'order';
    if (tab === 'Delivery') return n.type === 'delivery';
    return true;
  });

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['bottom']}>
        <View style={s.center}><ActivityIndicator size="large" color={ACCENT} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={s.unreadSummary}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <Pressable style={[s.markAllBtn, markingAll && { opacity: 0.5 }]} onPress={markAllRead} disabled={markingAll}>
            {markingAll
              ? <ActivityIndicator size="small" color={ACCENT} />
              : <Text style={s.markAllText}>Mark all read</Text>
            }
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabsContainer}>
        {TABS.map((t) => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
            {t === 'Unread' && unreadCount > 0 && (
              <View style={s.tabBadge}><Text style={s.tabBadgeText}>{unreadCount}</Text></View>
            )}
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={s.emptyContainer}>
          <MaterialCommunityIcons name="bell-outline" size={64} color={DARK} style={s.emptyIcon} />
          <Text style={s.emptyTitle}>{tab === 'Unread' ? 'All caught up!' : 'No notifications'}</Text>
          <Text style={s.emptySubtitle}>
            {tab === 'Unread' ? 'You have no unread notifications.' : 'Order updates, deliveries & messages will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n._id}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifs(); }} tintColor={ACCENT} />}
          renderItem={({ item: notif }) => {
            const tc = getType(notif.type);
            return (
              <Pressable
                style={[s.card, !notif.isRead && s.cardUnread]}
                onPress={() => !notif.isRead && markRead(notif._id)}
              >
                {/* Unread indicator */}
                {!notif.isRead && <View style={s.unreadDot} />}

                <View style={[s.iconBox, { backgroundColor: tc.bg }]}>
                  <MaterialCommunityIcons name={tc.icon as any} size={20} color={tc.text} />
                </View>

                <View style={s.notifContent}>
                  <View style={s.notifTopRow}>
                    <Text style={[s.notifTitle, !notif.isRead && s.notifTitleUnread]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <Text style={s.notifTime}>{timeAgo(notif.createdAt)}</Text>
                  </View>
                  <Text style={s.notifMessage} numberOfLines={2}>{notif.message}</Text>
                  <View style={[s.typePill, { backgroundColor: tc.bg }]}>
                    <Text style={[s.typePillText, { color: tc.text }]}>{notif.type}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: DARK },
  unreadSummary: { fontSize: 13, color: ACCENT, fontWeight: '700', marginTop: 2 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fee2e2' },
  markAllText: { color: ACCENT, fontWeight: '700', fontSize: 13 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e2e8f0', gap: 5 },
  tabActive: { backgroundColor: ACCENT },
  tabText: { fontSize: 13, fontWeight: '700', color: MUTED },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#fff', borderRadius: 999, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: ACCENT, fontSize: 10, fontWeight: '900' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: DARK, textAlign: 'center' },
  emptySubtitle: { marginTop: 8, fontSize: 15, color: MUTED, textAlign: 'center', lineHeight: 22 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: SURFACE, borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: DARK, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, position: 'relative' },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: ACCENT },
  unreadDot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: DARK, flex: 1 },
  notifTitleUnread: { fontWeight: '900' },
  notifTime: { fontSize: 11, color: MUTED, marginLeft: 8 },
  notifMessage: { fontSize: 13, color: MUTED, lineHeight: 18, marginBottom: 8 },
  typePill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  typePillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});