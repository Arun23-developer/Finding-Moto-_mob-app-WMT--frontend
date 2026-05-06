import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<any, 'ProductDetail'>;

interface Seller {
  _id: string;
  firstName?: string;
  lastName?: string;
  shopName?: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  brand?: string;
  stock?: number;
  images?: string[];
  image?: string | null;
  seller?: Seller | null;
  rating?: number;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  buyerName: string;
  createdAt: string;
}

const BG = '#0F172A';
const CARD = '#1E293B';
const BORDER = '#334155';
const ACCENT = '#2563EB';
const TEXT = '#FFFFFF';
const TEXT2 = '#94A3B8';

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, revRes] = await Promise.allSettled([
          api.get(`/public/products/${productId}`),
          api.get(`/reviews/${productId}`),
        ]);

        if (prodRes.status === 'fulfilled') {
          const d = prodRes.value.data;
          const p = d?.data || d || null;
          setProduct(p);
        }

        if (revRes.status === 'fulfilled') {
          const d = revRes.value.data;
          const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
          setReviews(list);
        }
      } catch (err) {
        // ignore — show empty state below
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [productId]);

  const addToCart = useCallback(async () => {
    if (!product) return;
    try {
      setAdding(true);
      await api.post('/cart/add', { productId: product._id, quantity: 1 });
      Alert.alert('Added', 'Product added to cart.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not add to cart.');
    } finally {
      setAdding(false);
    }
  }, [product, navigation]);

  const sendMessage = useCallback(async () => {
    if (!product?.seller) return;
    try {
      await api.post('/chat/start', { participantId: product.seller._id });
      navigation.navigate('Messages');
    } catch {
      Alert.alert('Failed', 'Could not start conversation');
    }
  }, [product, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Text style={s.error}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const inStock = product.stock == null || product.stock > 0;
  const seller = product.seller?.shopName || `${product.seller?.firstName ?? ''} ${product.seller?.lastName ?? ''}`.trim() || 'Seller';
  const productImage = product.image || product.images?.[0] || null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={TEXT} />
          </Pressable>
          <Text style={s.headerTitle}>Product Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image */}
        <View style={s.imageBox}>
          {productImage ? (
            <Image source={{ uri: productImage }} style={s.image} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="motorbike" size={56} color={TEXT2} />
          )}
        </View>

        {/* Tags */}
        <View style={s.tagsRow}>
          {product.category && (
            <View style={s.categoryTag}>
              <Text style={s.categoryTagText}>{product.category}</Text>
            </View>
          )}
          {product.brand && (
            <View style={s.brandTag}>
              <Text style={s.brandTagText}>{product.brand}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={s.content}>
          <Text style={s.productName}>{product.name}</Text>

          <View style={s.sellerCard}>
            <View style={s.sellerAvatar}>
              <Text style={s.sellerAvatarText}>{(product.seller?.firstName?.[0] ?? '?').toUpperCase()}</Text>
            </View>
            <View style={s.sellerInfo}>
              <Text style={s.sellerName}>{seller}</Text>
              <Text style={s.sellerRole}>Seller</Text>
            </View>
          </View>

          <View style={s.priceBox}>
            <Text style={s.price}>LKR {(product.price ?? 0).toLocaleString()}</Text>
            <Text style={inStock ? s.inStock : s.outStock}>{inStock ? '● In stock' : '● Out of stock'}</Text>
          </View>

          {product.description ? (
            <>
              <Text style={s.sectionTitle}>Description</Text>
              <Text style={s.description}>{product.description}</Text>
            </>
          ) : null}

          {/* Reviews */}
          {reviews.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Reviews ({reviews.length})</Text>
              <FlatList
                scrollEnabled={false}
                data={reviews}
                keyExtractor={(r) => r._id}
                renderItem={({ item }) => (
                  <View style={s.reviewCard}>
                    <View style={s.reviewHeader}>
                      <Text style={s.reviewAuthor}>{item.buyerName}</Text>
                      <View style={s.reviewRatingRow}>
                        {Array.from({ length: item.rating }).map((_, idx) => (
                          <MaterialCommunityIcons key={idx} name="star" size={12} color="#FBBF24" />
                        ))}
                      </View>
                    </View>
                    <Text style={s.reviewText}>{item.comment}</Text>
                    <Text style={s.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                )}
              />
            </>
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* (single Add to Cart located in footer) */}

      {/* Footer Actions */}
      <View style={s.footer}>
        <Pressable style={[s.secondaryBtn, { opacity: adding ? 0.6 : 1 }]} onPress={sendMessage} disabled={adding}>
          <View style={s.actionTextRow}>
            <MaterialCommunityIcons name="chat-outline" size={16} color={TEXT} />
            <Text style={s.secondaryBtnText}>Message</Text>
          </View>
        </Pressable>

        <Pressable style={[s.primaryBtn, { opacity: adding || !inStock ? 0.6 : 1 }]} onPress={addToCart} disabled={adding || !inStock}>
          {adding ? (
            <ActivityIndicator color={TEXT} size="small" />
          ) : (
            <View style={s.actionTextRow}>
              <MaterialCommunityIcons name="cart-outline" size={16} color={TEXT} />
              <Text style={s.primaryBtnText}>Add to Cart</Text>
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: TEXT, fontSize: 18, fontWeight: '700' },

  imageBox: {
    height: 240,
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },

  tagsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  categoryTag: { backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryTagText: { color: TEXT, fontSize: 12, fontWeight: '700' },
  brandTag: { backgroundColor: CARD, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  brandTagText: { color: TEXT2, fontSize: 12, fontWeight: '600' },

  content: { paddingHorizontal: 16 },
  productName: { color: TEXT, fontSize: 22, fontWeight: '800', marginBottom: 12 },

  sellerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sellerAvatarText: { color: TEXT, fontWeight: '700', fontSize: 16 },
  sellerInfo: { flex: 1 },
  sellerName: { color: TEXT, fontWeight: '700', fontSize: 14 },
  sellerRole: { color: TEXT2, fontSize: 12, marginTop: 2 },

  priceBox: { marginBottom: 20 },
  price: { color: ACCENT, fontSize: 28, fontWeight: '900' },
  inStock: { color: '#10B981', fontSize: 13, marginTop: 4 },
  outStock: { color: '#EF4444', fontSize: 13, marginTop: 4 },

  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 20 },
  description: { color: TEXT2, fontSize: 14, lineHeight: 20 },

  reviewCard: { backgroundColor: CARD, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewAuthor: { color: TEXT, fontWeight: '700', fontSize: 13 },
  reviewRatingRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  reviewText: { color: TEXT2, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  reviewDate: { color: TEXT2, fontSize: 11 },

  error: { color: '#EF4444', fontSize: 16, textAlign: 'center', marginTop: 40 },

  footer: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER },
  primaryBtn: { flex: 1, backgroundColor: ACCENT, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: TEXT, fontWeight: '700', fontSize: 14 },
  secondaryBtn: { flex: 1, backgroundColor: CARD, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  secondaryBtnText: { color: TEXT, fontWeight: '700', fontSize: 14 },

  actionTextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});