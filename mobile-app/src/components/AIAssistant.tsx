import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { useApp } from '../context/AppContext';

const BG = '#0F172A';
const CARD = '#1E293B';
const BORDER = '#334155';
const ACCENT = '#2563EB';
const TEXT = '#FFFFFF';
const TEXT2 = '#94A3B8';

interface Msg {
  id: string;
  role: 'user' | 'ai';
  text: string;
  ts: number;
}

const QUICK = [
  { label: 'Recommend parts', prompt: 'Recommend popular motorcycle parts for me.' },
  { label: 'Track my order', prompt: 'How can I track my order?' },
  { label: 'Return an item', prompt: 'How do I return an item or request a refund?' },
  { label: 'Find a mechanic', prompt: 'Help me find a mechanic for my bike.' },
  { label: 'General help', prompt: 'What can you help me with on Finding Moto?' },
];

function TypingDots() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFrame((current) => (current + 1) % 4), 450);
    return () => clearInterval(t);
  }, []);

  return <Text style={styles.dotText}>{'.'.repeat(frame + 1)}</Text>;
}

export default function AIAssistant() {
  const { aiOpen, openAI, closeAI } = useApp();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: '0', role: 'ai', text: "Hi! I'm Moto AI.\nHow can I help you today?", ts: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList<Msg>>(null);
  const panelTranslateY = useRef(new Animated.Value(720)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (aiOpen) {
      setIsOpen(true);
    }
  }, [aiOpen]);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(panelTranslateY, {
          toValue: 0,
          tension: 74,
          friction: 13,
          useNativeDriver: true,
        }),
        Animated.timing(panelOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(panelTranslateY, {
        toValue: 720,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(panelOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, isOpen, panelOpacity, panelTranslateY]);

  const scrollToBottom = (animated: boolean) => {
    requestAnimationFrame(() => flatRef.current?.scrollToEnd({ animated }));
  };

  const openPanel = () => {
    setIsOpen(true);
    if (!aiOpen) {
      openAI();
    }
  };

  const closePanel = () => {
    setIsOpen(false);
    if (aiOpen) {
      closeAI();
    }
  };

  const pulseFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    openPanel();
  };

  const send = async (text: string) => {
    const nextText = text.trim();
    if (!nextText || loading) return;

    const userMsg: Msg = { id: String(Date.now()), role: 'user', text: nextText, ts: Date.now() };
    setMsgs((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom(true);

    try {
      const { data } = await api.post('/ai/chat', { message: nextText });
      const reply =
        data?.data?.answer ??
        data?.reply ??
        data?.message ??
        data?.response ??
        'Sorry, I could not get a response. Please try again.';
      setMsgs((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: 'ai', text: reply, ts: Date.now() },
      ]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'ai',
          text: "Sorry, I'm having trouble connecting. Please check your connection and try again.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(true), 150);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const bottomInset = Math.max(insets.bottom, 10);
  const panelBottom = bottomInset + 76;
  const fabBottom = bottomInset + 82;
  return (
    <>
      {isOpen && (
        <Animated.View
          pointerEvents="auto"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closePanel} />
        </Animated.View>
      )}

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.panel,
          {
            bottom: panelBottom,
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslateY }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>AI</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Moto AI Assistant</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
          </View>
          <Pressable onPress={closePanel} hitSlop={14} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>X</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            ref={flatRef}
            data={msgs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollToBottom(true)}
            ListHeaderComponent={
              msgs.length === 1 ? (
                <View style={styles.quickSection}>
                  <Text style={styles.quickTitle}>Quick Actions</Text>
                  <View style={styles.quickGrid}>
                    {QUICK.map((item) => (
                      <Pressable key={item.label} style={styles.quickBtn} onPress={() => send(item.prompt)}>
                        <Text style={styles.quickBtnText}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubbleRow,
                  item.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAI,
                ]}
              >
                {item.role === 'ai' && (
                  <View style={styles.aiBubbleAvatar}>
                    <Text style={styles.aiBubbleAvatarText}>AI</Text>
                  </View>
                )}
                <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                  <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
                    {item.text}
                  </Text>
                  <Text style={styles.bubbleTime}>{formatTime(item.ts)}</Text>
                </View>
              </View>
            )}
            ListFooterComponent={
              loading ? (
                <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
                  <View style={styles.aiBubbleAvatar}>
                    <Text style={styles.aiBubbleAvatarText}>AI</Text>
                  </View>
                  <View style={styles.typingBubble}>
                    <TypingDots />
                  </View>
                </View>
              ) : null
            }
          />

          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Moto AI anything..."
              placeholderTextColor={TEXT2}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
              multiline
              maxLength={300}
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => send(input)}
              disabled={!input.trim() || loading}
            >
              {loading ? <ActivityIndicator color={TEXT} size="small" /> : <Text style={styles.sendIcon}>Go</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {!isOpen && (
        <Animated.View style={[styles.fab, { bottom: fabBottom, transform: [{ scale: fabScale }] }]}>
          <Pressable onPress={pulseFab} style={styles.fabInner}>
            <Text style={styles.fabText}>AI</Text>
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.58)',
    zIndex: 800,
    elevation: 18,
  },
  panel: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: '70%',
    backgroundColor: CARD,
    borderRadius: 26,
    zIndex: 900,
    elevation: 26,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#020617',
    shadowOpacity: 0.42,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarText: { color: TEXT, fontWeight: '900', fontSize: 13, letterSpacing: 0.6 },
  headerTitle: { color: TEXT, fontWeight: '800', fontSize: 15 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  onlineText: { color: '#10B981', fontSize: 11, fontWeight: '600' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: TEXT, fontWeight: '800', fontSize: 15 },
  msgList: { padding: 14, gap: 10, flexGrow: 1 },
  quickSection: { marginBottom: 14 },
  quickTitle: {
    color: TEXT2,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    backgroundColor: '#16263D',
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
  aiBubbleAvatarText: { color: TEXT, fontSize: 10, fontWeight: '900' },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 12 },
  bubbleUser: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: '#13253B', borderBottomLeftRadius: 4 },
  typingBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#13253B',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: TEXT2, fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: TEXT },
  bubbleTime: { color: '#64748B', fontSize: 10, marginTop: 4, textAlign: 'right' },
  dotText: { color: TEXT2, fontSize: 20, letterSpacing: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: TEXT, fontSize: 12, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
    elevation: 30,
    shadowColor: ACCENT,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  fabText: { fontSize: 17, fontWeight: '900', color: TEXT, letterSpacing: 0.4 },
});
