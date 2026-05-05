import api from './api';

export interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  shopName?: string;
  workshopName?: string;
  specialization?: string;
}

export interface ChatMessage {
  _id: string;
  sender: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface ChatConversation {
  chatId: string;
  user: ChatUser;
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface ChatData {
  chat: {
    _id: string;
    participants: string[];
    messages: ChatMessage[];
  };
  recipient: ChatUser;
}

// Get list of sellers/mechanics the buyer can chat with
export const getChatUsers = async (): Promise<ChatUser[]> => {
  const { data } = await api.get('/chat/users');
  return data;
};

// Get user's conversations
export const getMyChats = async (): Promise<ChatConversation[]> => {
  const { data } = await api.get('/chat/conversations');
  return data;
};

// Get or create a chat with a specific user
export const getOrCreateChat = async (recipientId: string): Promise<ChatData> => {
  const { data } = await api.get(`/chat/${recipientId}`);
  return data;
};

// Send a message
export const sendMessage = async (chatId: string, content: string): Promise<ChatMessage> => {
  const { data } = await api.post(`/chat/${chatId}/messages`, { content });
  return data;
};

// Mark messages as read
export const markChatAsRead = async (chatId: string): Promise<void> => {
  await api.put(`/chat/${chatId}/read`);
};
