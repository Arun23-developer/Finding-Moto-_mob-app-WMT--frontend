import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Send,
  ArrowLeft,
  MessageSquare,
  Circle,
  Store,
  Wrench,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getChatUsers,
  getMyChats,
  getOrCreateChat,
  sendMessage as sendMessageApi,
  markChatAsRead,
  ChatUser,
  ChatConversation,
  ChatMessage,
} from '@/services/chatService';
import { resolveMediaUrl } from '@/lib/imageUrl';
import { createAuthedSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const oneDay = 86400000;

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * oneDay) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getRoleIcon(role: string) {
  if (role === 'seller') return <Store className="w-3 h-3" />;
  if (role === 'mechanic') return <Wrench className="w-3 h-3" />;
  return <UserIcon className="w-3 h-3" />;
}

function getRoleBadgeColor(role: string) {
  if (role === 'seller') return 'chat-role-seller';
  if (role === 'mechanic') return 'chat-role-mechanic';
  return 'chat-role-buyer';
}

function getDisplayName(user: ChatUser) {
  const name = `${user.firstName} ${user.lastName}`;
  if (user.role === 'seller' && user.shopName) return `${name} — ${user.shopName}`;
  if (user.role === 'mechanic' && user.workshopName) return `${name} — ${user.workshopName}`;
  return name;
}

