import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface CartItem {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  productPrice: number;
  quantity: number;
  totalAmount: number;
  availableStock?: number | null;
  isAvailable?: boolean;
  unavailableMessage?: string;
}

interface Cart {
  _id: string;
  items: CartItem[];
  totalAmount: number;
  cartCount?: number;
  subtotal?: number;
}

const BG     = '#0F172A';
const CARD   = '#1E293B';
const BORDER = '#334155';
const ACCENT = '#2563EB';
const TEXT   = '#FFFFFF';
const TEXT2  = '#94A3B8';

export default function CartScreen() {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data?.data || data || null);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchCart();
    }, [fetchCart])
  );

  useEffect(() => { void fetchCart(); }, [fetchCart]);

  const updateQty = async (itemId: string, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      removeItem(itemId);
      return;
    }
    try {
      setUpdatingId(itemId);
      await api.put(`/cart/item/${itemId}`, { quantity: newQty });
      await fetchCart();
    } catch {
      Alert.alert('Error', 'Could not update quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdatingId(itemId);
      await api.delete(`/cart/item/${itemId}`);
      await fetchCart();
    } catch {
      Alert.alert('Error', 'Could not remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  const placeOrder = async () => {
    const shippingAddress = user?.address?.trim() || '';

    if (!shippingAddress) {
      Alert.alert(
        'Shipping address required',
        'Please add your delivery address in Profile before placing an order.'
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert('Cart empty', 'Add at least one product before placing an order.');
      return;
    }

    Alert.alert(
      'Confirm Order',
      'Place this order with Cash on Delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          style: 'default',
          onPress: async () => {
            try {
              setPlacingOrder(true);
              for (const item of items) {
                await api.post('/orders', {
                  productId: item.productId,
                  qty: item.quantity,
                  shippingAddress,
                  paymentMethod: 'Cash on Delivery',
                });
                await api.delete(`/cart/item/${item._id}`);
              }
              Alert.alert('Order Placed', 'Your order has been placed successfully. You can track it in Orders.');
              await fetchCart();
            } catch (err: any) {
              Alert.alert('Failed', err?.response?.data?.message || 'Could not place order.');
            } finally {
              setPlacingOrder(false);
            }
          },
        },
      ],
    );
  };

  const items = cart?.items ?? [];
  const total = cart?.totalAmount ?? cart?.subtotal ?? items.reduce((s, i) => s + (i.totalAmount ?? i.productPrice * i.quantity), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading cart…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        {items.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{items.length}</Text>
          </View>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cart-outline" size={72} color={TEXT2} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Browse the marketplace and add motorcycle parts to your cart.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i._id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCart(); }} tintColor={ACCENT} />}
            renderItem={({ item }) => {
              const busy = updatingId === item._id;
              const lineTotal = item.totalAmount ?? item.productPrice * item.quantity;
              return (
                <View style={styles.card}>
                  {/* Category pill */}
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{item.isAvailable === false ? 'Unavailable' : 'Part'}</Text>
                  </View>

                  <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                  {item.unavailableMessage ? (
                    <Text style={styles.unavailableText}>{item.unavailableMessage}</Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.price}>LKR {lineTotal.toLocaleString()}</Text>

                    <View style={styles.qtyRow}>
                      <Pressable
                        style={[styles.qtyBtn, busy && styles.btnBusy]}
                        onPress={() => updateQty(item._id, -1, item.quantity)}
                        disabled={busy}
                      >
                        <MaterialCommunityIcons name="minus" size={16} color="#fff" />
                      </Pressable>

                      {busy ? (
                        <ActivityIndicator size="small" color={ACCENT} style={{ width: 32 }} />
                      ) : (
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                      )}

                      <Pressable
                        style={[styles.qtyBtn, busy && styles.btnBusy]}
                        onPress={() => updateQty(item._id, 1, item.quantity)}
                        disabled={busy}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                      </Pressable>

                      <Pressable
                        style={[styles.removeBtn, busy && styles.btnBusy]}
                        onPress={() => removeItem(item._id)}
                        disabled={busy}
                      >
                        <MaterialCommunityIcons name="close" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={<View style={{ height: 180 }} />}
          />

          {/* Order Summary sticky footer */}
          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</Text>
              <Text style={styles.summaryValue}>LKR {total.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: '#16a34a' }]}>Free</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>LKR {total.toLocaleString()}</Text>
            </View>

            <Pressable
              style={[styles.checkoutBtn, placingOrder && styles.btnBusy]}
              onPress={placeOrder}
              disabled={placingOrder}
            >
              {placingOrder
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.checkoutBtnText}>Place Order • Cash on Delivery</Text>
              }
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: TEXT2, fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: BG,
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: TEXT },
  badge: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: TEXT, textAlign: 'center' },
  emptySubtitle: { marginTop: 8, fontSize: 15, color: TEXT2, textAlign: 'center', lineHeight: 22 },

  listContent: { paddingHorizontal: 16, paddingTop: 8 },

  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: TEXT,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  categoryText: { color: '#92400e', fontWeight: '700', fontSize: 12 },
  productName: { fontSize: 16, fontWeight: '800', color: TEXT, lineHeight: 22 },
  unavailableText: { marginTop: 6, color: '#f97316', fontSize: 12, fontWeight: '700' },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  price: { fontSize: 17, fontWeight: '900', color: ACCENT },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, color: '#fff', fontWeight: '900', lineHeight: 22 },
  qtyValue: { fontSize: 16, fontWeight: '800', color: TEXT, minWidth: 22, textAlign: 'center' },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeBtnText: { fontSize: 13, color: '#fff', fontWeight: '900' },
  btnBusy: { opacity: 0.5 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: TEXT,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 15, color: TEXT2 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: TEXT },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  totalLabel: { fontSize: 17, fontWeight: '800', color: TEXT },
  totalValue: { fontSize: 20, fontWeight: '900', color: ACCENT },
  checkoutBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});