import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

interface Product {
  _id: string;
  name: string;
  price?: number;
  category?: string;
  brand?: string;
  stock?: number;
  description?: string;
  seller?: { firstName?: string; lastName?: string; shopName?: string };
}

const DARK = '#0f172a';
const MUTED = '#64748b';
const BG = '#f1f5f9';
const SURFACE = '#ffffff';
const ACCENT = '#e11d48';

const CATEGORIES = ['All', 'Engine', 'Brakes', 'Suspension', 'Electrical', 'Tyres', 'Body', 'Accessories'];

const CATEGORY_ICONS: Record<string, string> = {
  All: '🏍️', Engine: '⚙️', Brakes: '🛞', Suspension: '🔧',
  Electrical: '⚡', Tyres: '🔘', Body: '🏗️', Accessories: '🎒',
};

function toINR(n: number) {
  return `LKR ${n.toLocaleString()}`;
}

export default function MarketplaceScreen() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [imageTip, setImageTip] = useState('');
  const searchRef = useRef<TextInput>(null);

  const fetchProducts = useCallback(async (q = query, cat = category) => {
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.search = q.trim();
      if (cat !== 'All') params.category = cat;
      const { data } = await api.get('/public/products', { params });
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setProducts(list);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchProducts(); }, []);

  const onSearch = () => fetchProducts(query, category);

  const onCategoryChange = (cat: string) => {
    setCategory(cat);
    fetchProducts(query, cat);
  };

  const addToCart = async (productId: string) => {
    try {
      setAddingId(productId);
      await api.post('/cart/add', { productId, quantity: 1 });
      setAddedId(productId);
      setTimeout(() => setAddedId(null), 2000);
    } catch {
      // silent
    } finally {
      setAddingId(null);
    }
  };

  const handleImageSearch = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageTip('Image search coming soon — connect to backend AI endpoint.');
      setTimeout(() => setImageTip(''), 3000);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const added = addedId === item._id;
    const adding = addingId === item._id;
    const sellerName = item.seller?.shopName || `${item.seller?.firstName ?? ''} ${item.seller?.lastName ?? ''}`.trim() || 'Seller';
    return (
      <View style={s.productCard}>
        {/* Thumbnail placeholder */}
        <View style={s.productThumb}>
          <Text style={s.productThumbIcon}>🏍️</Text>
        </View>

        {/* Category & Brand */}
        <View style={s.productTagRow}>
          {item.category && (
            <View style={s.categoryTag}>
              <Text style={s.categoryTagText}>{item.category}</Text>
            </View>
          )}
          {item.brand && (
            <View style={s.brandTag}>
              <Text style={s.brandTagText}>{item.brand}</Text>
            </View>
          )}
        </View>

        <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={s.productSeller} numberOfLines={1}>by {sellerName}</Text>

        {item.description ? (
          <Text style={s.productDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={s.productFooter}>
          <View>
            <Text style={s.price}>{toINR(item.price ?? 0)}</Text>
            {item.stock != null && (
              <Text style={item.stock > 0 ? s.inStock : s.outOfStock}>
                {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
              </Text>
            )}
          </View>
          <Pressable
            style={[s.addBtn, added && s.addedBtn, (adding || item.stock === 0) && { opacity: 0.5 }]}
            onPress={() => addToCart(item._id)}
            disabled={adding || item.stock === 0}
          >
            {adding
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.addBtnText}>{added ? '✓ Added' : '+ Cart'}</Text>
            }
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerGreet}>Find Parts &</Text>
          <Text style={s.headerTitle}>Services 🏍️</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={s.searchRow}>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={searchRef}
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search parts, brands, categories…"
            placeholderTextColor={MUTED}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); fetchProducts('', category); }}>
              <Text style={s.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={s.imgSearchBtn} onPress={handleImageSearch}>
          <Text style={s.imgSearchIcon}>📷</Text>
        </Pressable>
      </View>

      {imageTip ? (
        <View style={s.tipBar}><Text style={s.tipText}>{imageTip}</Text></View>
      ) : null}

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categoriesScroll}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[s.catChip, category === cat && s.catChipActive]}
            onPress={() => onCategoryChange(cat)}
          >
            <Text style={s.catChipIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={[s.catChipText, category === cat && s.catChipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results count */}
      {!loading && (
        <View style={s.resultsRow}>
          <Text style={s.resultsText}>
            {products.length} result{products.length !== 1 ? 's' : ''}
            {category !== 'All' ? ` in ${category}` : ''}
            {query.trim() ? ` for "${query.trim()}"` : ''}
          </Text>
          {(query.trim() || category !== 'All') && (
            <Pressable onPress={() => { setQuery(''); setCategory('All'); fetchProducts('', 'All'); }}>
              <Text style={s.clearFilters}>Clear filters</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Product List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={s.loadingText}>Loading products…</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={s.gridContent}
          columnWrapperStyle={s.gridRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchProducts(); }}
              tintColor={ACCENT}
            />
          }
          renderItem={renderProduct}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyTitle}>No products found</Text>
              <Text style={s.emptySubtitle}>Try a different search term or category.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { marginTop: 12, color: MUTED, fontSize: 15 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  headerGreet: { fontSize: 16, color: MUTED, fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: DARK, lineHeight: 34 },

  searchRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, gap: 8, shadowColor: DARK, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: DARK },
  clearBtn: { fontSize: 14, color: MUTED, paddingHorizontal: 4 },
  imgSearchBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', shadowColor: DARK, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  imgSearchIcon: { fontSize: 22 },

  tipBar: { marginHorizontal: 16, marginBottom: 6, backgroundColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  tipText: { color: '#1e40af', fontWeight: '600', fontSize: 12 },

  categoriesScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: SURFACE, shadowColor: DARK, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  catChipActive: { backgroundColor: ACCENT },
  catChipIcon: { fontSize: 14 },
  catChipText: { fontSize: 13, fontWeight: '700', color: MUTED },
  catChipTextActive: { color: '#fff' },

  resultsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  resultsText: { fontSize: 13, color: MUTED },
  clearFilters: { fontSize: 13, color: ACCENT, fontWeight: '700' },

  gridContent: { paddingHorizontal: 12, paddingBottom: 24 },
  gridRow: { justifyContent: 'space-between', gap: 0 },

  productCard: {
    width: '48.5%',
    backgroundColor: SURFACE,
    borderRadius: 18,
    marginBottom: 12,
    padding: 12,
    shadowColor: DARK,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  productThumb: { width: '100%', height: 90, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  productThumbIcon: { fontSize: 40 },

  productTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  categoryTag: { backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  categoryTagText: { fontSize: 10, color: '#2563eb', fontWeight: '700' },
  brandTag: { backgroundColor: '#fef9c3', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  brandTagText: { fontSize: 10, color: '#92400e', fontWeight: '700' },

  productName: { fontSize: 13, fontWeight: '800', color: DARK, lineHeight: 18, marginBottom: 3 },
  productSeller: { fontSize: 11, color: MUTED, marginBottom: 4 },
  productDesc: { fontSize: 11, color: MUTED, lineHeight: 16, marginBottom: 8 },

  productFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 14, fontWeight: '900', color: ACCENT },
  inStock: { fontSize: 10, color: '#16a34a', fontWeight: '600', marginTop: 1 },
  outOfStock: { fontSize: 10, color: '#dc2626', fontWeight: '600', marginTop: 1 },

  addBtn: { backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  addedBtn: { backgroundColor: '#16a34a' },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: DARK, textAlign: 'center' },
  emptySubtitle: { marginTop: 8, fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20 },
});
