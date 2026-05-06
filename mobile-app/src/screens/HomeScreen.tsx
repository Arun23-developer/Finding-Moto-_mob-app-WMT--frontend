import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

type Props = NativeStackScreenProps<any, 'HomeIndex'>;

// ── Tokens ────────────────────────────────────────────────
const BG     = '#0F172A';
const CARD   = '#1E293B';
const BORDER = '#334155';
const ACCENT = '#2563EB';
const TEXT   = '#FFFFFF';
const TEXT2  = '#94A3B8';
const SUCCESS = '#10B981';

const CATEGORY_ICONS: Record<string, string> = {
  All: 'motorbike',
  Engine: 'cog-outline',
  Brakes: 'car-brake-alert',
  Suspension: 'tools',
  Electrical: 'lightning-bolt-outline',
  Tyres: 'circle-outline',
  Body: 'home-group',
  Accessories: 'bag-personal-outline',
  Services: 'wrench-outline',
};

// ── Types ─────────────────────────────────────────────────
interface Product {
  _id: string; name: string; price?: number;
  category?: string; brand?: string; stock?: number;
  seller?: { firstName?: string; lastName?: string; shopName?: string };
  image?: string | null;
  images?: string[];
}
interface Conversation {
  _id: string;
  participants: Array<{ _id: string; firstName: string; lastName: string; role: string }>;
  lastMessage?: { content: string; createdAt: string };
  unreadCount?: number;
}

// ── Helpers ───────────────────────────────────────────────
const CATEGORIES = [
  { label: 'All' },
  { label: 'Engine' },
  { label: 'Brakes' },
  { label: 'Suspension' },
  { label: 'Electrical' },
  { label: 'Tyres' },
  { label: 'Body' },
  { label: 'Accessories' },
  { label: 'Services' },
];

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const ROLE_COLOR: Record<string, string> = {
  seller: '#7C3AED', mechanic: '#0891B2', default: '#374151',
};

