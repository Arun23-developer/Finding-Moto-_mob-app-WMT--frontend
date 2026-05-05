import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { resolveMediaUrl, resolveProductImage } from '@/lib/imageUrl';
import { formatLkr } from '@/lib/currency';
import { getMyChats } from '../services/chatService';
import { BuyerLayout } from '@/components/BuyerLayout';
import { Badge } from '@/components/ui/badge';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string | null;
  images: string[];
  brand: string;
  category: string;
  inStock: boolean;
  stock: number;
  description: string;
  seller?: { firstName: string; lastName: string; shopName?: string };
}

interface ServiceDetail {
  name: string;
  category: string;
  price: number;
}

interface Garage {
  _id: string;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  specialization: string;
  experienceYears: number;
  avatar: string | null;
  services: string[];
  serviceDetails: ServiceDetail[];
  verified: boolean;
}

const ROLE_CONFIG = {
  buyer: {
    icon: '🛒',
    label: 'Buyer',
    color: '#4F46E5',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    quickActions: [
      { label: 'Browse Products', icon: '🏍️', description: 'Find motorcycles & parts', link: '/products' },
      { label: 'My Orders', icon: '📦', description: 'Track your purchases', link: '/my-orders' },
      { label: 'Find Mechanic', icon: '🔧', description: 'Book repair services', link: '/services' },
      { label: 'Chat', icon: '💬', description: 'Chat with sellers & mechanics', link: '/chat' },
      { label: 'Change Password', icon: '🔒', description: 'Update your password', link: '/change-password' }
    ]
  },
  seller: {
    icon: '🏪',
    label: 'Seller',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    quickActions: [
      { label: 'My Listings', icon: '📋', description: 'Manage your products', link: '/seller/products' },
      { label: 'Add Product', icon: '➕', description: 'List a new item', link: '/seller/products' },
      { label: 'Orders', icon: '📦', description: 'Manage incoming orders', link: '/seller/orders' }
    ]
  },
  mechanic: {
    icon: '🔧',
    label: 'Mechanic',
    color: '#D97706',
    gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    quickActions: [
      { label: 'Service Requests', icon: '📝', description: 'View pending requests', link: '/mechanic/dashboard' },
      { label: 'My Services', icon: '⚙️', description: 'Manage your services', link: '/mechanic/dashboard' },
      { label: 'Schedule', icon: '📅', description: 'View your appointments', link: '/mechanic/dashboard' }
    ]
  },
  admin: {
    icon: '⚙️',
    label: 'Admin',
    color: '#DC2626',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
    quickActions: [
      { label: 'Admin Panel', icon: '⚙️', description: 'Open admin dashboard', link: '/admin' },
      { label: 'Pending Approvals', icon: '✅', description: 'Review new accounts', link: '/admin' },
      { label: 'Manage Users', icon: '👥', description: 'User administration', link: '/admin' }
    ]
  }
};

