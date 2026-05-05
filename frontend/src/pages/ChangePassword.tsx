import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRouteForRole } from '../lib/roleRoutes';

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(getDefaultRouteForRole(user?.role));
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 16px'
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '480px', marginBottom: '24px' }}>
        <button onClick={goBack} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#6B7280',
          fontSize: '14px',
          padding: '8px 0',
          marginBottom: '8px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Card Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #F3F4F6',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h1 style={{ color: '#fff', margin: 0, fontSize: '20px', fontWeight: 700 }}>Change Password</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '13px' }}>
                Update your account security
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px', borderRadius: '10px',
              backgroundColor: '#FEF2F2', color: '#DC2626',
              fontSize: '14px', marginBottom: '20px',
              border: '1px solid #FECACA'
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px', borderRadius: '10px',
              backgroundColor: '#F0FDF4', color: '#16A34A',
              fontSize: '14px', marginBottom: '20px',
              border: '1px solid #BBF7D0'
            }}>
              <span>✅</span> {success}
            </div>
          )}

          {/* Current Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              🔒 Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                disabled={loading}
                style={{
                  width: '100%', padding: '12px 44px 12px 14px', borderRadius: '10px',
                  border: '1px solid #D1D5DB', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'
              }}>{showCurrent ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              🔑 New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                disabled={loading}
                style={{
                  width: '100%', padding: '12px 44px 12px 14px', borderRadius: '10px',
                  border: '1px solid #D1D5DB', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'
              }}>{showNew ? '🙈' : '👁️'}</button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                Must be at least 6 characters
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              🔑 Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              disabled={loading}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? '#DC2626' : '#D1D5DB'}`,
                fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#fff', fontWeight: 700, fontSize: '15px',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s'
          }}>
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
