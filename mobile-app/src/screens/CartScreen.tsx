import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    category?: string;
    images?: string[];
  };
  quantity: number;
  price: number;
}

interface Cart {
  _id: string;
  items: CartItem[];
  totalAmount: number;
}

const ACCENT = '#e11d48';
const DARK = '#0f172a';
const MUTED = '#64748b';
const SURFACE = '#ffffff';
const BG = '#f1f5f9';

export default function CartScreen() {
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
              await api.post('/orders', { paymentMethod: 'cash_on_delivery' });
              Alert.alert('🎉 Order Placed!', 'Your order has been placed successfully. You can track it in Orders.');
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
  const total = cart?.totalAmount ?? items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading cart…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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
          <Text style={styles.emptyIcon}>🛒</Text>
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
              return (
                <View style={styles.card}>
                  {/* Category pill */}
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{item.product.category || 'Part'}</Text>
                  </View>

                  <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.price}>LKR {(item.product.price * item.quantity).toLocaleString()}</Text>

                    <View style={styles.qtyRow}>
                      <Pressable
                        style={[styles.qtyBtn, busy && styles.btnBusy]}
                        onPress={() => updateQty(item._id, -1, item.quantity)}
                        disabled={busy}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
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
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.removeBtn, busy && styles.btnBusy]}
                        onPress={() => removeItem(item._id)}
                        disabled={busy}
                      >
                        <Text style={styles.removeBtnText}>✕</Text>
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
  loadingText: { marginTop: 12, color: MUTED, fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: BG,
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: DARK },
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
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: DARK, textAlign: 'center' },
  emptySubtitle: { marginTop: 8, fontSize: 15, color: MUTED, textAlign: 'center', lineHeight: 22 },

  listContent: { paddingHorizontal: 16, paddingTop: 8 },

  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: DARK,
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
  productName: { fontSize: 16, fontWeight: '800', color: DARK, lineHeight: 22 },

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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, color: DARK, fontWeight: '700', lineHeight: 22 },
  qtyValue: { fontSize: 16, fontWeight: '800', color: DARK, minWidth: 22, textAlign: 'center' },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeBtnText: { fontSize: 13, color: ACCENT, fontWeight: '800' },
  btnBusy: { opacity: 0.5 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: DARK,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 15, color: MUTED },
  summaryValue: { fontSize: 15, fontWeight: '700', color: DARK },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  totalLabel: { fontSize: 17, fontWeight: '800', color: DARK },
  totalValue: { fontSize: 20, fontWeight: '900', color: ACCENT },
  checkoutBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
