import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

interface OrderItem {
  product?: { name?: string; price?: number };
  name?: string;
  price?: number;
  qty?: number;
  quantity?: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  items?: OrderItem[];
}

const BG = '#0B1220';
const CARD = '#142033';
const CARD_ALT = '#0F1A2B';
const BORDER = '#23324A';
const ACCENT = '#2F6BFF';
const ACCENT_SOFT = '#DCE8FF';
const TEXT = '#F8FAFC';
const TEXT2 = '#9AA8BD';
const SUCCESS = '#10B981';
const DANGER = '#EF4444';
const WARN = '#F59E0B';

const REASONS = [
  'Damaged Product',
  'Wrong Product Delivered',
  'Product Quality Issue',
  'Not as Described',
  'Defective Product',
  'Other',
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  RETURN_REQUESTED: { label: 'Pending Review', bg: '#2C2108', text: WARN, icon: 'clock-outline' },
  RETURN_APPROVED: { label: 'Approved', bg: '#052C22', text: SUCCESS, icon: 'check-circle-outline' },
  RETURN_REJECTED: { label: 'Rejected', bg: '#2D0909', text: DANGER, icon: 'close-circle-outline' },
  RETURN_PICKUP_ASSIGNED: { label: 'Pickup Assigned', bg: '#0B2447', text: ACCENT_SOFT, icon: 'truck-outline' },
  RETURN_PICKED_UP: { label: 'Picked Up', bg: '#0B2447', text: ACCENT_SOFT, icon: 'package-outline' },
  RETURN_IN_TRANSIT: { label: 'In Transit', bg: '#0B2447', text: ACCENT_SOFT, icon: 'truck-fast-outline' },
  RETURN_DELIVERED: { label: 'Delivered', bg: '#052C22', text: SUCCESS, icon: 'check-all' },
  REFUND_INITIATED: { label: 'Refund Processing', bg: '#052C22', text: SUCCESS, icon: 'cash-refund' },
  REFUND_COMPLETED: { label: 'Refunded', bg: '#052C22', text: SUCCESS, icon: 'cash-check' },
};