function getInitials(user: ChatUser) {
  return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
}

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRecipientId = searchParams.get('user');

  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<ChatUser | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Setup Socket.IO connection
  useEffect(() => {
    const s = createAuthedSocket();
    if (!s) return;

    s.on('connect', () => {
      s.emit('users:online');
    });

    s.on('users:online', (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });

    s.on('user:online', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    s.on('user:offline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    s.on('chat:message', ({ message }: { chatId: string; message: ChatMessage }) => {
      setActiveChatMessages((prev) => [...prev, message]);
      setTimeout(scrollToBottom, 50);
    });

    s.on('chat:notification', ({ chatId }: { chatId: string; message: ChatMessage; senderId: string }) => {
      // Update conversation list unread count
      setConversations((prev) =>
        prev.map((c) => (c.chatId === chatId ? { ...c, unreadCount: c.unreadCount + 1 } : c))
      );
    });

    s.on('chat:typing', ({ userId: typerId }: { userId: string; chatId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(typerId));
    });

    s.on('chat:stopTyping', ({ userId: typerId }: { userId: string; chatId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(typerId);
        return next;
      });
    });

    s.on('chat:read', () => {
      setActiveChatMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [scrollToBottom]);

  // Load initial data
  useEffect(() => {
    async function load() {
      try {
        const [convos, users] = await Promise.all([getMyChats(), getChatUsers()]);
        setConversations(convos);
        setAvailableUsers(users);

        // If a ?user= param is provided, open that chat
        if (initialRecipientId) {
          await openChat(initialRecipientId);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [activeChatMessages, scrollToBottom]);

  async function openChat(recipientId: string) {
    try {
      setError('');
      const data = await getOrCreateChat(recipientId);
      setActiveChat(data.chat._id);
      setActiveChatMessages(data.chat.messages);
      setActiveRecipient(data.recipient);
      setShowSidebar(false);

      // Join socket room
      socket?.emit('chat:join', data.chat._id);

      // Mark as read
      await markChatAsRead(data.chat._id);
      socket?.emit('chat:read', { chatId: data.chat._id });

      // Update unread count in conversation list
      setConversations((prev) =>
        prev.map((c) => (c.chatId === data.chat._id ? { ...c, unreadCount: 0 } : c))
      );

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: any) {
      console.error('Failed to open chat:', err);
      setError(err?.response?.data?.message || 'Unable to open this conversation.');
    }
  }

  async function handleSend() {
    if (!messageInput.trim() || !activeChat || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      setError('');
      const msg = await sendMessageApi(activeChat, content);
      setActiveChatMessages((prev) => [...prev, msg]);

      // Emit via socket for real-time delivery
      socket?.emit('chat:message', {
        chatId: activeChat,
        message: msg,
        recipientId: activeRecipient?._id,
      });

      // Stop typing
      socket?.emit('chat:stopTyping', { chatId: activeChat, recipientId: activeRecipient?._id });

      // Update conversation list
      setConversations((prev) => {
        const existing = prev.find((c) => c.chatId === activeChat);
        if (existing) {
          return prev
            .map((c) =>
              c.chatId === activeChat
                ? { ...c, lastMessage: { content, sender: user!._id, createdAt: new Date().toISOString() }, updatedAt: new Date().toISOString() }
                : c
            )
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        return prev;
      });

      scrollToBottom();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err?.response?.data?.message || 'Unable to send this message.');
      setMessageInput(content); // restore on failure
    } finally {
      setSending(false);
    }
  }

  function handleTyping() {
    if (!activeChat || !activeRecipient) return;
    socket?.emit('chat:typing', { chatId: activeChat, recipientId: activeRecipient._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('chat:stopTyping', { chatId: activeChat, recipientId: activeRecipient._id });
    }, 2000);
  }

  function goBack() {
    if (activeChat) {
      socket?.emit('chat:leave', activeChat);
    }
    setActiveChat(null);
    setActiveRecipient(null);
    setActiveChatMessages([]);
    setShowSidebar(true);
  }

  // Filter users for the sidebar list
  const isBuyer = user?.role === 'buyer';
  const messageCenterTitle = isBuyer ? 'Messages' : 'Buyer Message Center';
  const searchPlaceholder = isBuyer ? 'Search conversations or providers...' : 'Search buyer conversations...';

  // For buyers: show available sellers/mechanics + existing conversations
  // For sellers/mechanics: show existing conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const name = `${c.user?.firstName} ${c.user?.lastName}`.toLowerCase();
    const shop = (c.user?.shopName || c.user?.workshopName || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || shop.includes(q);
  });

  const filteredAvailableUsers = availableUsers.filter((u) => {
    // Don't show users we already have conversations with
    const hasConvo = conversations.some((c) => c.user?._id === u._id);
    if (hasConvo) return false;

    if (!searchQuery) return true;
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    const shop = (u.shopName || u.workshopName || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || shop.includes(q);
  });

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="spinner" />
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Sidebar - Conversation List */}
      <div className={`chat-sidebar ${!showSidebar ? 'chat-sidebar-hidden' : ''}`}>
        <div className="chat-sidebar-header">
          <h2>{messageCenterTitle}</h2>
          <MessageSquare className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
        </div>

        {!isBuyer && (
          <div className="mx-4 mb-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Buyers start conversations. You can reply to buyers who have already messaged you.
          </div>
        )}

        {error && (
          <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="chat-search-wrap">
          <Search className="chat-search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="chat-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chat-list">
          {/* Existing conversations */}
          {filteredConversations.map((convo) => (
            <button
              key={convo.chatId}
              className={`chat-list-item ${activeChat === convo.chatId ? 'active' : ''}`}
              onClick={() => openChat(convo.user._id)}
            >
              <div className="chat-avatar-wrap">
                <div className="chat-avatar">
                  {convo.user?.avatar ? (
                    <img src={resolveMediaUrl(convo.user.avatar)} alt="" />
                  ) : (
                    <span>{getInitials(convo.user)}</span>
                  )}
                </div>
                {onlineUsers.has(convo.user?._id) && <span className="chat-online-dot" />}
              </div>
              <div className="chat-list-info">
                <div className="chat-list-top">
                  <span className="chat-list-name">
                    {convo.user?.firstName} {convo.user?.lastName}
                  </span>
                  {convo.lastMessage && (
                    <span className="chat-list-time">{formatTime(convo.lastMessage.createdAt)}</span>
                  )}
                </div>
                <div className="chat-list-bottom">
                  <span className={`chat-role-badge ${getRoleBadgeColor(convo.user?.role)}`}>
                    {getRoleIcon(convo.user?.role)}
                    {convo.user?.role}
                  </span>
                  {convo.lastMessage && (
                    <span className="chat-list-preview">{convo.lastMessage.content}</span>
                  )}
                </div>
              </div>
              {convo.unreadCount > 0 && (
                <span className="chat-unread-badge">{convo.unreadCount}</span>
              )}
            </button>
          ))}

          {/* Available users (for buyers) */}
          {isBuyer && filteredAvailableUsers.length > 0 && (
            <>
              <div className="chat-section-divider">
                <span>Available {searchQuery ? 'matches' : 'sellers & mechanics'}</span>
              </div>
              {filteredAvailableUsers.map((u) => (
                <button
                  key={u._id}
                  className="chat-list-item"
                  onClick={() => openChat(u._id)}
                >
                  <div className="chat-avatar-wrap">
                    <div className="chat-avatar">
                      {u.avatar ? (
                        <img src={resolveMediaUrl(u.avatar)} alt="" />
                      ) : (
                        <span>{getInitials(u)}</span>
                      )}
                    </div>
                    {onlineUsers.has(u._id) && <span className="chat-online-dot" />}
                  </div>
                  <div className="chat-list-info">
                    <div className="chat-list-top">
                      <span className="chat-list-name">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                    <div className="chat-list-bottom">
                      <span className={`chat-role-badge ${getRoleBadgeColor(u.role)}`}>
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                      <span className="chat-list-preview">
                        {u.shopName || u.workshopName || u.specialization || 'Start a conversation'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {filteredConversations.length === 0 && filteredAvailableUsers.length === 0 && (
            <div className="chat-empty-list">
              <MessageSquare className="w-10 h-10" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p>{searchQuery ? 'No results found' : 'No conversations yet'}</p>
              {!isBuyer && !searchQuery && (
                <span>Buyers will appear here once they send you a message</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`chat-main ${!showSidebar ? 'chat-main-active' : ''}`}>
        {activeRecipient ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button className="chat-back-btn" onClick={goBack}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="chat-avatar-wrap">
                <div className="chat-avatar chat-avatar-sm">
                  {activeRecipient.avatar ? (
                    <img src={resolveMediaUrl(activeRecipient.avatar)} alt="" />
                  ) : (
                    <span>{getInitials(activeRecipient)}</span>
                  )}
                </div>
                {onlineUsers.has(activeRecipient._id) && <span className="chat-online-dot" />}
              </div>
              <div className="chat-header-info">
                <h3>{getDisplayName(activeRecipient)}</h3>
                <span className="chat-header-status">
                  {typingUsers.has(activeRecipient._id)
                    ? 'Typing...'
                    : onlineUsers.has(activeRecipient._id)
                    ? 'Online'
                    : 'Offline'}
                </span>
              </div>
              <span className={`chat-role-badge ${getRoleBadgeColor(activeRecipient.role)}`}>
                {getRoleIcon(activeRecipient.role)}
                {activeRecipient.role}
              </span>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {activeChatMessages.length === 0 && (
                <div className="chat-empty-messages">
                  <MessageSquare className="w-12 h-12" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p>No messages yet</p>
                  <span>Send a message to start the conversation</span>
                </div>
              )}
              {activeChatMessages.map((msg, i) => {
                const isOwn = msg.sender === user?._id;
                const showTime =
                  i === 0 ||
                  new Date(msg.createdAt).getTime() - new Date(activeChatMessages[i - 1].createdAt).getTime() > 300000;

                return (
                  <div key={msg._id || i}>
                    {showTime && (
                      <div className="chat-time-divider">
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                    )}
                    <div className={`chat-bubble-row ${isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}`}>
                      {!isOwn && (
                        <div className="chat-avatar chat-avatar-xs">
                          {activeRecipient.avatar ? (
                            <img src={resolveMediaUrl(activeRecipient.avatar)} alt="" />
                          ) : (
                            <span style={{ fontSize: '10px' }}>{getInitials(activeRecipient)}</span>
                          )}
                        </div>
                      )}
                      <div className={`chat-bubble ${isOwn ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                        <p>{msg.content}</p>
                        <span className="chat-bubble-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && (
                            <Circle
                              className="w-3 h-3"
                              style={{
                                marginLeft: 4,
                                fill: msg.read ? 'hsl(var(--accent))' : 'transparent',
                                color: msg.read ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
                              }}
                            />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                className="chat-input"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                maxLength={2000}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!messageInput.trim() || sending}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="chat-no-selection">
            <MessageSquare className="w-16 h-16" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <h3>Select a conversation</h3>
            <p>
              {isBuyer
                ? 'Choose a seller or mechanic to start chatting'
                : 'Choose an existing buyer conversation to reply'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
