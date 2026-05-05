import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const BG = '#0F172A'; const CARD = '#1E293B'; const BORDER = '#334155';
const ACCENT = '#2563EB'; const TEXT = '#FFFFFF'; const TEXT2 = '#94A3B8';

interface Participant { _id: string; firstName: string; lastName: string; role: string }
interface Conversation {
  _id: string; participants: Participant[];
  lastMessage?: { content: string; createdAt: string }; unreadCount?: number;
}
interface Message {
  _id: string; sender: { _id: string; firstName: string };
  content: string; createdAt: string;
}

const ROLE_COLOR: Record<string, string> = { seller: '#7C3AED', mechanic: '#0891B2' };

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [convos, setConvos]         = useState<Conversation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [active, setActive]         = useState<Conversation | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const flatRef = useRef<FlatList>(null);

  const fetchConvos = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setConvos(list);
    } catch { setConvos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchConvos(); }, [fetchConvos]);

  const openChat = async (c: Conversation) => {
    setActive(c); setMsgLoading(true);
    try {
      const { data } = await api.get(`/chat/conversations/${c._id}/messages`);
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setMessages(list);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 80);
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }
  };

  const sendMsg = async () => {
    if (!text.trim() || !active || sending) return;
    const body = text.trim(); setText(''); setSending(true);
    try {
      await api.post(`/chat/conversations/${active._id}/messages`, { content: body });
      await openChat(active);
    } catch { setText(body); }
    finally { setSending(false); }
  };

  const getOther = (c: Conversation) => c.participants.find(p => p._id !== user?._id);
  const rc = (role: string) => ROLE_COLOR[role] ?? '#374151';

  // ── Chat view ─────────────────────────────────────────
  if (active) {
    const other = getOther(active);
    const color = rc(other?.role ?? '');
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.chatHeader}>
          <Pressable onPress={() => { setActive(null); fetchConvos(); }} style={s.backBtn}>
            <Text style={s.backIcon}>←</Text>
          </Pressable>
          <View style={[s.avatarSm, { backgroundColor: color }]}>
            <Text style={s.avatarSmText}>{(other?.firstName?.[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.chatName}>{other?.firstName} {other?.lastName}</Text>
            <View style={s.onlineRow}>
              <View style={[s.roleTag, { backgroundColor: color + '33' }]}>
                <Text style={[s.roleTagText, { color }]}>{other?.role}</Text>
              </View>
            </View>
          </View>
        </View>

        {msgLoading ? (
          <View style={s.center}><ActivityIndicator color={ACCENT} /></View>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={m => m._id}
              contentContainerStyle={s.msgList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <View style={s.center}>
                  <Text style={s.emptyIcon}>💬</Text>
                  <Text style={s.emptyTitle}>No messages yet</Text>
                  <Text style={s.emptyText}>Start the conversation!</Text>
                </View>
              }
              renderItem={({ item: m }) => {
                const isMe = m.sender._id === user?._id;
                return (
                  <View style={[s.bubbleRow, isMe ? s.bubbleRowMe : s.bubbleRowOther]}>
                    {!isMe && (
                      <View style={[s.bubbleAvatar, { backgroundColor: color }]}>
                        <Text style={s.bubbleAvatarText}>{(other?.firstName?.[0] ?? '?').toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
                      <Text style={[s.bubbleText, isMe && { color: TEXT }]}>{m.content}</Text>
                      <Text style={[s.bubbleTime, isMe && { color: 'rgba(255,255,255,0.5)' }]}>
                        {timeAgo(m.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
            <View style={s.inputBar}>
              <TextInput
                style={s.msgInput}
                value={text}
                onChangeText={setText}
                placeholder="Type a message…"
                placeholderTextColor={TEXT2}
                multiline maxLength={500}
              />
              <Pressable
                style={[s.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
                onPress={sendMsg} disabled={!text.trim() || sending}
              >
                {sending ? <ActivityIndicator color={TEXT} size="small" /> : <Text style={s.sendIcon}>➤</Text>}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    );
  }

  // ── Conversations list ────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Messages</Text>
        {convos.length > 0 && (
          <View style={s.headerBadge}><Text style={s.headerBadgeText}>{convos.length}</Text></View>
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={ACCENT} /></View>
      ) : convos.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>💬</Text>
          <Text style={s.emptyTitle}>No conversations yet</Text>
          <Text style={s.emptyText}>Start chatting from a product or service page.</Text>
        </View>
      ) : (
        <FlatList
          data={convos}
          keyExtractor={c => c._id}
          contentContainerStyle={s.list}
          renderItem={({ item: c }) => {
            const other = getOther(c);
            const color = rc(other?.role ?? '');
            const unread = (c.unreadCount ?? 0) > 0;
            return (
              <Pressable style={s.convoCard} onPress={() => openChat(c)}>
                <View style={[s.avatar, { backgroundColor: color }]}>
                  <Text style={s.avatarText}>{(other?.firstName?.[0] ?? '?').toUpperCase()}</Text>
                  {unread && <View style={s.unreadDot} />}
                </View>
                <View style={s.convoInfo}>
                  <View style={s.convoTopRow}>
                    <Text style={[s.convoName, unread && { color: TEXT, fontWeight: '900' }]} numberOfLines={1}>
                      {other?.firstName} {other?.lastName}
                    </Text>
                    <Text style={s.convoTime}>
                      {c.lastMessage?.createdAt ? timeAgo(c.lastMessage.createdAt) : ''}
                    </Text>
                  </View>
                  <View style={s.convoBottomRow}>
                    <View style={[s.roleTag, { backgroundColor: color + '33' }]}>
                      <Text style={[s.roleTagText, { color }]}>{other?.role}</Text>
                    </View>
                    {c.lastMessage?.content && (
                      <Text style={[s.lastMsg, unread && { color: TEXT }]} numberOfLines={1}>
                        {c.lastMessage.content}
                      </Text>
                    )}
                  </View>
                </View>
                {unread && <View style={s.unreadBadge}><Text style={s.unreadBadgeText}>{c.unreadCount}</Text></View>}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: '800' },
  emptyText: { color: TEXT2, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  headerTitle: { color: TEXT, fontSize: 24, fontWeight: '900' },
  headerBadge: { backgroundColor: ACCENT, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  headerBadgeText: { color: TEXT, fontSize: 11, fontWeight: '900' },
  list: { paddingHorizontal: 14, paddingBottom: 24 },
  convoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 18, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: BORDER },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { color: TEXT, fontSize: 20, fontWeight: '900' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: CARD },
  convoInfo: { flex: 1 },
  convoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convoName: { fontSize: 15, fontWeight: '700', color: TEXT2, flex: 1 },
  convoTime: { fontSize: 11, color: TEXT2 },
  convoBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  roleTag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  roleTagText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  lastMsg: { flex: 1, fontSize: 13, color: TEXT2 },
  unreadBadge: { backgroundColor: '#EF4444', borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadBadgeText: { color: TEXT, fontSize: 10, fontWeight: '900' },

  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { padding: 4 },
  backIcon: { color: ACCENT, fontSize: 22, fontWeight: '700' },
  avatarSm: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarSmText: { color: TEXT, fontSize: 15, fontWeight: '900' },
  chatName: { color: TEXT, fontSize: 15, fontWeight: '800' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },

  msgList: { padding: 16, flexGrow: 1 },
  bubbleRow: { marginBottom: 10 },
  bubbleRowMe: { alignItems: 'flex-end' },
  bubbleRowOther: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubbleAvatarText: { color: TEXT, fontSize: 11, fontWeight: '900' },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 12 },
  bubbleMe: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: CARD, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER },
  bubbleText: { fontSize: 14, color: TEXT2, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: TEXT2, marginTop: 4, textAlign: 'right' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER },
  msgInput: { flex: 1, backgroundColor: BG, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: TEXT, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: BORDER },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: TEXT, fontSize: 18, marginLeft: 2 },
});
