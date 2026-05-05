import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

interface ReturnRequest {
  _id: string;
  order?: { orderNumber?: string; _id: string };
  reason: string;
  status: string;
  description?: string;
  createdAt: string;
  refundAmount?: number;
}

const DARK = '#0f172a';
const MUTED = '#64748b';
const BG = '#f1f5f9';
const SURFACE = '#ffffff';
const ACCENT = '#e11d48';

const REASONS = [
  'Defective / Damaged',
  'Wrong item received',
  'Not as described',
  'Changed my mind',
  'Other',
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  pending:   { label: 'Pending Review',  bg: '#fef9c3', text: '#854d0e', icon: '⏳' },
  approved:  { label: 'Approved',        bg: '#d1fae5', text: '#065f46', icon: '✅' },
  rejected:  { label: 'Rejected',        bg: '#fee2e2', text: '#991b1b', icon: '✕'  },
  processing:{ label: 'Processing',      bg: '#dbeafe', text: '#1e40af', icon: '⚙️' },
  refunded:  { label: 'Refunded',        bg: '#dcfce7', text: '#166534', icon: '💰' },
  completed: { label: 'Completed',       bg: '#e0e7ff', text: '#3730a3', icon: '🎉' },
};

function getStatus(s: string) {
  return STATUS_CONFIG[s] ?? { label: s, bg: '#f1f5f9', text: DARK, icon: '•' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

type View = 'list' | 'new';

export default function ReturnsScreen() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<View>('list');
  const [expanded, setExpanded] = useState<string | null>(null);

  // New return form
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      const { data } = await api.get('/returns/my-returns');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setReturns(list.sort((a: ReturnRequest, b: ReturnRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setReturns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchReturns(); }, [fetchReturns]);

  const submitReturn = async () => {
    if (!orderId.trim()) { Alert.alert('Missing', 'Please enter your Order ID.'); return; }
    if (!reason) { Alert.alert('Missing', 'Please select a reason.'); return; }
    if (!description.trim()) { Alert.alert('Missing', 'Please describe the issue.'); return; }
    try {
      setSubmitting(true);
      await api.post('/returns', { orderId: orderId.trim(), reason, description: description.trim() });
      Alert.alert('✅ Submitted', 'Your return request has been submitted. We will review it shortly.');
      setOrderId(''); setReason(''); setDescription('');
      setView('list');
      await fetchReturns();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['bottom']}>
        <View style={s.center}><ActivityIndicator size="large" color={ACCENT} /></View>
      </SafeAreaView>
    );
  }

  /* ── New Return Form ── */
  if (view === 'new') {
    return (
      <SafeAreaView style={s.safeArea} edges={['bottom']}>
        <View style={s.header}>
          <Pressable onPress={() => setView('list')} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </Pressable>
          <Text style={s.headerTitle}>New Return</Text>
        </View>

        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={s.formContainer}>
              <View style={s.infoCard}>
                <Text style={s.infoIcon}>ℹ️</Text>
                <Text style={s.infoText}>Enter your Order ID from the Orders tab. Returns must be requested within 7 days of delivery.</Text>
              </View>

              <Text style={s.fieldLabel}>Order ID</Text>
              <TextInput
                style={s.input}
                value={orderId}
                onChangeText={setOrderId}
                placeholder="e.g. ABC123"
                autoCapitalize="characters"
                placeholderTextColor={MUTED}
              />

              <Text style={s.fieldLabel}>Reason for Return</Text>
              <View style={s.reasonsContainer}>
                {REASONS.map((r) => (
                  <Pressable
                    key={r}
                    style={[s.reasonBtn, reason === r && s.reasonBtnActive]}
                    onPress={() => setReason(r)}
                  >
                    <Text style={[s.reasonBtnText, reason === r && s.reasonBtnTextActive]}>{r}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.fieldLabel}>Description</Text>
              <TextInput
                style={[s.input, s.textarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue in detail…"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={MUTED}
                maxLength={500}
              />
              <Text style={s.charCount}>{description.length}/500</Text>

              <Pressable
                style={[s.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={submitReturn}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>Submit Return Request</Text>
                }
              </Pressable>
            </View>
          }
          keyExtractor={() => 'form'}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </SafeAreaView>
    );
  }

  /* ── Returns List ── */
  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Returns & Claims</Text>
          <Text style={s.headerSub}>{returns.length} request{returns.length !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable style={s.newBtn} onPress={() => setView('new')}>
          <Text style={s.newBtnText}>+ New Return</Text>
        </Pressable>
      </View>

      {returns.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyIcon}>↩️</Text>
          <Text style={s.emptyTitle}>No return requests</Text>
          <Text style={s.emptySubtitle}>Have an issue with an order? Submit a return or claim request.</Text>
          <Pressable style={s.emptyBtn} onPress={() => setView('new')}>
            <Text style={s.emptyBtnText}>Request a Return</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={returns}
          keyExtractor={(r) => r._id}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReturns(); }} tintColor={ACCENT} />}
          renderItem={({ item: ret }) => {
            const st = getStatus(ret.status);
            const isOpen = expanded === ret._id;
            return (
              <Pressable style={s.card} onPress={() => setExpanded(isOpen ? null : ret._id)}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.returnId}>Return #{ret._id.slice(-6).toUpperCase()}</Text>
                    <Text style={s.returnDate}>{formatDate(ret.createdAt)}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[s.statusText, { color: st.text }]}>{st.icon} {st.label}</Text>
                  </View>
                </View>

                <View style={s.reasonPill}>
                  <Text style={s.reasonPillText}>{ret.reason}</Text>
                </View>

                {ret.refundAmount != null && (
                  <Text style={s.refundAmt}>Refund: LKR {ret.refundAmount.toLocaleString()}</Text>
                )}

                {isOpen && ret.description && (
                  <View style={s.expandedDesc}>
                    <View style={s.divider} />
                    <Text style={s.descLabel}>Description</Text>
                    <Text style={s.descText}>{ret.description}</Text>
                    {ret.order && (
                      <Text style={s.orderRef}>
                        Order: #{ret.order.orderNumber || ret.order._id?.slice(-6).toUpperCase()}
                      </Text>
                    )}
                  </View>
                )}

                <Text style={[s.chevron, isOpen && { transform: [{ rotate: '180deg' }] }]}>⌄</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: DARK, fontWeight: '700' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: DARK },
  headerSub: { fontSize: 13, color: MUTED, marginTop: 1 },
  newBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  newBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: DARK, textAlign: 'center' },
  emptySubtitle: { marginTop: 8, fontSize: 15, color: MUTED, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  card: { backgroundColor: SURFACE, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: DARK, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  returnId: { fontSize: 15, fontWeight: '800', color: DARK },
  returnDate: { fontSize: 12, color: MUTED, marginTop: 2 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '800' },
  reasonPill: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  reasonPillText: { fontSize: 12, color: '#374151', fontWeight: '700' },
  refundAmt: { marginTop: 8, fontSize: 15, fontWeight: '900', color: '#16a34a' },
  chevron: { textAlign: 'center', color: MUTED, fontSize: 18, marginTop: 8 },

  expandedDesc: { marginTop: 4 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  descLabel: { fontSize: 12, color: MUTED, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  descText: { fontSize: 14, color: DARK, lineHeight: 20 },
  orderRef: { marginTop: 8, fontSize: 13, color: MUTED, fontStyle: 'italic' },

  // Form styles
  formContainer: { padding: 16 },
  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, marginBottom: 20, alignItems: 'flex-start' },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 19 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: SURFACE, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: DARK },
  textarea: { height: 110, paddingTop: 12 },
  charCount: { textAlign: 'right', fontSize: 11, color: MUTED, marginTop: 4 },
  reasonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: SURFACE },
  reasonBtnActive: { borderColor: ACCENT, backgroundColor: '#fee2e2' },
  reasonBtnText: { fontSize: 13, color: MUTED, fontWeight: '600' },
  reasonBtnTextActive: { color: ACCENT, fontWeight: '800' },
  submitBtn: { backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
