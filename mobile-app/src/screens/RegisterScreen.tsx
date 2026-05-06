import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const BG = '#0F172A'; const CARD = '#1E293B'; const BORDER = '#334155';
const ACCENT = '#2563EB'; const TEXT = '#FFFFFF'; const TEXT2 = '#94A3B8';
const SUCCESS = '#10B981';

const emailRx = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const nameRx = /^[A-Za-z\s.'-]+$/;
const phoneRx = /^\d{10}$/;
const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/;
const blocked = ['test.com', 'example.com', 'fake.com', 'mailinator.com', 'yopmail.com', 'tempmail.com'];

const validEmail = (v: string) => {
  if (!emailRx.test(v)) return false;
  const d = v.split('@')[1]?.toLowerCase();
  return !!d && !blocked.includes(d);
};

export default function RegisterScreen() {
  const { register, verifyOTP, resendOTP } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'form' | 'otp' | 'done'>('form');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(v => Math.max(0, v - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const validate = () => {
    const fn = firstName.trim(); const ln = lastName.trim(); const em = email.trim();
    if (!fn || fn.length < 2 || !nameRx.test(fn)) throw new Error('First name must be at least 2 letters.');
    if (!ln || ln.length < 2 || !nameRx.test(ln)) throw new Error('Last name must be at least 2 letters.');
    if (!validEmail(em)) throw new Error('Enter a valid email address.');
    if (!phoneRx.test(phone)) throw new Error('Phone must be exactly 10 digits.');
    if (!strongPass.test(password)) throw new Error('Password needs 10+ chars with upper, lower, number & symbol.');
    if (password !== confirm) throw new Error('Passwords do not match.');
  };

  const handleRegister = async () => {
    try {
      setLoading(true); setError(''); setMsg('');
      validate();
      const res = await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone, password });
      if (res?.requiresVerification) { setStep('otp'); setCooldown(60); setMsg('Check your email for the 6-digit code.'); return; }
      setStep('done');
    } catch (e: any) { setError(e?.response?.data?.message || e?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the complete 6-digit code.'); return; }
    try {
      setLoading(true); setError('');
      await verifyOTP(email.trim(), code);
      setStep('done');
    } catch (e: any) { setError(e?.response?.data?.message || e?.message || 'Invalid code.'); setOtp(['', '', '', '', '', '']); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try { setLoading(true); await resendOTP(email.trim()); setCooldown(60); setMsg('New code sent!'); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to resend.'); }
    finally { setLoading(false); }
  };

  const updateOtp = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[i] = d; setOtp(next);
  };

  // ── Success ───────────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.center}>
          <View style={s.successCircle}><MaterialCommunityIcons name="check" size={36} color={TEXT} /></View>
          <Text style={s.successTitle}>Account Created!</Text>
          <Text style={s.successSub}>Welcome to Finding Moto</Text>
          <Text style={s.successNote}>Your buyer account is ready. Start exploring parts & services.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── OTP ───────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <Text style={s.cardTitle}>Verify Email</Text>
            <Text style={s.cardSub}>Enter the 6-digit code sent to</Text>
            <View style={s.emailPill}><Text style={s.emailPillText}>{email.trim()}</Text></View>
            {!!msg && <View style={s.msgBox}><View style={s.inlineIconText}><MaterialCommunityIcons name="check-circle-outline" size={16} color="#6EE7B7" /><Text style={s.msgText}>{msg}</Text></View></View>}
            {!!error && <View style={s.errorBox}><View style={s.inlineIconText}><MaterialCommunityIcons name="alert-outline" size={16} color="#FCA5A5" /><Text style={s.errorText}>{error}</Text></View></View>}
            <View style={s.otpRow}>
              {otp.map((d, i) => (
                <TextInput
                  key={i} style={[s.otpBox, !!d && s.otpBoxFilled]}
                  value={d} onChangeText={v => updateOtp(i, v)}
                  keyboardType="number-pad" maxLength={1}
                  editable={!loading}
                />
              ))}
            </View>
            <Pressable style={[s.btn, (loading || otp.join('').length !== 6) && { opacity: 0.5 }]}
              onPress={handleVerify} disabled={loading || otp.join('').length !== 6}>
              {loading ? <ActivityIndicator color={TEXT} /> : <Text style={s.btnText}>Verify Email</Text>}
            </Pressable>
            <Pressable onPress={handleResend} disabled={loading || cooldown > 0}>
              <Text style={[s.resendText, cooldown > 0 && { color: BORDER }]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Registration form ─────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.heroSmall}>
          <MaterialCommunityIcons name="motorbike" size={42} color={TEXT} />
          <Text style={s.heroTitle}>Create Account</Text>
          <Text style={s.heroSub}>Join Finding Moto as a Buyer</Text>
        </View>

        <View style={s.card}>
          {/* Role tag */}
          <View style={s.roleCard}>
            <MaterialCommunityIcons name="cart-outline" size={30} color={ACCENT} />
            <View>
              <Text style={s.roleTitle}>Buyer Account</Text>
              <Text style={s.roleDesc}>Browse and purchase motorcycle parts & accessories</Text>
            </View>
          </View>

          <View style={s.nameRow}>
            <TextInput style={[s.input, { flex: 1 }]} value={firstName}
              onChangeText={v => setFirstName(v.replace(/[^A-Za-z\s.'-]/g, ''))}
              placeholder="First name" placeholderTextColor={TEXT2} />
            <TextInput style={[s.input, { flex: 1 }]} value={lastName}
              onChangeText={v => setLastName(v.replace(/[^A-Za-z\s.'-]/g, ''))}
              placeholder="Last name" placeholderTextColor={TEXT2} />
          </View>

          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="Email address" placeholderTextColor={TEXT2}
            keyboardType="email-address" autoCapitalize="none" />

          <TextInput style={s.input} value={phone}
            onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="Phone number (10 digits)" placeholderTextColor={TEXT2}
            keyboardType="phone-pad" maxLength={10} />

          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="Password (10+ chars, upper, lower, number, symbol)"
            placeholderTextColor={TEXT2} secureTextEntry />

          <TextInput style={s.input} value={confirm} onChangeText={setConfirm}
            placeholder="Confirm password" placeholderTextColor={TEXT2} secureTextEntry />

          {!!error && <View style={s.errorBox}><View style={s.inlineIconText}><MaterialCommunityIcons name="alert-outline" size={16} color="#FCA5A5" /><Text style={s.errorText}>{error}</Text></View></View>}

          <Pressable style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={TEXT} /> : <Text style={s.btnText}>Create Account</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 18, paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },

  heroSmall: { alignItems: 'center', marginBottom: 20, paddingTop: 10 },
  heroTitle: { color: TEXT, fontSize: 26, fontWeight: '900', marginTop: 8 },
  heroSub: { color: TEXT2, fontSize: 14, marginTop: 4 },

  card: { backgroundColor: CARD, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: BORDER },
  cardTitle: { color: TEXT, fontSize: 22, fontWeight: '900', marginBottom: 4 },
  cardSub: { color: TEXT2, fontSize: 14, marginBottom: 12 },

  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#001A3D', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: ACCENT },
  roleTitle: { color: TEXT, fontSize: 15, fontWeight: '800' },
  roleDesc: { color: TEXT2, fontSize: 12, marginTop: 2 },

  nameRow: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, color: TEXT, fontSize: 14, marginBottom: 10,
  },

  errorBox: { backgroundColor: '#2D0000', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#7F1D1D' },
  inlineIconText: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '600' },
  msgBox: { backgroundColor: '#002D1A', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: SUCCESS },
  msgText: { color: '#6EE7B7', fontSize: 13, fontWeight: '600' },

  btn: {
    backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 6,
    shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: TEXT, fontSize: 16, fontWeight: '900' },

  // Success
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: SUCCESS, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successIcon: { color: TEXT, fontSize: 36, fontWeight: '900' },
  successTitle: { color: TEXT, fontSize: 26, fontWeight: '900', marginBottom: 8 },
  successSub: { color: ACCENT, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  successNote: { color: TEXT2, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // OTP
  emailPill: { alignSelf: 'center', backgroundColor: BG, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  emailPillText: { color: TEXT2, fontSize: 13, fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  otpBox: { width: 46, height: 56, borderWidth: 2, borderColor: BORDER, borderRadius: 12, textAlign: 'center', fontSize: 22, fontWeight: '800', color: TEXT, backgroundColor: BG },
  otpBoxFilled: { borderColor: ACCENT },
  resendText: { color: ACCENT, textAlign: 'center', fontWeight: '800', marginTop: 14, fontSize: 14 },
});