import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<{ Login: undefined; Register: undefined }, 'Login'>;

const BG = '#0F172A'; const CARD = '#1E293B'; const BORDER = '#334155';
const ACCENT = '#2563EB'; const TEXT = '#FFFFFF'; const TEXT2 = '#94A3B8';

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    try {
      setLoading(true); setError('');
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.logoBox}>
              <Text style={s.logoEmoji}>🏍️</Text>
            </View>
            <Text style={s.appName}>Finding Moto</Text>
            <Text style={s.tagline}>Your motorbike marketplace</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Welcome Back</Text>
            <Text style={s.cardSub}>Sign in to your buyer account</Text>

            {/* Email */}
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>✉️</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={TEXT2}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={TEXT2}
                secureTextEntry={!showPass}
              />
              <Pressable onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                <Text style={s.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>

            {/* Error */}
            {!!error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>⚠️  {error}</Text>
              </View>
            )}

            {/* Login button */}
            <Pressable style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
              {loading
                ? <ActivityIndicator color={TEXT} />
                : <Text style={s.btnText}>Sign In as Buyer</Text>
              }
            </Pressable>

            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divText}>New here?</Text>
              <View style={s.divLine} />
            </View>

            <Pressable style={s.outlineBtn} onPress={() => navigation.navigate('Register')}>
              <Text style={s.outlineBtnText}>Create Buyer Account</Text>
            </Pressable>
          </View>

          {/* Note */}
          <View style={s.noteBox}>
            <Text style={s.noteText}>
              ℹ️  Sellers, Mechanics & Delivery Agents use the web dashboard, not this app.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 22, paddingTop: 10, flexGrow: 1, justifyContent: 'center' },

  hero: { alignItems: 'center', marginBottom: 30 },
  logoBox: {
    width: 88, height: 88, borderRadius: 26, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: ACCENT, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
  },
  logoEmoji: { fontSize: 44 },
  appName: { color: TEXT, fontSize: 30, fontWeight: '900' },
  tagline: { color: TEXT2, fontSize: 14, marginTop: 5 },

  card: { backgroundColor: CARD, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  cardTitle: { color: TEXT, fontSize: 22, fontWeight: '900', marginBottom: 4 },
  cardSub: { color: TEXT2, fontSize: 14, marginBottom: 22 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BG,
    borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12, gap: 10,
  },
  inputIcon: { fontSize: 17 },
  input: { flex: 1, color: TEXT, fontSize: 15, paddingVertical: 11 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 17 },

  errorBox: { backgroundColor: '#2D0000', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#7F1D1D' },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '600' },

  btn: {
    backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 14, elevation: 6,
  },
  btnText: { color: TEXT, fontSize: 16, fontWeight: '900' },

  divRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  divLine: { flex: 1, height: 1, backgroundColor: BORDER },
  divText: { color: TEXT2, fontSize: 12, fontWeight: '600' },

  outlineBtn: { borderWidth: 1.5, borderColor: ACCENT, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  outlineBtnText: { color: ACCENT, fontSize: 15, fontWeight: '900' },

  noteBox: { backgroundColor: '#001A3D', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  noteText: { color: '#93C5FD', fontSize: 13, lineHeight: 19 },
});
