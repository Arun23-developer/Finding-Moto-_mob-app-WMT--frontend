import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

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

interface OrderItem {
  product?: string | { _id?: string; name?: string; price?: number };
  name?: string;
  price?: number;
  qty?: number;
  quantity?: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  order_type?: string;
  shippingAddress?: string | { address?: string; city?: string };
  paymentMethod?: string;
}

interface ReturnRequest {
  _id: string;
  order?: string | { _id?: string };
  status: string;
}

interface Review {
  _id: string;
  productId?: string | { _id?: string };
  rating: number;
  comment: string;
}

type ViewMode = 'list' | 'return';

const FILTERS = [
  'All',
  'pending',
  'awaiting_seller_confirmation',
  'confirmed',
  'processing',
  'ready_for_dispatch',
  'pickup_assigned',
  'picked_up',
  'out_for_delivery',
  'delivery_failed',
  'delivered',
  'completed',
  'cancelled',
];

const STATUS_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: 'clock-outline', color: WARN, bg: '#2C2108' },
  awaiting_seller_confirmation: { label: 'Awaiting Seller', icon: 'clock-alert-outline', color: '#F97316', bg: '#301A05' },
  confirmed: { label: 'Confirmed', icon: 'check-circle-outline', color: SUCCESS, bg: '#052C22' },
  processing: { label: 'Processing', icon: 'cog-outline', color: ACCENT, bg: '#071B38' },
  ready_for_dispatch: { label: 'Ready for Dispatch', icon: 'clipboard-text-outline', color: '#A78BFA', bg: '#1D1336' },
  pickup_assigned: { label: 'Pickup Assigned', icon: 'tag-outline', color: '#34D399', bg: '#073024' },
  picked_up: { label: 'Picked Up', icon: 'tray-arrow-up', color: '#60A5FA', bg: '#0A203C' },
  out_for_delivery: { label: 'Out for Delivery', icon: 'truck-delivery-outline', color: '#FBBF24', bg: '#332102' },
  delivery_failed: { label: 'Delivery Failed', icon: 'close-circle-outline', color: DANGER, bg: '#2D0909' },
  delivered: { label: 'Delivered', icon: 'party-popper', color: SUCCESS, bg: '#052C22' },
  completed: { label: 'Completed', icon: 'star-outline', color: '#A78BFA', bg: '#1D1336' },
  cancelled: { label: 'Cancelled', icon: 'close-thick', color: DANGER, bg: '#2D0909' },
};

const RETURN_REASONS = [
  'Damaged Product',
  'Wrong Product Delivered',
  'Product Quality Issue',
  'Not as Described',
  'Defective Product',
  'Other',
];

