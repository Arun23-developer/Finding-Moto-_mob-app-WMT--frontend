import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const BG = '#0F172A'; const CARD = '#1E293B'; const BORDER = '#334155';
const ACCENT = '#2563EB'; const TEXT = '#FFFFFF'; const TEXT2 = '#94A3B8';
const SUCCESS = '#10B981'; const DANGER = '#EF4444'; const WARN = '#F59E0B';

interface Order {
  _id: string; orderNumber?: string; status: string;
  totalAmount: number; createdAt: string;
  items: Array<{ product: { name: string; price: number }; quantity: number }>;
  shippingAddress?: { address?: string; city?: string };
  paymentMethod?: string;
}

const ALL_STATUSES = [
  'All', 'pending', 'awaiting_seller_confirmation', 'confirmed',
  'processing', 'ready_for_dispatch', 'pickup_assigned', 'picked_up',
  'out_for_delivery', 'delivery_failed', 'delivered', 'completed', 'cancelled',
];

const STATUS_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  pending:                     { label: 'Pending',                   icon: '⏳', color: WARN,    bg: '#2D2000' },
  awaiting_seller_confirmation:{ label: 'Awaiting Seller',           icon: '🕐', color: '#FB923C', bg: '#2D1500' },
  confirmed:                   { label: 'Confirmed',                 icon: '✅', color: SUCCESS, bg: '#002D1A' },
  processing:                  { label: 'Processing',                icon: '⚙️', color: ACCENT,  bg: '#001A3D' },
  ready_for_dispatch:          { label: 'Ready for Dispatch',        icon: '📋', color: '#A78BFA', bg: '#1A0D3D' },
  pickup_assigned:             { label: 'Pickup Assigned',           icon: '🏷️', color: '#34D399', bg: '#003D2D' },
  picked_up:                   { label: 'Picked Up',                 icon: '📤', color: '#60A5FA', bg: '#001A3D' },
  out_for_delivery:            { label: 'Out for Delivery',          icon: '🚚', color: '#FBBF24', bg: '#2D1F00' },
  delivery_failed:             { label: 'Delivery Failed',           icon: '❌', color: DANGER,  bg: '#2D0000' },
  delivered:                   { label: 'Delivered',                 icon: '🎉', color: SUCCESS, bg: '#002D1A' },
  completed:                   { label: 'Completed',                 icon: '⭐', color: '#A78BFA', bg: '#1A0D3D' },
  cancelled:                   { label: 'Cancelled',                 icon: '✕',  color: DANGER,  bg: '#2D0000' },
};

