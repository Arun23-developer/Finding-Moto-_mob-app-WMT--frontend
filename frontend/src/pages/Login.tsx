import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { canUseGoogleAuth, getGoogleAuthIssue } from '../lib/googleAuth';
import { getDefaultRouteForRole } from '../lib/roleRoutes';

interface FormData {
  email: string;
  password: string;
}

const ROLE_LABELS: Record<string, { icon: string; label: string }> = {
  buyer: { icon: '🛒', label: 'Buyer' },
  seller: { icon: '🏪', label: 'Seller' },
  mechanic: { icon: '🔧', label: 'Mechanic' },
  admin: { icon: '⚙️', label: 'Admin' },
  delivery_agent: { icon: '🚚', label: 'Delivery Agent' }
};

const BIKE_SLIDES = [
  // ── Bike Parts Shop ──
  {
    img: '/images/login/WhatsApp%20Image%202026-02-23%20at%208.35.52%20PM.jpeg',
    brand: 'Genuine OEM Parts',
    model: 'Parts & Inventory',
    tag: 'Everything You Need In One Place',
    price: '50,000+ Parts In Stock',
    category: '⚙️ Bike Parts',
  },
  // ── Mechanic Diagnostic ──
  {
    img: '/images/login/WhatsApp%20Image%202026-02-23%20at%208.36.00%20PM.jpeg',
    brand: 'Advanced Diagnostics',
    model: 'Electronic Inspection',
    tag: 'Precision Diagnosis, Every Time',
    price: 'Starting LKR 2,500',
    category: '🔧 Mechanic Services',
  },
  // ── Mechanic Team ──
  {
    img: '/images/login/WhatsApp%20Image%202026-02-23%20at%208.36.15%20PM.jpeg',
    brand: 'Certified Workshop',
    model: 'Professional Team',
    tag: 'Your Bike in Expert Hands',
    price: '1,000+ Mechanics Island-Wide',
    category: '🔧 Mechanic Services',
  },
  // ── Roadside Repair ──
  {
    img: '/images/login/WhatsApp%20Image%202026-02-23%20at%208.38.49%20PM.jpeg',
    brand: '24/7 Roadside Rescue',
    model: 'Emergency Repair',
    tag: 'We Come To You, Anytime',
    price: 'Island-Wide Coverage',
    category: '🛠️ Roadside Rescue',
  },
  // ── Towing Service ──
  {
    img: '/images/login/WhatsApp%20Image%202026-02-23%20at%208.40.01%20PM.jpeg',
    brand: 'Recovery Service',
    model: 'Bike Towing & Recovery',
    tag: 'Safe Recovery, Every Time',
    price: 'Available 24 Hours',
    category: '🚛 Towing Service',
  },
  // ── Delivery ──
  {
    img: '/images/login/WhatsApp%20Image%202026-02-23%20at%2010.58.56%20PM.jpeg',
    brand: 'Fast Delivery',
    model: 'Island-Wide Sri Lanka',
    tag: 'Parts To Your Doorstep',
    price: 'Same-Day Delivery Available',
    category: '🚚 Delivery',
  },
];