function getStatus(s: string) {
  return STATUS_CONFIG[s] ?? { label: s, bg: CARD_ALT, text: TEXT2, icon: 'circle-small' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const getOrderLabel = (order: Order) => `#${order.orderNumber || order._id.slice(-6).toUpperCase()}`;
const getItemName = (item: OrderItem) => item.name || item.product?.name || 'Product';
const normalizeOrderStatus = (status?: string) => (status || '').toLowerCase().trim();

type ScreenView = 'list' | 'new';

export default function ReturnsScreen() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [returnableOrders, setReturnableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<ScreenView>('list');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orderPickerVisible, setOrderPickerVisible] = useState(false);

  // New return form
  const [orderId, setOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [comments, setComments] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      const { data } = await api.get('/returns/my');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setReturns(list.sort((a: ReturnRequest, b: ReturnRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setReturns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchReturnableOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const { data } = await api.get('/orders/my', { params: { status: 'delivered', limit: 100 } });
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const deliveredOrders = list
        .filter((order: Order) => normalizeOrderStatus(order.status) === 'delivered')
        .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReturnableOrders(deliveredOrders);
    } catch {
      setReturnableOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReturns();
    void fetchReturnableOrders();
  }, [fetchReturns, fetchReturnableOrders]);

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderId(order._id);
    setOrderPickerVisible(false);
  };

  const updateManualOrderId = (value: string) => {
    setOrderId(value);
    setSelectedOrder(null);
  };

  const openNewReturn = () => {
    setView('new');
    void fetchReturnableOrders();
  };

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permission to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 8,
    });

    if (!result.canceled) {
      setSelectedPhotos((result.assets || []).slice(0, 8));
    }
  };

  const submitReturn = async () => {
    // Validation
    if (!orderId.trim()) { Alert.alert('Missing', 'Please select a delivered order or enter your Order ID.'); return; }
    if (!reason) { Alert.alert('Missing', 'Please select a reason.'); return; }
    if (!accountHolderName.trim()) { Alert.alert('Missing', 'Please enter account holder name.'); return; }
    if (!bankName.trim()) { Alert.alert('Missing', 'Please enter bank name.'); return; }
    if (!accountNumber.trim()) { Alert.alert('Missing', 'Please enter account number.'); return; }
    if (!fullAddress.trim()) { Alert.alert('Missing', 'Please enter full address.'); return; }
    if (!city.trim()) { Alert.alert('Missing', 'Please enter city.'); return; }
    if (!district.trim()) { Alert.alert('Missing', 'Please enter district.'); return; }
    if (!postalCode.trim()) { Alert.alert('Missing', 'Please enter postal code.'); return; }
    if (selectedPhotos.length < 5 || selectedPhotos.length > 8) {
      Alert.alert('Photos Required', `Please upload 5 to 8 reference photos (you have ${selectedPhotos.length}).`);
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('orderId', orderId.trim());
      formData.append('reason', reason);
      formData.append('accountHolderName', accountHolderName.trim());
      formData.append('bankName', bankName.trim());
      formData.append('accountNumber', accountNumber.trim());
      formData.append('branchName', branchName.trim() || '');
      formData.append('ifscOrSwiftCode', ifscCode.trim() || '');
      formData.append('fullAddress', fullAddress.trim());
      formData.append('city', city.trim());
      formData.append('district', district.trim());
      formData.append('postalCode', postalCode.trim());
      formData.append('comments', comments.trim() || '');

      selectedPhotos.forEach((photo, idx) => {
        formData.append('referencePhotos', {
          uri: photo.uri,
          name: photo.filename || `photo_${idx}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      await api.post('/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Submitted', 'Your return request has been submitted. We will review it shortly.');
      setOrderId(''); setSelectedOrder(null); setReason(''); setAccountHolderName(''); setBankName(''); setAccountNumber('');
      setBranchName(''); setIfscCode(''); setFullAddress(''); setCity(''); setDistrict('');
      setPostalCode(''); setComments(''); setSelectedPhotos([]);
      setView('list');
      await fetchReturns();
      await fetchReturnableOrders();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.center}><ActivityIndicator size="large" color={ACCENT} /></View>
      </SafeAreaView>
    );
  }

  /* ── New Return Form ── */
  if (view === 'new') {
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => setView('list')} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={TEXT} />
          </Pressable>
          <Text style={s.headerTitle}>New Return</Text>
        </View>

        <Modal visible={orderPickerVisible} animationType="slide" transparent onRequestClose={() => setOrderPickerVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>Select Delivered Order</Text>
                  <Text style={s.modalSub}>{returnableOrders.length} available</Text>
                </View>
                <Pressable style={s.modalCloseBtn} onPress={() => setOrderPickerVisible(false)}>
                  <MaterialCommunityIcons name="close" size={20} color={TEXT} />
                </Pressable>
              </View>

              {ordersLoading ? (
                <View style={s.orderPickerState}>
                  <ActivityIndicator color={ACCENT} />
                </View>
              ) : returnableOrders.length === 0 ? (
                <View style={s.orderPickerState}>
                  <MaterialCommunityIcons name="package-variant-closed" size={42} color={TEXT2} />
                  <Text style={s.orderPickerEmptyTitle}>No delivered orders</Text>
                  <Text style={s.orderPickerEmptyText}>Only delivered product orders can be returned.</Text>
                </View>
              ) : (
                <FlatList
                  data={returnableOrders}
                  keyExtractor={(order) => order._id}
                  contentContainerStyle={s.orderPickerList}
                  renderItem={({ item: order }) => (
                    <Pressable style={s.orderOption} onPress={() => selectOrder(order)}>
                      <View style={s.orderOptionIcon}>
                        <MaterialCommunityIcons name="package-variant-closed" size={22} color={ACCENT} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.orderOptionTitle}>{getOrderLabel(order)}</Text>
                        <Text style={s.orderOptionMeta}>{formatDate(order.createdAt)} · {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</Text>
                        <Text style={s.orderOptionItems} numberOfLines={1}>{order.items?.map(getItemName).join(', ') || 'Order items'}</Text>
                      </View>
                      <Text style={s.orderOptionTotal}>LKR {(order.totalAmount || 0).toLocaleString()}</Text>
                    </Pressable>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={s.formContainer}>
              <View style={s.infoCard}>
                <MaterialCommunityIcons name="information-outline" size={20} color={ACCENT} style={s.infoIcon} />
                <Text style={s.infoText}>Enter order details, bank info, pickup address, and 5-8 reference photos. Returns must be requested within 7 days of delivery.</Text>
              </View>

              {/* Order selection */}
              <Text style={s.fieldLabel}>Order</Text>
              <Pressable style={s.orderSelectBtn} onPress={() => setOrderPickerVisible(true)}>
                <View style={s.orderSelectIcon}>
                  <MaterialCommunityIcons name="package-variant-closed-check" size={22} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderSelectTitle}>{selectedOrder ? getOrderLabel(selectedOrder) : 'Choose from delivered orders'}</Text>
                  <Text style={s.orderSelectSub}>
                    {selectedOrder
                      ? `${formatDate(selectedOrder.createdAt)} · LKR ${(selectedOrder.totalAmount || 0).toLocaleString()}`
                      : ordersLoading ? 'Loading delivered orders...' : `${returnableOrders.length} delivered order${returnableOrders.length === 1 ? '' : 's'} available`}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={22} color={TEXT2} />
              </Pressable>

              {selectedOrder && (
                <View style={s.selectedOrderCard}>
                  <Text style={s.selectedOrderItems} numberOfLines={2}>{selectedOrder.items?.map(getItemName).join(', ') || 'Order items'}</Text>
                  <Text style={s.selectedOrderHint}>This order ID will be submitted automatically.</Text>
                </View>
              )}

              <Text style={s.fieldLabel}>Order ID (Manual fallback)</Text>
              <TextInput
                style={s.input}
                value={orderId}
                onChangeText={updateManualOrderId}
                placeholder="Paste order ID if it is not listed"
                placeholderTextColor={TEXT2}
                autoCapitalize="none"
              />

              {/* Reason */}
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

              {/* Bank Details Section */}
              <Text style={s.sectionTitle}>Bank Details</Text>
              <Text style={s.fieldLabel}>Account Holder Name</Text>
              <TextInput
                style={s.input}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="Full name"
                placeholderTextColor={TEXT2}
              />

              <Text style={s.fieldLabel}>Bank Name</Text>
              <TextInput
                style={s.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="e.g., HDFC Bank"
                placeholderTextColor={TEXT2}
              />

              <Text style={s.fieldLabel}>Account Number</Text>
              <TextInput
                style={s.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="8-16 digits"
                placeholderTextColor={TEXT2}
                keyboardType="numeric"
              />

              <Text style={s.fieldLabel}>Branch Name (Optional)</Text>
              <TextInput
                style={s.input}
                value={branchName}
                onChangeText={setBranchName}
                placeholder="Branch location"
                placeholderTextColor={TEXT2}
              />

              <Text style={s.fieldLabel}>IFSC/SWIFT Code (Optional)</Text>
              <TextInput
                style={s.input}
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="IFSC or SWIFT code"
                placeholderTextColor={TEXT2}
                autoCapitalize="characters"
              />

              {/* Pickup Address Section */}
              <Text style={s.sectionTitle}>Pickup Address</Text>
              <Text style={s.fieldLabel}>Full Address</Text>
              <TextInput
                style={[s.input, s.textarea]}
                value={fullAddress}
                onChangeText={setFullAddress}
                placeholder="Complete delivery address"
                placeholderTextColor={TEXT2}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={s.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>City</Text>
                  <TextInput
                    style={s.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor={TEXT2}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.fieldLabel}>District</Text>
                  <TextInput
                    style={s.input}
                    value={district}
                    onChangeText={setDistrict}
                    placeholder="District"
                    placeholderTextColor={TEXT2}
                  />
                </View>
              </View>

              <Text style={s.fieldLabel}>Postal Code</Text>
              <TextInput
                style={s.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Postal code"
                placeholderTextColor={TEXT2}
                keyboardType="numeric"
              />

              {/* Reference Photos */}
              <Text style={s.sectionTitle}>Reference Photos (5-8 required)</Text>
              <Pressable style={s.photoUploadBtn} onPress={pickPhotos}>
                <View style={s.photoUploadContent}>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={ACCENT} />
                  <Text style={s.photoUploadText}>Tap to select photos</Text>
                  <Text style={s.photoUploadSub}>{selectedPhotos.length}/8 selected</Text>
                </View>
              </Pressable>
              {selectedPhotos.length > 0 && (
                <View style={s.photoPreviewRow}>
                  {selectedPhotos.map((p, i) => (
                    <View key={i} style={s.photoPreview}>
                      <View style={{ flex: 1, backgroundColor: CARD_ALT, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="image" size={20} color={TEXT2} />
                      </View>
                      <Pressable
                        style={s.photoRemoveBtn}
                        onPress={() => setSelectedPhotos(sp => sp.filter((_, idx) => idx !== i))}
                      >
                        <MaterialCommunityIcons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Comments */}
              <Text style={s.fieldLabel}>Additional Comments (Optional)</Text>
              <TextInput
                style={[s.input, s.textarea]}
                value={comments}
                onChangeText={setComments}
                placeholder="Describe the issue or any additional details…"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={TEXT2}
                maxLength={300}
              />
              <Text style={s.charCount}>{comments.length}/300</Text>

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
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Returns & Claims</Text>
          <Text style={s.headerSub}>{returns.length} request{returns.length !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable style={s.newBtn} onPress={openNewReturn}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="plus" size={14} color="#fff" />
            <Text style={[s.newBtnText, { marginLeft: 8 }]}>New Return</Text>
          </View>
        </Pressable>
      </View>

      {returns.length === 0 ? (
        <View style={s.emptyContainer}>
          <MaterialCommunityIcons name="keyboard-return" size={56} color={TEXT2} style={s.emptyIcon} />
          <Text style={s.emptyTitle}>No return requests</Text>
          <Text style={s.emptySubtitle}>Have an issue with an order? Submit a return or claim request.</Text>
          <Pressable style={s.emptyBtn} onPress={openNewReturn}>
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
                    <View style={s.statusRow}>
                      <MaterialCommunityIcons name={st.icon as any} size={14} color={st.text} />
                      <Text style={[s.statusText, { color: st.text }]}>{st.label}</Text>
                    </View>
                  </View>
                </View>

                <View style={s.reasonPill}>
                  <Text style={s.reasonPillText}>{ret.reason}</Text>
                </View>

                {ret.refundAmount != null && (
                  <Text style={s.refundAmt}>Refund: LKR {ret.refundAmount.toLocaleString()}</Text>
                )}

                {isOpen && (
                  <View style={s.expandedDesc}>
                    <View style={s.divider} />
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
  headerTitle: { fontSize: 26, fontWeight: '900', color: TEXT },
  headerSub: { fontSize: 13, color: TEXT2, marginTop: 1 },
  newBtn: { backgroundColor: '#2C0F4A', borderColor: '#7C3AED', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  newBtnText: { color: '#C4B5FD', fontWeight: '800', fontSize: 13 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: TEXT, textAlign: 'center' },
  emptySubtitle: { marginTop: 8, fontSize: 15, color: TEXT2, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: TEXT, fontWeight: '800', fontSize: 15 },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  card: { backgroundColor: CARD, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  returnId: { fontSize: 15, fontWeight: '800', color: TEXT },
  returnDate: { fontSize: 12, color: TEXT2, marginTop: 2 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  reasonPill: { alignSelf: 'flex-start', backgroundColor: CARD_ALT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: BORDER },
  reasonPillText: { fontSize: 12, color: TEXT2, fontWeight: '700' },
  refundAmt: { marginTop: 8, fontSize: 15, fontWeight: '900', color: SUCCESS },
  chevron: { textAlign: 'center', color: TEXT2, fontSize: 18, marginTop: 8 },

  expandedDesc: { marginTop: 4 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },
  orderRef: { fontSize: 13, color: TEXT2, fontStyle: 'italic' },

  // Form styles
  formContainer: { padding: 16 },
  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: '#0B2447', borderWidth: 1, borderColor: ACCENT, borderRadius: 14, padding: 14, marginBottom: 20, alignItems: 'flex-start' },
  infoIcon: { marginRight: 8 },
  infoText: { flex: 1, fontSize: 13, color: '#BFDBFE', lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: TEXT, marginTop: 22, marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: TEXT },
  textarea: { height: 90, paddingTop: 12 },
  charCount: { textAlign: 'right', fontSize: 11, color: TEXT2, marginTop: 4 },
  twoColRow: { flexDirection: 'row', gap: 10 },
  orderSelectBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 14 },
  orderSelectIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#0B2447', alignItems: 'center', justifyContent: 'center' },
  orderSelectTitle: { fontSize: 14, fontWeight: '900', color: TEXT },
  orderSelectSub: { fontSize: 12, color: TEXT2, marginTop: 3 },
  selectedOrderCard: { backgroundColor: '#10223C', borderWidth: 1, borderColor: ACCENT, borderRadius: 14, padding: 12, marginTop: 10 },
  selectedOrderItems: { fontSize: 13, color: TEXT, fontWeight: '700', lineHeight: 18 },
  selectedOrderHint: { fontSize: 12, color: '#BFDBFE', marginTop: 4 },
  reasonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonBtn: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: CARD_ALT },
  reasonBtnActive: { borderColor: ACCENT, backgroundColor: '#0B2447' },
  reasonBtnText: { fontSize: 12, color: TEXT2, fontWeight: '600' },
  reasonBtnTextActive: { color: TEXT, fontWeight: '800' },

  photoUploadBtn: { backgroundColor: CARD_ALT, borderWidth: 1.5, borderColor: ACCENT, borderRadius: 16, borderStyle: 'dashed', paddingVertical: 32, alignItems: 'center', justifyContent: 'center' },
  photoUploadContent: { alignItems: 'center', gap: 6 },
  photoUploadText: { fontSize: 14, fontWeight: '700', color: TEXT },
  photoUploadSub: { fontSize: 12, color: TEXT2 },
  photoPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12, marginBottom: 16 },
  photoPreview: { width: '23%', aspectRatio: 1, backgroundColor: CARD_ALT, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: BORDER },
  photoRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center' },

  submitBtn: { backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: TEXT, fontSize: 16, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.62)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '78%', backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: BORDER, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: TEXT },
  modalSub: { fontSize: 12, color: TEXT2, marginTop: 2 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD_ALT, alignItems: 'center', justifyContent: 'center' },
  orderPickerList: { paddingBottom: 8 },
  orderPickerState: { minHeight: 180, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  orderPickerEmptyTitle: { fontSize: 18, fontWeight: '900', color: TEXT, marginTop: 12 },
  orderPickerEmptyText: { fontSize: 13, color: TEXT2, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  orderOption: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 12, marginBottom: 10, backgroundColor: CARD_ALT },
  orderOptionIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#0B2447', alignItems: 'center', justifyContent: 'center' },
  orderOptionTitle: { fontSize: 14, color: TEXT, fontWeight: '900' },
  orderOptionMeta: { fontSize: 12, color: TEXT2, marginTop: 2 },
  orderOptionItems: { fontSize: 12, color: '#CBD5E1', marginTop: 3 },
  orderOptionTotal: { fontSize: 12, color: ACCENT_SOFT, fontWeight: '900' },
});