function getSt(s: string) {
  return STATUS_META[s] ?? { label: s, icon: '•', color: TEXT2, bg: CARD };
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTab(s: string) {
  if (s === 'All') return 'All';
  return getSt(s).label;
}

type ViewMode = 'list' | 'return';

export default function OrdersScreen() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState('All');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [view, setView]           = useState<ViewMode>('list');

  // Return form state
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnReason, setReturnReason]   = useState('');
  const [returnDesc, setReturnDesc]       = useState('');
  const [returnImages, setReturnImages]   = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);

  const REASONS = ['Defective / Damaged', 'Wrong item received', 'Not as described', 'Changed my mind', 'Other'];

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/my-orders');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setOrders(list.sort((a: Order, b: Order) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch { setOrders([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  const pickImages = async () => {
    if (returnImages.length >= 8) { Alert.alert('Max 8 images'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!res.canceled) {
      const newUris = res.assets.map(a => a.uri);
      setReturnImages(prev => [...prev, ...newUris].slice(0, 8));
    }
  };

  const submitReturn = async () => {
    if (!returnOrderId.trim()) { Alert.alert('Required', 'Enter your Order ID.'); return; }
    if (!returnReason) { Alert.alert('Required', 'Select a reason.'); return; }
    if (!returnDesc.trim()) { Alert.alert('Required', 'Describe the issue.'); return; }
    if (returnImages.length < 1) { Alert.alert('Required', 'Upload at least 1 image (max 8).'); return; }
    try {
      setSubmitting(true);
      await api.post('/returns', { orderId: returnOrderId.trim(), reason: returnReason, description: returnDesc.trim() });
      Alert.alert('✅ Return Submitted', 'We will review your request and contact you soon.');
      setReturnOrderId(''); setReturnReason(''); setReturnDesc(''); setReturnImages([]);
      setView('list'); await fetchOrders();
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.data?.message || 'Could not submit return.');
    } finally { setSubmitting(false); }
  };

  // ── Return form view ──────────────────────────────────
  if (view === 'return') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => setView('list')} style={s.backBtn}>
            <Text style={s.backArrow}>← Back</Text>
          </Pressable>
          <Text style={s.headerTitle}>Return Request</Text>
          <View style={{ width: 60 }} />
        </View>
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => 'form'}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          ListHeaderComponent={
            <>
              <View style={s.infoBox}>
                <Text style={s.infoText}>ℹ️  Upload 1–8 clear photos of the issue. Returns must be requested within 7 days of delivery.</Text>
              </View>

              <Text style={s.fieldLabel}>Order ID</Text>
              <TextInput style={s.input} value={returnOrderId} onChangeText={setReturnOrderId}
                placeholder="e.g. ORD-ABC123" placeholderTextColor={TEXT2} autoCapitalize="characters" />

              <Text style={s.fieldLabel}>Reason</Text>
              <View style={s.reasonGrid}>
                {REASONS.map(r => (
                  <Pressable key={r} style={[s.reasonBtn, returnReason === r && s.reasonBtnActive]} onPress={() => setReturnReason(r)}>
                    <Text style={[s.reasonBtnText, returnReason === r && { color: TEXT }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.fieldLabel}>Description</Text>
              <TextInput style={[s.input, s.textarea]} value={returnDesc} onChangeText={setReturnDesc}
                placeholder="Describe the issue clearly…" placeholderTextColor={TEXT2}
                multiline numberOfLines={4} textAlignVertical="top" maxLength={500} />
              <Text style={s.charCount}>{returnDesc.length}/500</Text>

              <View style={s.imageSection}>
                <Text style={s.fieldLabel}>Photos ({returnImages.length}/8)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imageRow}>
                  {returnImages.map((uri, i) => (
                    <View key={i} style={s.imageTile}>
                      <Text style={s.imageTileText}>📷 {i + 1}</Text>
                      <Pressable style={s.imageRemove} onPress={() => setReturnImages(prev => prev.filter((_, j) => j !== i))}>
                        <Text style={s.imageRemoveText}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                  {returnImages.length < 8 && (
                    <Pressable style={s.imageAddBtn} onPress={pickImages}>
                      <Text style={s.imageAddIcon}>+</Text>
                      <Text style={s.imageAddText}>Add Photos</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </View>

              <Pressable style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={submitReturn} disabled={submitting}>
                {submitting ? <ActivityIndicator color={TEXT} /> : <Text style={s.submitBtnText}>Submit Return Request</Text>}
              </Pressable>
            </>
          }
        />
      </SafeAreaView>
    );
  }

  // ── Orders list view ──────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Orders</Text>
        <Pressable style={s.returnTopBtn} onPress={() => setView('return')}>
          <Text style={s.returnTopBtnText}>↩ Return</Text>
        </Pressable>
      </View>

      {/* Status filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {ALL_STATUSES.map(st => {
          const meta = getSt(st);
          const active = filter === st;
          return (
            <Pressable key={st} style={[s.filterTab, active && { backgroundColor: ACCENT, borderColor: ACCENT }]} onPress={() => setFilter(st)}>
              {st !== 'All' && <Text style={s.filterTabIcon}>{meta.icon}</Text>}
              <Text style={[s.filterTabText, active && { color: TEXT }]}>{fmtTab(st)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Orders list */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={ACCENT} /></View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>📦</Text>
          <Text style={s.emptyTitle}>No orders</Text>
          <Text style={s.emptyText}>No {filter !== 'All' ? fmtTab(filter).toLowerCase() + ' ' : ''}orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => o._id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={ACCENT} />}
          renderItem={({ item: order }) => {
            const st = getSt(order.status);
            const isOpen = expanded === order._id;
            return (
              <Pressable style={s.orderCard} onPress={() => setExpanded(isOpen ? null : order._id)}>
                {/* Left accent bar */}
                <View style={[s.orderAccent, { backgroundColor: st.color }]} />

                <View style={s.orderBody}>
                  {/* Top row */}
                  <View style={s.orderTopRow}>
                    <View style={s.orderThumb}>
                      <Text style={s.orderThumbIcon}>📦</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.orderNumber}>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</Text>
                      <Text style={s.orderDate}>{fmtDate(order.createdAt)}</Text>
                      <Text style={s.orderItemPreview} numberOfLines={1}>
                        {order.items?.map(i => i.product?.name).join(', ')}
                      </Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[s.statusIcon]}>{st.icon}</Text>
                      <Text style={[s.statusLabel, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  <View style={s.orderAmountRow}>
                    <Text style={s.orderItems}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</Text>
                    <Text style={s.orderTotal}>LKR {order.totalAmount?.toLocaleString()}</Text>
                  </View>

                  {/* Expanded details */}
                  {isOpen && (
                    <View style={s.expandedSection}>
                      <View style={s.divider} />
                      {order.shippingAddress?.address && (
                        <View style={s.detailRow}>
                          <Text style={s.detailIcon}>📍</Text>
                          <Text style={s.detailVal}>{order.shippingAddress.address}{order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}</Text>
                        </View>
                      )}
                      <View style={s.detailRow}>
                        <Text style={s.detailIcon}>💳</Text>
                        <Text style={s.detailVal}>{order.paymentMethod?.replace(/_/g, ' ') || 'Cash on Delivery'}</Text>
                      </View>
                      {order.items?.map((it, idx) => (
                        <View key={idx} style={s.lineItem}>
                          <Text style={s.lineItemName} numberOfLines={1}>{it.product?.name}</Text>
                          <Text style={s.lineItemPrice}>×{it.quantity} · LKR {(it.product?.price * it.quantity).toLocaleString()}</Text>
                        </View>
                      ))}
                      {['delivered', 'completed'].includes(order.status) && (
                        <Pressable style={s.returnBtn} onPress={() => { setReturnOrderId(order.orderNumber || order._id.slice(-6).toUpperCase()); setView('return'); }}>
                          <Text style={s.returnBtnText}>↩ Request Return for this Order</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                  <Text style={[s.chevron, isOpen && { transform: [{ rotate: '180deg' }] }]}>⌄</Text>
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
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: TEXT, fontSize: 20, fontWeight: '800' },
  emptyText: { color: TEXT2, fontSize: 14 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  headerTitle: { color: TEXT, fontSize: 24, fontWeight: '900' },
  returnTopBtn: { backgroundColor: '#3B0764', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#7C3AED' },
  returnTopBtnText: { color: '#A78BFA', fontWeight: '800', fontSize: 13 },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backArrow: { color: ACCENT, fontWeight: '700', fontSize: 14 },

  filterRow: { paddingHorizontal: 14, gap: 8, marginBottom: 14, paddingBottom: 4 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  filterTabIcon: { fontSize: 13 },
  filterTabText: { color: TEXT2, fontSize: 12, fontWeight: '700' },

  list: { paddingHorizontal: 14, paddingBottom: 24 },

  orderCard: { flexDirection: 'row', backgroundColor: CARD, borderRadius: 18, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  orderAccent: { width: 4 },
  orderBody: { flex: 1, padding: 14 },
  orderTopRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  orderThumb: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#0F2744', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  orderThumbIcon: { fontSize: 22 },
  orderNumber: { color: TEXT, fontSize: 14, fontWeight: '800' },
  orderDate: { color: TEXT2, fontSize: 11, marginTop: 2 },
  orderItemPreview: { color: TEXT2, fontSize: 11, marginTop: 3 },
  statusBadge: { borderRadius: 10, padding: 6, alignItems: 'center', flexShrink: 0 },
  statusIcon: { fontSize: 16, textAlign: 'center' },
  statusLabel: { fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 2 },
  orderAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItems: { color: TEXT2, fontSize: 12 },
  orderTotal: { color: ACCENT, fontSize: 16, fontWeight: '900' },
  chevron: { textAlign: 'center', color: TEXT2, fontSize: 16, marginTop: 6 },

  expandedSection: { marginTop: 4 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 10 },
  detailRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  detailIcon: { fontSize: 13 },
  detailVal: { flex: 1, color: TEXT2, fontSize: 13, lineHeight: 18 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1, borderTopColor: BORDER },
  lineItemName: { flex: 1, color: TEXT, fontSize: 12, fontWeight: '600' },
  lineItemPrice: { color: TEXT2, fontSize: 12, marginLeft: 8 },
  returnBtn: { marginTop: 10, borderWidth: 1, borderColor: '#7C3AED', borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#1A0D3D' },
  returnBtnText: { color: '#A78BFA', fontWeight: '800', fontSize: 13 },

  // Return form
  infoBox: { backgroundColor: '#001A3D', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: ACCENT },
  infoText: { color: '#93C5FD', fontSize: 13, lineHeight: 19 },
  fieldLabel: { color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: TEXT, fontSize: 14 },
  textarea: { height: 100, paddingTop: 12 },
  charCount: { color: TEXT2, fontSize: 11, textAlign: 'right', marginTop: 4 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonBtn: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: CARD },
  reasonBtnActive: { borderColor: ACCENT, backgroundColor: '#001A3D' },
  reasonBtnText: { color: TEXT2, fontSize: 13, fontWeight: '600' },
  imageSection: { marginTop: 8 },
  imageRow: { gap: 10, paddingVertical: 4 },
  imageTile: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#0F2744', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER, position: 'relative' },
  imageTileText: { color: TEXT2, fontSize: 12 },
  imageRemove: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center' },
  imageRemoveText: { color: TEXT, fontSize: 9, fontWeight: '900' },
  imageAddBtn: { width: 72, height: 72, borderRadius: 12, backgroundColor: CARD, borderWidth: 1.5, borderColor: ACCENT, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  imageAddIcon: { color: ACCENT, fontSize: 22, fontWeight: '800' },
  imageAddText: { color: ACCENT, fontSize: 9, fontWeight: '700' },
  submitBtn: { backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: TEXT, fontSize: 16, fontWeight: '900' },
});