const SPARE_PARTS = [
  { icon: '⚙️', part: 'Engine Parts' },
  { icon: '🛞', part: 'Tyres & Wheels' },
  { icon: '💡', part: 'Electricals' },
  { icon: '🔋', part: 'Batteries' },
  { icon: '🛢️', part: 'Engine Oil' },
  { icon: '🪛', part: 'Body Parts' },
];

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [approvalInfo, setApprovalInfo] = useState<{ status: string; role: string; message: string } | null>(null);
  const [verificationInfo, setVerificationInfo] = useState<{ email: string; role: string; message: string } | null>(null);
  const [roleSelection, setRoleSelection] = useState<{ email: string; roles: { role: string; approvalStatus: string; isActive: boolean }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const { login, loginWithRole, googleAuth } = useAuth();
  const navigate = useNavigate();
  const googleAuthIssue = getGoogleAuthIssue();
  const showGoogleLogin = canUseGoogleAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % BIKE_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setApprovalInfo(null);
    setVerificationInfo(null);
    setRoleSelection(null);
    setLoading(true);
    try {
      const result = await login(formData);
      if (result.requiresRoleSelection) {
        // Multiple roles matched the same password — let user choose
        setRoleSelection({ email: result.email, roles: result.roles });
        return;
      }
      navigate(getDefaultRouteForRole(result.user?.role));
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.requiresVerification) {
        setVerificationInfo({ email: data.email, role: data.role, message: data.message });
      } else if (data?.approvalStatus) {
        setApprovalInfo({ status: data.approvalStatus, role: data.role, message: data.message });
      } else {
        setError(data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithRole(formData.email, formData.password, role);
      setRoleSelection(null);
      navigate(getDefaultRouteForRole(result.user?.role));
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.requiresVerification) {
        setVerificationInfo({ email: data.email, role: data.role, message: data.message });
        setRoleSelection(null);
      } else if (data?.approvalStatus) {
        setApprovalInfo({ status: data.approvalStatus, role: data.role, message: data.message });
        setRoleSelection(null);
      } else {
        setError(data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
    setError('');
    setApprovalInfo(null);
    setLoading(true);
    try {
      const result = await googleAuth(credentialResponse.credential);
      navigate(getDefaultRouteForRole(result.user?.role));
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.approvalStatus) {
        setApprovalInfo({ status: data.approvalStatus, role: data.role, message: data.message });
      } else {
        setError(data?.message || 'Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [googleAuth, navigate]);

  const handleGoogleError = useCallback(() => {
    setError('Google sign-in was unsuccessful. Please try again.');
  }, []);

  const googleLoginButton = useMemo(() => (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleError}
      size="large"
      width="320"
      theme="outline"
      text="signin_with"
      shape="rectangular"
    />
  ), [handleGoogleError, handleGoogleSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-split-page">
      {/* ── LEFT PANEL ── */}
      <div className="login-visual-panel">
        {/* Slide images */}
        {BIKE_SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`login-slide ${i === activeSlide ? 'login-slide-active' : ''}`}
            style={{ backgroundImage: `url(${slide.img})` }}
          />
        ))}

        {/* Gradient overlay */}
        <div className="login-slide-overlay" />

        <div className="login-visual-content">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>FM</span>
              </div>
            </div>
            <span className="login-brand-name">Finding Moto</span>
          </div>

          {/* Spacer pushes content to bottom */}
          <div style={{ flex: 1 }} />

          {/* Current slide info */}
          <div className="login-bike-info">
            <div className="login-slide-category">{BIKE_SLIDES[activeSlide].category}</div>
            <div className="login-bike-tag">{BIKE_SLIDES[activeSlide].tag}</div>
            <div className="login-bike-brand">{BIKE_SLIDES[activeSlide].brand}</div>
            <div className="login-bike-model">{BIKE_SLIDES[activeSlide].model}</div>
            <div className="login-bike-price">{BIKE_SLIDES[activeSlide].price}</div>
          </div>

          {/* Slide dots */}
          <div className="login-slide-dots">
            {BIKE_SLIDES.map((_, i) => (
              <button
                key={i}
                className={`login-dot ${i === activeSlide ? 'login-dot-active' : ''}`}
                onClick={() => setActiveSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Spare Parts */}
          <div className="login-section-label" style={{ marginTop: '16px' }}>Popular Spare Parts</div>
          <div className="login-parts-grid">
            {SPARE_PARTS.map(p => (
              <div key={p.part} className="login-part-chip">
                <span>{p.icon}</span>
                <span>{p.part}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="login-form-panel">
        <div className="login-form-card">
          {/* Mobile brand header */}
          <div className="login-mobile-brand">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'hsl(var(--primary))' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'hsl(var(--primary-foreground))' }}>FM</span>
            </div>
            <span>Finding Moto</span>
          </div>

          <div className="login-form-header">
            <h1>Welcome Back! 🏍️</h1>
            <p>Sign in to access bikes &amp; spare parts</p>
          </div>

          {error && (
            <div className="login-alert login-alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Role selection (multi-role same password) */}
          {roleSelection && (
            <div className="login-alert login-alert-info">
              <div className="login-alert-title">
                <span>👤</span> Multiple Roles Found
              </div>
              <p>Your account has multiple roles. Please select which role to sign in as:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {roleSelection.roles
                  .filter(r => r.isActive)
                  .map(r => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleRoleSelect(r.role)}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '10px',
                        background: 'hsl(var(--card))',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        color: 'hsl(var(--foreground))'
                      }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'hsl(var(--primary))'; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
                    >
                      <span style={{ fontSize: '20px' }}>{ROLE_LABELS[r.role]?.icon || '👤'}</span>
                      <span>{ROLE_LABELS[r.role]?.label || r.role}</span>
                      {r.approvalStatus === 'pending' && (
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#D97706' }}>⏳ Pending</span>
                      )}
                      {r.approvalStatus === 'approved' && (
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#059669' }}>✓ Active</span>
                      )}
                    </button>
                  ))}
              </div>
              <button
                type="button"
                onClick={() => setRoleSelection(null)}
                style={{
                  marginTop: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--muted-foreground))',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'underline'
                }}
              >
                ← Back to login
              </button>
            </div>
          )}

          {/* Email verification needed */}
          {verificationInfo && (
            <div className="login-alert login-alert-info">
              <div className="login-alert-title">
                <span>📧</span> Email Verification Required
              </div>
              <p>{verificationInfo.message}</p>
              <Link
                to="/register"
                state={{ verifyEmail: verificationInfo.email, verifyRole: verificationInfo.role }}
                className="login-alert-action"
              >
                Enter Verification Code →
              </Link>
            </div>
          )}

          {/* Approval status */}
          {approvalInfo && (
            <div className={`login-alert ${approvalInfo.status === 'pending' ? 'login-alert-warn' : 'login-alert-error'}`}>
              <div className="login-alert-title">
                <span>{approvalInfo.status === 'pending' ? '⏳' : '❌'}</span>
                {approvalInfo.status === 'pending' ? 'Account Pending Approval' : 'Account Not Approved'}
              </div>
              <p>{approvalInfo.message}</p>
              {approvalInfo.role && ROLE_LABELS[approvalInfo.role] && (
                <p className="login-alert-role">
                  Role: {ROLE_LABELS[approvalInfo.role].icon} {ROLE_LABELS[approvalInfo.role].label}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">
                <span className="login-field-icon">📧</span> Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">
                <span className="login-field-icon">🔒</span> Password
              </label>
              <div className="login-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="login-forgot">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner" /> Signing in...</>
              ) : (
                <>Sign In &nbsp;🚀</>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>or continue with</span>
          </div>

          <div className="google-btn-wrapper">
            {showGoogleLogin ? googleLoginButton : (
              <div className="login-alert login-alert-info">
                {googleAuthIssue}
              </div>
            )}
          </div>

          <p className="login-footer">
            New to Finding Moto? <Link to="/register">Create an account</Link>
          </p>

          {/* Quick role hints */}
          <div className="login-role-hints">
            {Object.entries(ROLE_LABELS).map(([, v]) => (
              <span key={v.label} className="login-role-hint">
                {v.icon} {v.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