// ── Component ─────────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { openAI } = useApp();

  const [searchTab, setSearchTab] = useState<'Products' | 'Services'>('Products');
  const [query, setQuery]         = useState('');
  const [category, setCategory]   = useState('All');
  const [products, setProducts]   = useState<Product[]>([]);
  const [convos, setConvos]       = useState<Conversation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addedId, setAddedId]     = useState<string | null>(null);
  const [addingId, setAddingId]   = useState<string | null>(null);
  const [imageTip, setImageTip]   = useState('');

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'Rider';

  const fetchData = useCallback(async (q = '', cat = 'All', tab = searchTab) => {
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.search = q.trim();
      if (cat !== 'All' && cat !== 'Services') params.category = cat;

      const endpoint = tab === 'Services' ? '/public/services' : '/public/products';
      const [prodRes, convoRes] = await Promise.allSettled([
        api.get(endpoint, { params }),
        api.get('/chat/conversations'),
      ]);

      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value.data;
        setProducts(Array.isArray(d?.data) ? d.data.slice(0, 20) : Array.isArray(d) ? d.slice(0, 20) : []);
      }
      if (convoRes.status === 'fulfilled') {
        const d = convoRes.value.data;
        setConvos(Array.isArray(d?.data) ? d.data.slice(0, 4) : Array.isArray(d) ? d.slice(0, 4) : []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTab]);

  useEffect(() => { void fetchData(); }, []);

  const doSearch = () => fetchData(query, category, searchTab);

  const onTabChange = (tab: 'Products' | 'Services') => {
    setSearchTab(tab);
    setCategory('All');
    fetchData(query, 'All', tab);
  };

  const onCategory = (cat: string) => {
    setCategory(cat);
    fetchData(query, cat, searchTab);
  };

  const addToCart = async (id: string) => {
    try {
      setAddingId(id);
      await api.post('/cart/add', { productId: id, quantity: 1 });
      setAddedId(id);
      setTimeout(() => setAddedId(null), 2000);
    } catch {} finally { setAddingId(null); }
  };

  const imageSearch = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled) {
      setImageTip('Image search coming soon!');
      setTimeout(() => setImageTip(''), 2500);
    }
  };

  const getOther = (c: Conversation) =>
    c.participants.find(p => p._id !== user?._id);

  const getProductImage = (product: Product) => product.image || product.images?.[0] || null;

  const greetingLine = () => {
    const h = new Date().getHours();
    if (h < 12) return `Good morning, ${firstName}`;
    if (h < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <FlatList
        data={products}
        keyExtractor={i => i._id}
        numColumns={2}
        columnWrapperStyle={s.gridRow}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(query, category); }}
            tintColor={ACCENT}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Top bar ── */}
            <View style={s.topBar}>
              <View>
                <Text style={s.greeting}>{greetingLine()}</Text>
                <Text style={s.tagline}>Find the best parts & services</Text>
              </View>
              <Pressable style={s.notifBtn} onPress={openAI}>
                <MaterialCommunityIcons name="bell-outline" size={18} color={TEXT} />
              </Pressable>
            </View>

            {/* ── Search section ── */}
            <View style={s.searchCard}>
              {/* Tab switcher */}
              <View style={s.searchTabs}>
                {(['Products', 'Services'] as const).map(t => (
                  <Pressable
                    key={t}
                    style={[s.searchTab, searchTab === t && s.searchTabActive]}
                    onPress={() => onTabChange(t)}
                  >
                    <Text style={[s.searchTabText, searchTab === t && s.searchTabTextActive]}>
                      {t === 'Products' ? 'Products' : 'Services'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Search bar */}
              <View style={s.searchRow}>
                <View style={s.searchInput}>
                  <MaterialCommunityIcons name="magnify" size={18} color={TEXT2} />
                  <TextInput
                    style={s.searchField}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={`Search ${searchTab.toLowerCase()}…`}
                    placeholderTextColor={TEXT2}
                    onSubmitEditing={doSearch}
                    returnKeyType="search"
                  />
                  {query.length > 0 && (
                    <Pressable onPress={() => { setQuery(''); fetchData('', category); }}>
                      <MaterialCommunityIcons name="close" size={16} color={TEXT2} />
                    </Pressable>
                  )}
                </View>
                <Pressable style={s.imgBtn} onPress={imageSearch}>
                  <MaterialCommunityIcons name="camera-outline" size={22} color={TEXT} />
                </Pressable>
              </View>

              {imageTip ? <Text style={s.imageTip}>{imageTip}</Text> : null}
            </View>

            {/* ── Recent messages ── */}
            {convos.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Recent Messages</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.convoRow}>
                  {convos.map(c => {
                    const other = getOther(c);
                    const rc = ROLE_COLOR[other?.role ?? ''] ?? ROLE_COLOR.default;
                    const unread = (c.unreadCount ?? 0) > 0;
                    return (
                      <View key={c._id} style={s.convoCard}>
                        <View style={[s.convoAvatar, { backgroundColor: rc }]}>
                          <Text style={s.convoAvatarText}>{(other?.firstName?.[0] ?? '?').toUpperCase()}</Text>
                          {unread && <View style={s.unreadDot} />}
                        </View>
                        <Text style={s.convoName} numberOfLines={1}>
                          {other?.firstName} {other?.lastName?.[0]}.
                        </Text>
                        <Text style={s.convoRole}>{other?.role}</Text>
                        {c.lastMessage && (
                          <Text style={s.convoMsg} numberOfLines={1}>{c.lastMessage.content}</Text>
                        )}
                        {c.lastMessage?.createdAt && (
                          <Text style={s.convoTime}>{timeAgo(c.lastMessage.createdAt)}</Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ── Category chips ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
                {CATEGORIES.filter(c => searchTab === 'Products' ? c.label !== 'Services' : c.label === 'All' || c.label === 'Services').map(cat => (
                  <Pressable
                    key={cat.label}
                    style={[s.catChip, category === cat.label && s.catChipActive]}
                    onPress={() => onCategory(cat.label)}
                  >
                    <MaterialCommunityIcons name={CATEGORY_ICONS[cat.label] as any} size={14} color={TEXT2} />
                    <Text style={[s.catLabel, category === cat.label && s.catLabelActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ── Products header ── */}
            <View style={s.productsHeader}>
              <Text style={s.sectionTitle}>
                {searchTab === 'Services' ? 'Services' : 'Products'}
              </Text>
              {loading && <ActivityIndicator color={ACCENT} size="small" />}
            </View>

            {!loading && products.length === 0 && (
              <View style={s.empty}>
                <MaterialCommunityIcons name="magnify" size={48} color={TEXT2} style={s.emptyIcon} />
                <Text style={s.emptyTitle}>Nothing found</Text>
                <Text style={s.emptyText}>Try a different search or category.</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const added   = addedId === item._id;
          const adding  = addingId === item._id;
          const seller  = item.seller?.shopName || `${item.seller?.firstName ?? ''} ${item.seller?.lastName ?? ''}`.trim() || 'Seller';
          const inStock = item.stock == null || item.stock > 0;
          return (
            <Pressable
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
              style={({ pressed }) => [s.productCard, pressed && { opacity: 0.7 }]}
            >
              <View style={s.productThumb}>
                {getProductImage(item) ? (
                  <Image source={{ uri: getProductImage(item) ?? undefined }} style={s.productThumbImage} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="motorbike" size={36} color={TEXT2} />
                )}
              </View>
              <View style={s.productTags}>
                {item.category && <View style={s.catTag}><Text style={s.catTagText}>{item.category}</Text></View>}
                {item.brand && <View style={s.brandTag}><Text style={s.brandTagText}>{item.brand}</Text></View>}
              </View>
              <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.productSeller} numberOfLines={1}>by {seller}</Text>
              <View style={s.productFooter}>
                <View>
                  <Text style={s.price}>LKR {(item.price ?? 0).toLocaleString()}</Text>
                  <Text style={inStock ? s.inStock : s.outStock}>
                    {inStock ? '● In stock' : '● Out of stock'}
                  </Text>
                </View>
                {searchTab === 'Products' && (
                  <Pressable
                    style={[s.addBtn, added && s.addedBtn, (!inStock || adding) && { opacity: 0.4 }]}
                    onPress={() => addToCart(item._id)}
                    disabled={!inStock || adding}
                  >
                    {adding
                      ? <ActivityIndicator color={TEXT} size="small" />
                      : <MaterialCommunityIcons name={added ? 'check' : 'cart-plus'} size={16} color={TEXT} />
                    }
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  greeting: { color: TEXT, fontSize: 20, fontWeight: '900' },
  tagline: { color: TEXT2, fontSize: 13, marginTop: 3 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },

  searchCard: { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 20, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  searchTabs: { flexDirection: 'row', backgroundColor: BG, borderRadius: 12, padding: 3, marginBottom: 12 },
  searchTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  searchTabActive: { backgroundColor: ACCENT },
  searchTabText: { color: TEXT2, fontWeight: '700', fontSize: 13 },
  searchTabTextActive: { color: TEXT },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: BORDER },
  searchField: { flex: 1, color: TEXT, fontSize: 14 },
  imgBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  imageTip: { color: '#93C5FD', fontSize: 12, fontWeight: '600', marginTop: 8 },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: '900', marginBottom: 12 },

  convoRow: { gap: 12, paddingRight: 4 },
  convoCard: { backgroundColor: CARD, borderRadius: 16, padding: 12, width: 110, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  convoAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' },
  convoAvatarText: { color: TEXT, fontSize: 18, fontWeight: '900' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: CARD },
  convoName: { color: TEXT, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  convoRole: { color: TEXT2, fontSize: 10, textTransform: 'capitalize', marginTop: 1 },
  convoMsg: { color: TEXT2, fontSize: 10, marginTop: 4, textAlign: 'center' },
  convoTime: { color: '#475569', fontSize: 9, marginTop: 2 },

  catRow: { gap: 8, paddingRight: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  catChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  catLabel: { color: TEXT2, fontSize: 13, fontWeight: '700' },
  catLabelActive: { color: TEXT },

  productsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },

  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  gridRow: { justifyContent: 'space-between', marginBottom: 0 },

  productCard: { width: '48.5%', backgroundColor: CARD, borderRadius: 18, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: BORDER },
  productThumb: { width: '100%', height: 80, borderRadius: 12, backgroundColor: '#0F2744', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' },
  productThumbImage: { width: '100%', height: '100%' },
  productTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  catTag: { backgroundColor: '#1E3A5F', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  catTagText: { color: '#93C5FD', fontSize: 9, fontWeight: '700' },
  brandTag: { backgroundColor: '#2D1F00', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  brandTagText: { color: '#FCD34D', fontSize: 9, fontWeight: '700' },
  productName: { color: TEXT, fontSize: 12, fontWeight: '800', lineHeight: 17, marginBottom: 3 },
  productSeller: { color: TEXT2, fontSize: 10, marginBottom: 8 },
  productFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  price: { color: ACCENT, fontSize: 13, fontWeight: '900' },
  inStock: { color: SUCCESS, fontSize: 9, fontWeight: '600', marginTop: 2 },
  outStock: { color: '#EF4444', fontSize: 9, fontWeight: '600', marginTop: 2 },
  addBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  addedBtn: { backgroundColor: SUCCESS },
  addBtnText: { color: TEXT, fontSize: 16, fontWeight: '900' },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: '800' },
  emptyText: { color: TEXT2, fontSize: 13, marginTop: 6 },
});