import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import api from '../services/api';
import { useApp } from '../context/AppContext';

// ── Design tokens ─────────────────────────────────────────
const BG     = '#0F172A';
const CARD   = '#1E293B';
const BORDER = '#334155';
const ACCENT = '#2563EB';
const TEXT   = '#FFFFFF';
const TEXT2  = '#94A3B8';

// ── Types ─────────────────────────────────────────────────
interface Msg { id: string; role: 'user' | 'ai'; text: string; ts: number }

const QUICK = [
  { label: '🏍️ Recommend parts',  prompt: 'Recommend popular motorcycle parts for me.' },
  { label: '📦 Track my order',   prompt: 'How can I track my order?' },
  { label: '↩ Return an item',    prompt: 'How do I return an item or request a refund?' },
  { label: '🔧 Find a mechanic',  prompt: 'Help me find a mechanic for my bike.' },
  { label: '❓ General help',     prompt: 'What can you help me with on Finding Moto?' },
];

// ── Typing dots ───────────────────────────────────────────
function TypingDots() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 4), 450);
    return () => clearInterval(t);
  }, []);
  return <Text style={ai.dotText}>{'.'.repeat(frame + 1)}</Text>;
}

// ── Main component ────────────────────────────────────────
export default function AIAssistant() {
  const { aiOpen, closeAI, toggleAI } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: '0', role: 'ai', text: "Hi! I'm Moto AI 🏍️\nHow can I help you today?", ts: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Slide-up animation
  const slideY = useRef(new Animated.Value(600)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: aiOpen ? 0 : 600,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [aiOpen]);

  const pulseFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    toggleAI();
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { id: String(Date.now()), role: 'user', text: text.trim(), ts: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { data } = await api.post('/ai/chat', { message: text.trim() });
      const reply = data?.reply ?? data?.message ?? data?.response ?? 'Sorry, I could not get a response. Please try again.';
      setMsgs(prev => [...prev, { id: String(Date.now() + 1), role: 'ai', text: reply, ts: Date.now() }]);
    } catch {
      setMsgs(prev => [...prev, { id: String(Date.now() + 1), role: 'ai', text: 'Sorry, I\'m having trouble connecting. Please check your connection and try again.', ts: Date.now() }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── Backdrop ── */}
      {aiOpen && (
        <Pressable style={ai.backdrop} onPress={closeAI} />
      )}

      {/* ── Slide-up Panel ── */}
      <Animated.View style={[ai.panel, { transform: [{ translateY: slideY }] }]}>
        {/* Header */}
        <View style={ai.header}>
          <View style={ai.headerLeft}>
            <View style={ai.botAvatar}>
              <Text style={ai.botEmoji}>🤖</Text>
            </View>
            <View>
              <Text style={ai.headerTitle}>Moto AI Assistant</Text>
              <View style={ai.onlineRow}>
                <View style={ai.onlineDot} />
                <Text style={ai.onlineText}>Online • Powered by Gemini</Text>
              </View>
            </View>
          </View>
          <Pressable onPress={closeAI} style={ai.closeBtn}>
            <Text style={ai.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Messages */}
          <FlatList
            ref={flatRef}
            data={msgs}
            keyExtractor={m => m.id}
            contentContainerStyle={ai.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={
              msgs.length === 1 ? (
                <View style={ai.quickSection}>
                  <Text style={ai.quickTitle}>Quick Actions</Text>
                  <View style={ai.quickGrid}>
                    {QUICK.map(q => (
                      <Pressable key={q.label} style={ai.quickBtn} onPress={() => send(q.prompt)}>
                        <Text style={ai.quickBtnText}>{q.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item: m }) => (
              <View style={[ai.bubbleRow, m.role === 'user' ? ai.bubbleRowUser : ai.bubbleRowAI]}>
                {m.role === 'ai' && (
                  <View style={ai.aiBubbleAvatar}><Text style={{ fontSize: 12 }}>🤖</Text></View>
                )}
                <View style={[ai.bubble, m.role === 'user' ? ai.bubbleUser : ai.bubbleAI]}>
                  <Text style={[ai.bubbleText, m.role === 'user' && { color: TEXT }]}>{m.text}</Text>
                  <Text style={ai.bubbleTime}>{formatTime(m.ts)}</Text>
                </View>
              </View>
            )}
            ListFooterComponent={
              loading ? (
                <View style={[ai.bubbleRow, ai.bubbleRowAI]}>
                  <View style={ai.aiBubbleAvatar}><Text style={{ fontSize: 12 }}>🤖</Text></View>
                  <View style={ai.bubbleAI}>
                    <TypingDots />
                  </View>
                </View>
              ) : null
            }
          />

          {/* Input bar */}
          <View style={ai.inputBar}>
            <TextInput
              style={ai.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Moto AI anything…"
              placeholderTextColor={TEXT2}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
              multiline
              maxLength={300}
            />
            <Pressable
              style={[ai.sendBtn, (!input.trim() || loading) && ai.sendBtnDisabled]}
              onPress={() => send(input)}
              disabled={!input.trim() || loading}
            >
              {loading
                ? <ActivityIndicator color={TEXT} size="small" />
                : <Text style={ai.sendIcon}>➤</Text>
              }
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* ── FAB ── */}
      <Animated.View style={[ai.fab, { transform: [{ scale: fabScale }] }]}>
        <Pressable onPress={pulseFab} style={ai.fabInner}>
          <Text style={ai.fabEmoji}>{aiOpen ? '✕' : '🤖'}</Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────
const ai = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 90,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '78%',
    backgroundColor: CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 100,
    borderTopWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botEmoji: { fontSize: 20 },
  headerTitle: { color: TEXT, fontWeight: '800', fontSize: 15 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  onlineText: { color: '#10B981', fontSize: 11, fontWeight: '600' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: TEXT2, fontWeight: '700', fontSize: 13 },

  msgList: { padding: 14, gap: 10, flexGrow: 1 },
  quickSection: { marginBottom: 14 },
  quickTitle: { color: TEXT2, fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    backgroundColor: '#1E3A5F',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  quickBtnText: { color: '#93C5FD', fontSize: 12, fontWeight: '700' },

  bubbleRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAI: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  aiBubbleAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 12 },
  bubbleUser: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: '#0F2744', borderBottomLeftRadius: 4 },
  bubbleText: { color: TEXT2, fontSize: 14, lineHeight: 20 },
  bubbleTime: { color: '#475569', fontSize: 10, marginTop: 4, textAlign: 'right' },
  dotText: { color: TEXT2, fontSize: 20, letterSpacing: 4 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 10,
    backgroundColor: CARD,
  },
  textInput: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: TEXT,
    fontSize: 14,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: TEXT, fontSize: 17, marginLeft: 2 },

  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 200,
    shadowColor: ACCENT,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabEmoji: { fontSize: 26 },
});