const getStatus = (status: string) => STATUS_META[status] ?? { label: status, icon: 'circle-small', color: TEXT2, bg: CARD_ALT };
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
const formatTabLabel = (status: string) => (status === 'All' ? 'All' : getStatus(status).label);
const normalizeOrderStatus = (status?: string) => (status || '').toLowerCase().trim();
const getOrderLabel = (order: Order) => `#${order.orderNumber || order._id.slice(-6).toUpperCase()}`;
const getProductId = (item: OrderItem) => (typeof item.product === 'string' ? item.product : item.product?._id || '');

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [returnableOrders, setReturnableOrders] = useState<Order[]>([]);
  const [returnedOrderIds, setReturnedOrderIds] = useState<Set<string>>(new Set());
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>('list');
  const [returnOrderId, setReturnOrderId] = useState('');
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<Order | null>(null);
  const [orderPickerVisible, setOrderPickerVisible] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDesc, setReturnDesc] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [returnImages, setReturnImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewProductName, setReviewProductName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/my', { params: { limit: 100 } });
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const normalized = [...list].sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(normalized);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchReturnableOrders = useCallback(async () => {
    try {
      const [{ data }, returnsRes] = await Promise.all([
        api.get('/orders/my', { params: { status: 'delivered', limit: 100 } }),
        api.get('/returns/my').catch(() => ({ data: { data: [] } })),
      ]);
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const returnList = Array.isArray(returnsRes.data?.data) ? returnsRes.data.data : Array.isArray(returnsRes.data) ? returnsRes.data : [];
      const returnOrderIds = new Set<string>(
        returnList
          .map((ret: ReturnRequest) => (typeof ret.order === 'string' ? ret.order : ret.order?._id || ''))
          .filter((id: string) => Boolean(id))
      );
      const deliveredOrders = list
        .filter((order: Order) => normalizeOrderStatus(order.status) === 'delivered' && order.order_type !== 'service')
        .filter((order: Order) => !returnOrderIds.has(order._id))
        .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReturnedOrderIds(returnOrderIds);
      setReturnableOrders(deliveredOrders);
    } catch {
      setReturnableOrders([]);
    }
  }, []);

  const fetchMyReviews = useCallback(async () => {
    try {
      const { data } = await api.get('/reviews/my');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const productIds = new Set<string>(
        list
          .map((review: Review) => (typeof review.productId === 'string' ? review.productId : review.productId?._id || ''))
          .filter((id: string) => Boolean(id))
      );
      setReviewedProductIds(productIds);
    } catch {
      setReviewedProductIds(new Set());
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    void fetchReturnableOrders();
    void fetchMyReviews();
  }, [fetchOrders, fetchReturnableOrders, fetchMyReviews]);

  useFocusEffect(
    useCallback(() => {
      void fetchOrders();
      void fetchReturnableOrders();
      void fetchMyReviews();
    }, [fetchOrders, fetchReturnableOrders, fetchMyReviews])
  );

  const getItemName = (item: OrderItem) => item.name || (typeof item.product === 'object' ? item.product?.name : '') || 'Product';
  const getItemQty = (item: OrderItem) => item.qty ?? item.quantity ?? 1;
  const getItemPrice = (item: OrderItem) => item.price ?? (typeof item.product === 'object' ? item.product?.price : 0) ?? 0;
  const getShippingAddressText = (shippingAddress: Order['shippingAddress']) => {
    if (typeof shippingAddress === 'string') return shippingAddress;
    if (!shippingAddress?.address) return '';
    return `${shippingAddress.address}${shippingAddress.city ? `, ${shippingAddress.city}` : ''}`;
  };

  const filteredOrders = filter === 'All' ? orders : orders.filter(order => order.status === filter);

  const openReturnForm = () => {
    setView('return');
    void fetchReturnableOrders();
  };

  const selectReturnOrder = (order: Order) => {
    setSelectedReturnOrder(order);
    setReturnOrderId(order._id);
    setOrderPickerVisible(false);
  };

  const updateManualReturnOrderId = (value: string) => {
    setReturnOrderId(value);
    setSelectedReturnOrder(null);
  };

  const openReviewModal = (item: OrderItem) => {
    const productId = getProductId(item);
    if (!productId) {
      Alert.alert('Unavailable', 'Could not find the product for this review.');
      return;
    }
    setReviewProductId(productId);
    setReviewProductName(getItemName(item));
    setReviewRating(5);
    setReviewComment('');
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewProductId) {
      Alert.alert('Required', 'Select a product to review.');
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert('Required', 'Write a short review comment.');
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post(`/reviews/${reviewProductId}`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewedProductIds(prev => new Set(prev).add(reviewProductId));
      setReviewModalVisible(false);
      Alert.alert('Review submitted', 'Thank you for sharing your feedback.');
      await fetchMyReviews();
    } catch (error: any) {
      Alert.alert('Failed', error?.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const pickImages = async () => {
    if (returnImages.length >= 8) {
      Alert.alert('Max 8 images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setReturnImages(prev => [...prev, ...result.assets].slice(0, 8));
    }
  };

  const submitReturn = async () => {
    if (!returnOrderId.trim()) {
      Alert.alert('Required', 'Select a delivered order or enter your Order ID.');
      return;
    }
    if (!returnReason) {
      Alert.alert('Required', 'Select a reason.');
      return;
    }
    if (!returnDesc.trim()) { Alert.alert('Required', 'Describe the issue.'); return; }
    if (!accountHolderName.trim()) { Alert.alert('Required', 'Enter account holder name.'); return; }
    if (!bankName.trim()) { Alert.alert('Required', 'Enter bank name.'); return; }
    if (!accountNumber.trim()) { Alert.alert('Required', 'Enter account number.'); return; }
    if (!fullAddress.trim()) { Alert.alert('Required', 'Enter pickup address.'); return; }
    if (!city.trim()) { Alert.alert('Required', 'Enter city.'); return; }
    if (!district.trim()) { Alert.alert('Required', 'Enter district.'); return; }
    if (!postalCode.trim()) { Alert.alert('Required', 'Enter postal code.'); return; }
    if (returnImages.length < 5 || returnImages.length > 8) {
      Alert.alert('Required', `Upload 5 to 8 reference photos (you have ${returnImages.length}).`);
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('orderId', returnOrderId.trim());
      formData.append('reason', returnReason);
      formData.append('comments', returnDesc.trim());
      formData.append('accountHolderName', accountHolderName.trim());
      formData.append('bankName', bankName.trim());
      formData.append('accountNumber', accountNumber.trim());
      formData.append('branchName', branchName.trim());
      formData.append('ifscOrSwiftCode', ifscCode.trim());
      formData.append('fullAddress', fullAddress.trim());
      formData.append('city', city.trim());
      formData.append('district', district.trim());
      formData.append('postalCode', postalCode.trim());

      returnImages.forEach((photo, index) => {
        formData.append('referencePhotos', {
          uri: photo.uri,
          name: photo.fileName || `return_photo_${index + 1}.jpg`,
          type: photo.mimeType || 'image/jpeg',
        } as any);
      });

      await api.post('/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Return submitted', 'We will review your request and contact you soon.');
      setReturnOrderId('');
      setSelectedReturnOrder(null);
      setReturnReason('');
      setReturnDesc('');
      setAccountHolderName('');
      setBankName('');
      setAccountNumber('');
      setBranchName('');
      setIfscCode('');
      setFullAddress('');
      setCity('');
      setDistrict('');
      setPostalCode('');
      setReturnImages([]);
      setView('list');
      await fetchOrders();
      await fetchReturnableOrders();
    } catch (error: any) {
      Alert.alert('Failed', error?.response?.data?.message || 'Could not submit return.');
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'return') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Modal visible={orderPickerVisible} animationType="slide" transparent onRequestClose={() => setOrderPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Select Delivered Order</Text>
                  <Text style={styles.modalSub}>{returnableOrders.length} available</Text>
                </View>
                <Pressable style={styles.modalCloseBtn} onPress={() => setOrderPickerVisible(false)}>
                  <MaterialCommunityIcons name="close" size={20} color={TEXT} />
                </Pressable>
              </View>

              {returnableOrders.length === 0 ? (
                <View style={styles.orderPickerState}>
                  <MaterialCommunityIcons name="package-variant-closed" size={44} color={TEXT2} />
                  <Text style={styles.orderPickerEmptyTitle}>No delivered orders found</Text>
                  <Text style={styles.orderPickerEmptyText}>Only delivered product orders can be returned.</Text>
                </View>
              ) : (
                <FlatList
                  data={returnableOrders}
                  keyExtractor={order => order._id}
                  contentContainerStyle={styles.orderPickerList}
                  renderItem={({ item: order }) => (
                    <Pressable style={styles.orderOption} onPress={() => selectReturnOrder(order)}>
                      <View style={styles.orderOptionIcon}>
                        <MaterialCommunityIcons name="package-variant-closed" size={22} color={ACCENT} />
                      </View>
                      <View style={styles.orderOptionMain}>
                        <Text style={styles.orderOptionTitle}>{getOrderLabel(order)}</Text>
                        <Text style={styles.orderOptionMeta}>{formatDate(order.createdAt)} · {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</Text>
                        <Text style={styles.orderOptionItems} numberOfLines={1}>{order.items?.map(getItemName).join(', ') || 'Order items'}</Text>
                      </View>
                      <Text style={styles.orderOptionTotal}>LKR {order.totalAmount?.toLocaleString()}</Text>
                    </Pressable>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        <View style={styles.simpleHeader}>
          <Pressable onPress={() => setView('list')} style={styles.backButton}>
            <View style={styles.inlineIconText}>
              <MaterialCommunityIcons name="chevron-left" size={16} color={ACCENT_SOFT} />
              <Text style={styles.backText}>Back</Text>
            </View>
          </Pressable>
          <Text style={styles.simpleHeaderTitle}>Return Request</Text>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => 'return-form'}
          contentContainerStyle={styles.formContent}
          ListHeaderComponent={
            <>
              <View style={styles.formInfo}>
                <Text style={styles.formInfoText}>Upload 1–8 clear photos of the issue. Returns must be requested within 7 days of delivery.</Text>
              </View>

              <Text style={styles.label}>Order</Text>
              <Pressable style={styles.orderSelectButton} onPress={() => setOrderPickerVisible(true)}>
                <View style={styles.orderSelectIcon}>
                  <MaterialCommunityIcons name="package-variant-closed-check" size={22} color={ACCENT} />
                </View>
                <View style={styles.orderSelectMain}>
                  <Text style={styles.orderSelectTitle}>{selectedReturnOrder ? getOrderLabel(selectedReturnOrder) : 'Choose from delivered orders'}</Text>
                  <Text style={styles.orderSelectSub}>
                    {selectedReturnOrder
                      ? `${formatDate(selectedReturnOrder.createdAt)} · LKR ${selectedReturnOrder.totalAmount?.toLocaleString()}`
                      : `${returnableOrders.length} delivered order${returnableOrders.length === 1 ? '' : 's'} available`}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={22} color={TEXT2} />
              </Pressable>

              {selectedReturnOrder ? (
                <View style={styles.selectedOrderCard}>
                  <Text style={styles.selectedOrderItems} numberOfLines={2}>{selectedReturnOrder.items?.map(getItemName).join(', ') || 'Order items'}</Text>
                  <Text style={styles.selectedOrderHint}>This order ID will be submitted automatically.</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Order ID (Manual fallback)</Text>
              <TextInput
                style={styles.input}
                value={returnOrderId}
                onChangeText={updateManualReturnOrderId}
                placeholder="Paste order ID if it is not listed"
                placeholderTextColor={TEXT2}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Reason</Text>
              <View style={styles.reasonWrap}>
                {RETURN_REASONS.map(reason => (
                  <Pressable
                    key={reason}
                    style={[styles.reasonChip, returnReason === reason && styles.reasonChipActive]}
                    onPress={() => setReturnReason(reason)}
                  >
                    <Text style={[styles.reasonText, returnReason === reason && styles.reasonTextActive]}>{reason}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={returnDesc}
                onChangeText={setReturnDesc}
                placeholder="Describe the issue clearly…"
                placeholderTextColor={TEXT2}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.counter}>{returnDesc.length}/500</Text>

              <Text style={styles.formSectionTitle}>Bank Details</Text>
              <Text style={styles.label}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="Full name"
                placeholderTextColor={TEXT2}
              />

              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Bank name"
                placeholderTextColor={TEXT2}
              />

              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="8-16 digits"
                placeholderTextColor={TEXT2}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Branch Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={branchName}
                onChangeText={setBranchName}
                placeholder="Branch location"
                placeholderTextColor={TEXT2}
              />

              <Text style={styles.label}>IFSC/SWIFT Code (Optional)</Text>
              <TextInput
                style={styles.input}
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="IFSC or SWIFT code"
                placeholderTextColor={TEXT2}
                autoCapitalize="characters"
              />

              <Text style={styles.formSectionTitle}>Pickup Address</Text>
              <Text style={styles.label}>Full Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={fullAddress}
                onChangeText={setFullAddress}
                placeholder="Complete pickup address"
                placeholderTextColor={TEXT2}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={TEXT2}
              />

              <Text style={styles.label}>District</Text>
              <TextInput
                style={styles.input}
                value={district}
                onChangeText={setDistrict}
                placeholder="District"
                placeholderTextColor={TEXT2}
              />

              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Postal code"
                placeholderTextColor={TEXT2}
                keyboardType="numeric"
              />

              <View style={styles.photoSection}>
                <Text style={styles.label}>Reference Photos ({returnImages.length}/8)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                  {returnImages.map((photo, index) => (
                    <View key={`${photo.uri}-${index}`} style={styles.photoTile}>
                        <View style={styles.photoTileTextRow}>
                          <MaterialCommunityIcons name="camera-outline" size={14} color={TEXT} />
                          <Text style={styles.photoTileText}>{index + 1}</Text>
                        </View>
                      <Pressable style={styles.photoRemove} onPress={() => setReturnImages(prev => prev.filter((_, i) => i !== index))}>
                          <MaterialCommunityIcons name="close" size={14} color={TEXT} />
                      </Pressable>
                    </View>
                  ))}
                  {returnImages.length < 8 && (
                    <Pressable style={styles.photoAdd} onPress={pickImages}>
                        <MaterialCommunityIcons name="plus" size={18} color={ACCENT} />
                      <Text style={styles.photoAddText}>Add Photos</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </View>

              <Pressable style={[styles.submitButton, submitting && { opacity: 0.7 }]} onPress={submitReturn} disabled={submitting}>
                {submitting ? <ActivityIndicator color={TEXT} /> : <Text style={styles.submitButtonText}>Submit Return Request</Text>}
              </Pressable>
            </>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Modal visible={reviewModalVisible} animationType="slide" transparent onRequestClose={() => setReviewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.reviewTitleBlock}>
                <Text style={styles.modalTitle}>Review Product</Text>
                <Text style={styles.modalSub} numberOfLines={1}>{reviewProductName || 'Delivered product'}</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setReviewModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color={TEXT} />
              </Pressable>
            </View>

            <Text style={styles.label}>Rating</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <Pressable key={star} style={styles.starButton} onPress={() => setReviewRating(star)}>
                  <MaterialCommunityIcons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={34}
                    color={star <= reviewRating ? '#FBBF24' : TEXT2}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Comment</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Share your experience with this product"
              placeholderTextColor={TEXT2}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.counter}>{reviewComment.length}/500</Text>

            <Pressable
              style={[styles.submitButton, submittingReview && { opacity: 0.7 }]}
              onPress={submitReview}
              disabled={submittingReview}
            >
              {submittingReview ? <ActivityIndicator color={TEXT} /> : <Text style={styles.submitButtonText}>Submit Review</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.screenHeader}>
        <View style={styles.screenHeaderLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Orders</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{orders.length}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Tap an order to view delivery details, payment, and item breakdown.</Text>
        </View>

        <Pressable style={styles.returnButton} onPress={openReturnForm}>
          <View style={styles.inlineIconText}>
            <MaterialCommunityIcons name="keyboard-return" size={16} color="#C4B5FD" />
            <Text style={styles.returnButtonText}>Return</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.filtersShell}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map(status => {
            const meta = getStatus(status);
            const active = filter === status;

            return (
              <Pressable
                key={status}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(status)}
              >
                {status !== 'All' && <MaterialCommunityIcons name={meta.icon as any} size={13} color={active ? TEXT : TEXT2} />}
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{formatTabLabel(status)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="package-variant-closed" size={56} color={TEXT2} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No orders</Text>
          <Text style={styles.emptyText}>No {filter !== 'All' ? `${formatTabLabel(filter).toLowerCase()} ` : ''}orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchOrders(); }} tintColor={ACCENT} />}
          renderItem={({ item: order }) => {
            const meta = getStatus(order.status);
            const isOpen = expandedOrderId === order._id;
            const hasReturnRequest = returnedOrderIds.has(order._id);

            return (
              <Pressable style={styles.orderCard} onPress={() => setExpandedOrderId(isOpen ? null : order._id)}>
                <View style={[styles.orderAccent, { backgroundColor: meta.color }]} />

                <View style={styles.orderBody}>
                  <View style={styles.orderHeaderRow}>
                    <View style={styles.orderThumb}>
                      <MaterialCommunityIcons name="package-variant-closed" size={22} color={TEXT2} />
                    </View>

                    <View style={styles.orderMainInfo}>
                      <Text style={styles.orderNumber}>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                      <Text style={styles.orderPreview} numberOfLines={1}>
                        {order.items?.map(item => getItemName(item)).join(', ')}
                      </Text>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                      <MaterialCommunityIcons name={meta.icon as any} size={14} color={meta.color} />
                      <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  <View style={styles.orderSummaryRow}>
                    <Text style={styles.orderItems}>{order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</Text>
                    <Text style={styles.orderTotal}>LKR {order.totalAmount?.toLocaleString()}</Text>
                  </View>

                  {isOpen && (
                    <View style={styles.expandedBlock}>
                      <View style={styles.divider} />

                      {getShippingAddressText(order.shippingAddress) ? (
                        <View style={styles.detailRow}>
                          <MaterialCommunityIcons name="map-marker-outline" size={16} color={TEXT2} style={styles.detailIcon} />
                          <Text style={styles.detailText}>{getShippingAddressText(order.shippingAddress)}</Text>
                        </View>
                      ) : null}

                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="credit-card-outline" size={16} color={TEXT2} style={styles.detailIcon} />
                        <Text style={styles.detailText}>{order.paymentMethod?.replace(/_/g, ' ') || 'Cash on Delivery'}</Text>
                      </View>

                      {order.items?.map((item, index) => (
                        <View key={`${order._id}-${index}`} style={styles.lineItem}>
                          <Text style={styles.lineItemName} numberOfLines={1}>{getItemName(item)}</Text>
                          <Text style={styles.lineItemPrice}>×{getItemQty(item)} · LKR {(getItemPrice(item) * getItemQty(item)).toLocaleString()}</Text>
                        </View>
                      ))}

                      {['delivered', 'completed'].includes(normalizeOrderStatus(order.status)) && (() => {
                        const reviewItem = order.items?.find(item => {
                          const productId = getProductId(item);
                          return productId && !reviewedProductIds.has(productId);
                        });

                        if (reviewItem) {
                          return (
                            <Pressable style={styles.reviewButton} onPress={() => openReviewModal(reviewItem)}>
                              <View style={styles.inlineIconText}>
                                <MaterialCommunityIcons name="star-outline" size={15} color="#FBBF24" />
                                <Text style={styles.reviewButtonText}>Review Product</Text>
                              </View>
                            </Pressable>
                          );
                        }

                        const hasReviewableItem = order.items?.some(item => Boolean(getProductId(item)));
                        return hasReviewableItem ? (
                          <View style={styles.reviewSubmittedPill}>
                            <MaterialCommunityIcons name="star-check-outline" size={15} color={SUCCESS} />
                            <Text style={styles.reviewSubmittedText}>Reviewed</Text>
                          </View>
                        ) : null;
                      })()}

                      {hasReturnRequest ? (
                        <View style={styles.returnRequestedNotice}>
                          <View style={styles.inlineIconText}>
                            <MaterialCommunityIcons name="check-circle-outline" size={16} color={SUCCESS} />
                            <Text style={styles.returnRequestedText}>Return request submitted</Text>
                          </View>
                        </View>
                      ) : normalizeOrderStatus(order.status) === 'delivered' && (
                        <Pressable
                          style={styles.returnFromOrderButton}
                          onPress={() => {
                            setSelectedReturnOrder(order);
                            setReturnOrderId(order._id);
                            setView('return');
                          }}
                        >
                          <View style={styles.inlineIconText}>
                            <MaterialCommunityIcons name="keyboard-return" size={16} color="#C4B5FD" />
                            <Text style={styles.returnFromOrderButtonText}>Request Return for this Order</Text>
                          </View>
                        </Pressable>
                      )}
                    </View>
                  )}

                  <MaterialCommunityIcons name="chevron-down" size={22} color={TEXT2} style={[styles.chevron, isOpen && styles.chevronOpen]} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 12,
  },
  screenHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: TEXT,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10223C',
    borderWidth: 1,
    borderColor: BORDER,
  },
  countBadgeText: {
    color: ACCENT_SOFT,
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    color: TEXT2,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  returnButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C0F4A',
    borderColor: '#7C3AED',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 2,
  },
  returnButtonText: {
    color: '#C4B5FD',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineIconText: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filtersShell: {
    paddingBottom: 4,
  },
  filtersRow: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 0,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  filterChipText: {
    color: TEXT2,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  filterChipTextActive: {
    color: TEXT,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 24,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 2,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyText: {
    color: TEXT2,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  orderAccent: {
    width: 4,
  },
  orderBody: {
    flex: 1,
    padding: 14,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  orderThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0F2744',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  orderMainInfo: {
    flex: 1,
    minWidth: 0,
  },
  orderNumber: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  orderDate: {
    color: TEXT2,
    fontSize: 11,
    marginTop: 2,
  },
  orderPreview: {
    color: TEXT2,
    fontSize: 11,
    marginTop: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  orderItems: {
    color: TEXT2,
    fontSize: 12,
  },
  orderTotal: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: '900',
  },
  expandedBlock: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  detailIcon: {
    marginTop: 1,
  },
  detailText: {
    flex: 1,
    color: TEXT2,
    fontSize: 13,
    lineHeight: 18,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  lineItemName: {
    flex: 1,
    color: TEXT,
    fontSize: 12,
    fontWeight: '600',
  },
  lineItemPrice: {
    color: TEXT2,
    fontSize: 12,
    marginLeft: 8,
  },
  reviewButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A16207',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#2D2106',
  },
  reviewButtonText: {
    color: '#FBBF24',
    fontWeight: '800',
    fontSize: 13,
  },
  reviewSubmittedPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#065F46',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#052C22',
  },
  reviewSubmittedText: {
    color: SUCCESS,
    fontWeight: '800',
    fontSize: 12,
  },
  returnFromOrderButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1A0D3D',
  },
  returnFromOrderButtonText: {
    color: '#C4B5FD',
    fontWeight: '800',
    fontSize: 13,
  },
  returnRequestedNotice: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#065F46',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#052C22',
  },
  returnRequestedText: {
    color: SUCCESS,
    fontWeight: '800',
    fontSize: 13,
  },
  chevron: {
    alignSelf: 'center',
    marginTop: 6,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  photoTileTextRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  simpleHeaderTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  backText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 14,
  },
  headerSpacer: {
    width: 60,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 60,
  },
  formInfo: {
    backgroundColor: '#0B2447',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  formInfoText: {
    color: '#BFDBFE',
    fontSize: 13,
    lineHeight: 19,
  },
  formSectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 22,
    marginBottom: 2,
  },
  label: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  orderSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
  },
  orderSelectIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderSelectMain: {
    flex: 1,
    minWidth: 0,
  },
  orderSelectTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },
  orderSelectSub: {
    color: TEXT2,
    fontSize: 12,
    marginTop: 3,
  },
  selectedOrderCard: {
    backgroundColor: '#10223C',
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  selectedOrderItems: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  selectedOrderHint: {
    color: '#BFDBFE',
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  counter: {
    color: TEXT2,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  reasonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: CARD_ALT,
  },
  reasonChipActive: {
    borderColor: ACCENT,
    backgroundColor: '#0B2447',
  },
  reasonText: {
    color: TEXT2,
    fontSize: 13,
    fontWeight: '600',
  },
  reasonTextActive: {
    color: TEXT,
  },
  photoSection: {
    marginTop: 8,
  },
  photoRow: {
    gap: 10,
    paddingVertical: 4,
  },
  photoTile: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#0F2744',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    position: 'relative',
  },
  photoTileText: {
    color: TEXT2,
    fontSize: 12,
  },
  photoRemove: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: DANGER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: TEXT,
    fontSize: 9,
    fontWeight: '900',
  },
  photoAdd: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: CARD_ALT,
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddIcon: {
    color: ACCENT,
    fontSize: 22,
    fontWeight: '800',
  },
  photoAddText: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '78%',
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '900',
  },
  modalSub: {
    color: TEXT2,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARD_ALT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  starButton: {
    paddingVertical: 4,
    paddingRight: 2,
  },
  orderPickerList: {
    paddingBottom: 8,
  },
  orderPickerState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  orderPickerEmptyTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
  },
  orderPickerEmptyText: {
    color: TEXT2,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  orderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    backgroundColor: CARD_ALT,
  },
  orderOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderOptionMain: {
    flex: 1,
    minWidth: 0,
  },
  orderOptionTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },
  orderOptionMeta: {
    color: TEXT2,
    fontSize: 12,
    marginTop: 2,
  },
  orderOptionItems: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 3,
  },
  orderOptionTotal: {
    color: ACCENT_SOFT,
    fontSize: 12,
    fontWeight: '900',
  },
});