const Dashboard: React.FC = () => {
  const { user, logout, isSeller, isMechanic, isAdmin, isDeliveryAgent } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');

  // Services tab state
  const [garages, setGarages] = useState<Garage[]>([]);
  const [mechanicQuery, setMechanicQuery] = useState('');
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Services');
  const [specializations, setSpecializations] = useState<string[]>(['All Services']);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  // Redirect non-buyer roles
  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true });
    if (isSeller) navigate('/seller/dashboard', { replace: true });
    if (isMechanic) navigate('/mechanic/dashboard', { replace: true });
    if (isDeliveryAgent) navigate('/delivery/dashboard', { replace: true });
  }, [isAdmin, isSeller, isMechanic, isDeliveryAgent, navigate]);

  const fetchProducts = useCallback(async (query = '') => {
    try {
      setLoadingProducts(true);
      const params: Record<string, string> = { page: '1', limit: '8', sort: 'newest' };
      if (query) params.search = query;
      const { data: res } = await api.get('/public/products', { params });
      if (res.success) setProducts(res.data);
    } catch {
      console.error('Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounced product search
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery, fetchProducts]);

  // Fetch mechanics for Services tab
  const fetchMechanics = useCallback(async (query = '', spec = 'All Services') => {
    try {
      setLoadingMechanics(true);
      const params: Record<string, string> = {};
      if (query) params.search = query;
      if (spec !== 'All Services') params.specialization = spec;
      const { data: res } = await api.get('/public/mechanics', { params });
      if (res.success) {
        setGarages(res.data);
        if (res.filters?.specializations) setSpecializations(res.filters.specializations);
      }
    } catch {
      console.error('Failed to fetch mechanics');
    } finally {
      setLoadingMechanics(false);
    }
  }, []);

  // Load mechanics when Services tab is first opened
  useEffect(() => {
    if (activeTab === 'services' && garages.length === 0 && !loadingMechanics) {
      fetchMechanics();
    }
  }, [activeTab, garages.length, loadingMechanics, fetchMechanics]);

  const fetchUnreadChatsCount = useCallback(async () => {
    try {
      const conversations = await getMyChats();
      const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
      setUnreadChatsCount(unreadTotal);
    } catch {
      setUnreadChatsCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUnreadChatsCount();
    const intervalId = setInterval(fetchUnreadChatsCount, 30000);
    return () => clearInterval(intervalId);
  }, [fetchUnreadChatsCount]);

  // Debounced mechanic search
  useEffect(() => {
    if (activeTab !== 'services') return;
    const t = setTimeout(() => fetchMechanics(mechanicQuery, selectedSpecialization), 400);
    return () => clearTimeout(t);
  }, [mechanicQuery, selectedSpecialization, activeTab, fetchMechanics]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getInitials = (): string => {
    if (!user) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getGreeting = (): string => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getImageUrl = (product: Product): string => {
    return resolveProductImage(product, 'https://placehold.co/400x300?text=No+Image');
  };

  const roleConfig = user ? ROLE_CONFIG[user.role] || ROLE_CONFIG.buyer : ROLE_CONFIG.buyer;
  const latestOrder = { _id: '', status: '', createdAt: '' };
  const latestOrderSequence = 0;
  const buyerTrackingSteps: Array<{ key: string; label: string }> = [];
  const buyerStatusSequence: Record<string, number> = {};

  return (
    <BuyerLayout>
      <div style={{ width: '100%', margin: '0 auto', padding: '12px 20px', overflow: 'auto' }}>
      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 64, background: '#fff',
        borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>FM</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>Finding<span style={{ color: '#4F46E5' }}>Moto</span></span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Profile avatar with green dot + dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileMenuOpen(p => !p)}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, color: '#4F46E5', position: 'relative'
              }}
            >
              {getInitials()}
              {/* Green active dot */}
              <span style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 10, height: 10, borderRadius: '50%',
                background: '#22C55E', border: '2px solid #fff'
              }} />
            </button>

            {profileMenuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setProfileMenuOpen(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 48, zIndex: 50,
                  width: 220, borderRadius: 12, background: '#fff',
                  border: '1px solid #E5E7EB', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  padding: '8px 0'
                }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0 }}>
                      {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{user?.email}</p>
                  </div>
                  <button onClick={() => { setProfileMenuOpen(false); navigate('/change-password'); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', border: 'none', background: 'transparent',
                      cursor: 'pointer', fontSize: 14, color: '#374151', textAlign: 'left'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    🔒 Change Password
                  </button>
                  <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 4, paddingTop: 4 }}>
                    <button onClick={handleLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontSize: 14, color: '#DC2626', textAlign: 'left'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main Content with Left Sidebar ── */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* ── Left Icon Sidebar ── */}
        <aside style={{
          display: 'none'
        }}>
          {/* Sidebar hidden for full screen */}
        </aside>

        {/* ── Right Content Area (Full Width) ── */}
        <div style={{ flex: 1, width: '100%', margin: '0 auto', padding: '12px 20px', overflow: 'auto' }}>

        {/* ── Top Row: My Orders + Account (compact) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 8 }}>
          {/* My Orders Card */}
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
            padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'none', alignItems: 'center', gap: 14, flex: '1 1 280px', minWidth: 240
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span style={{ fontSize: 18 }}>📦</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>My Orders</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>Track your purchases</p>
            </div>
            <button onClick={() => navigate('/my-orders')} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s'
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4338CA')}
              onMouseLeave={e => (e.currentTarget.style.background = '#4F46E5')}
            >
              View Orders →
            </button>
          </div>

          {/* Account Card */}
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
            padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: 20, flex: '1 1 340px', minWidth: 280
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Status</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: user?.approvalStatus === 'approved' ? '#DCFCE7' : '#FEF3C7',
                color: user?.approvalStatus === 'approved' ? '#166534' : '#92400E'
              }}>
                {user?.approvalStatus === 'approved' ? '● Active' : '○ Pending'}
              </span>
            </div>
            <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Role</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5' }}>{roleConfig.icon} {roleConfig.label}</span>
            </div>
            <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Since</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {false && (
          <div style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #E5E7EB',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Latest Order Tracking</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
                  Order #{latestOrder._id.slice(-6).toUpperCase()} · {new Date(latestOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => navigate('/my-orders')} style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#4F46E5',
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}>
                View Full Tracking
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 }}>
              {buyerTrackingSteps
                .filter((step) => latestOrder.status !== 'cancelled' || ['awaiting_seller_confirmation', 'cancelled'].includes(step.key))
                .filter((step) => latestOrder.status !== 'delivery_failed' || step.key !== 'delivered')
                .map((step) => {
                  const isActive = latestOrder.status === step.key;
                  const isCompleted =
                    latestOrder.status !== 'cancelled' &&
                    latestOrder.status !== 'delivery_failed' &&
                    latestOrderSequence > (buyerStatusSequence[step.key] || 0);

                  const background = isActive
                    ? '#EEF2FF'
                    : isCompleted
                      ? '#ECFDF5'
                      : '#F9FAFB';
                  const border = isActive
                    ? '#4F46E5'
                    : isCompleted
                      ? '#10B981'
                      : '#E5E7EB';
                  const text = isActive
                    ? '#4338CA'
                    : isCompleted
                      ? '#047857'
                      : '#6B7280';

                  return (
                    <div key={step.key} style={{
                      border: `1px solid ${border}`,
                      background,
                      borderRadius: 12,
                      padding: '12px 14px'
                    }}>
                      <p style={{ margin: 0, fontSize: 11, color: text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {isActive ? 'Current' : isCompleted ? 'Completed' : 'Upcoming'}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 600, color: '#111827' }}>{step.label}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Center Content ── */}
        <main style={{ width: '100%' }}>
          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 12, color: '#fff'
          }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{getGreeting()}, {user?.firstName}!</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.85 }}>
              Welcome to your dashboard — browse products and find service professionals.
            </p>
          </div>

          {/* ── Category Tabs ── */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 8, background: '#fff',
            borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <button
              onClick={() => setActiveTab('products')}
              style={{
                flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: activeTab === 'products' ? '#4F46E5' : 'transparent',
                color: activeTab === 'products' ? '#fff' : '#6B7280',
                borderBottom: activeTab === 'products' ? 'none' : '2px solid transparent'
              }}
            >
              <span style={{ fontSize: 18 }}>🏍️</span> Products
            </button>
            <div style={{ width: 1, background: '#E5E7EB' }} />
            <button
              onClick={() => setActiveTab('services')}
              style={{
                flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: activeTab === 'services' ? '#D97706' : 'transparent',
                color: activeTab === 'services' ? '#fff' : '#6B7280',
                borderBottom: activeTab === 'services' ? 'none' : '2px solid transparent'
              }}
            >
              <span style={{ fontSize: 18 }}>🔧</span> Services
            </button>
          </div>

          {/* ═══ PRODUCTS TAB ═══ */}
          {activeTab === 'products' && (
            <>
              {/* Product Search Bar */}
              <div style={{
                background: '#fff', borderRadius: 14, padding: '12px 16px',
                marginBottom: 12, border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search motorcycles, parts, accessories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: 15,
                    color: '#111827', background: 'transparent'
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{
                    border: 'none', background: '#F3F4F6', borderRadius: '50%',
                    width: 28, height: 28, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#6B7280'
                  }}>✕</button>
                )}
                <button onClick={() => navigate('/products')} style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  background: '#4F46E5', color: '#fff', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap'
                }}>
                  View All
                </button>
              </div>

              {/* Products Grid */}
              {loadingProducts ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
                  <div style={{ fontSize: 32, marginBottom: 8, animation: 'spin 1s linear infinite' }}>⏳</div>
                  <p>Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🏍️</div>
                  <p style={{ fontWeight: 600 }}>No products found</p>
                  <p style={{ fontSize: 14 }}>Try a different search term</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 16
                }}>
                  {products.map(product => (
                    <div
                      key={product._id}
                      onClick={() => navigate(`/products/${product._id}`)}
                      style={{
                        background: '#fff', borderRadius: 14, overflow: 'hidden',
                        border: '1px solid #E5E7EB', cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
                    >
                      <div style={{ position: 'relative', paddingTop: '65%', background: '#F9FAFB' }}>
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {!product.inStock && (
                          <div style={{
                            position: 'absolute', top: 8, left: 8, background: '#EF4444', color: '#fff',
                            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6
                          }}>Out of Stock</div>
                        )}
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{product.brand}</p>
                        <h4 style={{
                          margin: '4px 0 8px', fontSize: 14, fontWeight: 600, color: '#111827',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{product.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#4F46E5' }}>
                            {formatLkr(product.price)}
                          </span>
                          {product.rating > 0 && (
                            <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>
                              ⭐ {product.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ SERVICES TAB ═══ */}
          {activeTab === 'services' && (
            <>
              {/* Mechanic Search Bar + Specialization Filter */}
              <div style={{
                background: '#fff', borderRadius: 14, padding: '12px 16px',
                marginBottom: 12, border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search mechanics, workshops, locations..."
                  value={mechanicQuery}
                  onChange={e => setMechanicQuery(e.target.value)}
                  style={{
                    flex: 1, minWidth: 180, border: 'none', outline: 'none', fontSize: 15,
                    color: '#111827', background: 'transparent'
                  }}
                />
                {mechanicQuery && (
                  <button onClick={() => setMechanicQuery('')} style={{
                    border: 'none', background: '#F3F4F6', borderRadius: '50%',
                    width: 28, height: 28, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#6B7280'
                  }}>✕</button>
                )}
                <select
                  value={selectedSpecialization}
                  onChange={e => setSelectedSpecialization(e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                    background: '#F9FAFB', fontSize: 13, color: '#374151', cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {specializations.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={() => navigate('/services')} style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  background: '#D97706', color: '#fff', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap'
                }}>
                  View All
                </button>
              </div>

              {/* Mechanic Cards */}
              {loadingMechanics ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
                  <div style={{ fontSize: 32, marginBottom: 8, animation: 'spin 1s linear infinite' }}>⏳</div>
                  <p>Loading mechanics...</p>
                </div>
              ) : garages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🔧</div>
                  <p style={{ fontWeight: 600 }}>No mechanics found</p>
                  <p style={{ fontSize: 14 }}>Try a different search term or specialization</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {garages.map(garage => (
                    <div
                      key={garage._id}
                      style={{
                        background: '#fff', borderRadius: 14, overflow: 'hidden',
                        border: '1px solid #E5E7EB',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
                    >
                      <div style={{ padding: '20px 24px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                          <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, flexShrink: 0
                          }}>
                            {garage.avatar ? (
                              <img
                                src={resolveMediaUrl(garage.avatar, 'https://placehold.co/80x80?text=Garage')}
                                alt={garage.name}
                                style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }}
                              />
                            ) : '🔧'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>{garage.name}</h3>
                              {garage.verified && (
                                <span style={{
                                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                  background: '#DCFCE7', color: '#166534'
                                }}>✓ Verified</span>
                              )}
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>
                              by {garage.ownerName} · {garage.specialization}
                            </p>
                          </div>
                        </div>

                        {/* Info Row */}
                        <div style={{
                          display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16,
                          padding: '12px 16px', background: '#F9FAFB', borderRadius: 10
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#9CA3AF', fontSize: 15 }}>📍</span>
                            <span style={{ fontSize: 13, color: '#374151' }}>{garage.address}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#9CA3AF', fontSize: 15 }}>📞</span>
                            <span style={{ fontSize: 13, color: '#374151' }}>{garage.phone}</span>
                          </div>
                          {garage.experienceYears > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#9CA3AF', fontSize: 15 }}>⏱️</span>
                              <span style={{ fontSize: 13, color: '#374151' }}>{garage.experienceYears} yrs experience</span>
                            </div>
                          )}
                        </div>

                        {/* Services List */}
                        {garage.serviceDetails.length > 0 ? (
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Services Offered
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {garage.serviceDetails.map((svc, i) => (
                                <span key={i} style={{
                                  padding: '6px 12px', borderRadius: 8,
                                  background: '#FEF3C7', color: '#92400E',
                                  fontSize: 12, fontWeight: 600,
                                  display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                  {svc.name}
                                  <span style={{ color: '#D97706', fontWeight: 700 }}>{formatLkr(svc.price)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : garage.services.length > 0 ? (
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Services
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {garage.services.map((s, i) => (
                                <span key={i} style={{
                                  padding: '4px 10px', borderRadius: 6,
                                  background: '#F3F4F6', color: '#374151',
                                  fontSize: 12, fontWeight: 500
                                }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
        </div>
      </div>

      {/* AI Floating Button — bottom-right corner */}
      <button
        onClick={() => navigate('/ai-chat')}
        title="AI Assistant"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(79,70,229,0.45)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.45)'; }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8V4H8"/>
          <rect x="2" y="2" width="20" height="20" rx="5"/>
          <path d="M8 12h.01"/><path d="M16 12h.01"/>
          <path d="M9 17c1.2.8 2.4 1 3 1s1.8-.2 3-1"/>
        </svg>
      </button>
      </div>
    </BuyerLayout>
  );
};

export default Dashboard;
