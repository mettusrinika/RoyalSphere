'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '@/components/layout/Navbar';
import { PageLoader } from '@/components/ui/Skeleton';
import { messagesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSocketStore } from '@/lib/stores/socketStore';
import { getInitials, timeAgo } from '@/lib/utils';

type UserSummary = {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
};

type Conversation = {
  conversationId: string;
  bookingId: string;
  serviceId?: unknown;
  otherUser: UserSummary;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: string;
  isMuted: boolean;
  isBlocked: boolean;
};

type ChatMessage = {
  _id: string;
  conversationId: string;
  senderId: UserSummary | string;
  receiverId: UserSummary | string;
  content: string;
  createdAt: string;
};

const idOf = (value: UserSummary | string | null | undefined) =>
  typeof value === 'string' ? value : value?._id;

function ChatContent() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get('conversation');
  const { user } = useAuthStore();
  const { socket, setUnreadMessages } = useSocketStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    requestedConversationId,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversation =
    conversations.find(
      (conversation) =>
        String(conversation.conversationId) === activeConversationId,
    ) ?? null;

  const loadConversations = useCallback(async () => {
  try {
    const response = await messagesApi.getConversations();

    const responseData = response.data;

    const items: Conversation[] = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.data)
        ? responseData.data
        : [];

    setConversations(items);

    if (
      requestedConversationId &&
      items.some(
        (item: Conversation) =>
          String(item.conversationId) ===
          requestedConversationId,
      )
    ) {
      setActiveConversationId(requestedConversationId);
    }
  } catch (error) {
    console.error(
      'Failed to load conversations:',
      error,
    );

    setConversations([]);

    toast.error('Failed to load conversations');
  } finally {
    setLoadingConversations(false);
  }
}, [requestedConversationId]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response =
  await messagesApi.getConversation(conversationId);

const responseData = response.data;

const conversationData =
  responseData?.data ?? responseData;

setMessages(
  Array.isArray(conversationData?.messages)
    ? conversationData.messages
    : [],
);
      await messagesApi.markRead(conversationId);
      setConversations((current) =>
        current.map((conversation) =>
          String(conversation.conversationId) === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    } catch {
      setMessages([]);
      toast.error('Failed to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    void loadConversation(activeConversationId);
  }, [activeConversationId, loadConversation]);

  useEffect(() => {
    if (!socket || !activeConversationId) return;

    socket.emit('join_conversation', {
      conversationId: activeConversationId,
    });

    const handleNewMessage = (message: ChatMessage) => {
      if (String(message.conversationId) === activeConversationId) {
        setMessages((current) =>
          current.some((item) => item._id === message._id)
            ? current
            : [...current, message],
        );
        void messagesApi.markRead(activeConversationId);
      }
      void loadConversations();
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave_conversation', {
        conversationId: activeConversationId,
      });
    };
  }, [socket, activeConversationId, loadConversations]);

  useEffect(() => {
    const total = conversations.reduce(
      (sum, conversation) => sum + (conversation.unreadCount || 0),
      0,
    );
    setUnreadMessages(total);
  }, [conversations, setUnreadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || !activeConversationId || sending) return;

    setSending(true);
    setText('');

    try {
      const response = await messagesApi.sendMessage(
  activeConversationId,
  content,
);

const responseData = response.data;

const sentMessage =
  responseData?.data ?? responseData;

if (!sentMessage?._id) {
  throw new Error('Invalid message response');
}

setMessages((current) =>
  current.some(
    (message) => message._id === sentMessage._id,
  )
    ? current
    : [...current, sentMessage],
);
      await loadConversations();
    } catch {
      setText(content);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex h-screen pt-16">
        <aside className="flex w-80 flex-col border-r border-border bg-white">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold text-royal-blue">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <PageLoader />
            ) : conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <MessageSquare size={40} className="mb-3 text-muted" />
                <p className="font-medium text-royal-blue">No conversations yet</p>
                <p className="mt-1 text-sm text-muted">
                  Booking conversations will appear here.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const other = conversation.otherUser;
                if (!other?._id) return null;
                const selected =
                  String(conversation.conversationId) === activeConversationId;

                return (
                  <button
                    key={String(conversation.conversationId)}
                    type="button"
                    onClick={() =>
                      setActiveConversationId(
                        String(conversation.conversationId),
                      )
                    }
                    className={`flex w-full items-center gap-3 border-b border-border p-4 text-left transition-colors hover:bg-royal-50 ${
                      selected ? 'bg-royal-50' : ''
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-royal-blue text-xs font-bold text-white">
                      {other.avatar ? (
                        <img
                          src={other.avatar}
                          alt={`${other.firstName || ''} ${other.lastName || ''}`.trim()}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(other.firstName || '', other.lastName || '')
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {other.firstName} {other.lastName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-royal-blue px-1 text-xs text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          {!activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessageSquare size={48} className="mb-4 text-muted" />
              <h3 className="mb-2 font-semibold text-royal-blue">
                Select a conversation
              </h3>
              <p className="text-sm text-muted">
                Choose a booking conversation from the left.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border bg-white p-4">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-royal-blue text-xs font-bold text-white">
                  {activeConversation.otherUser.avatar ? (
                    <img
                      src={activeConversation.otherUser.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(
                      activeConversation.otherUser.firstName || '',
                      activeConversation.otherUser.lastName || '',
                    )
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {activeConversation.otherUser.firstName}{' '}
                    {activeConversation.otherUser.lastName}
                  </p>
                  <p className="text-xs text-muted">Booking conversation</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingMessages ? (
                  <PageLoader />
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-muted">
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((message) => {
                    const isMine = idOf(message.senderId) === user?._id;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm lg:max-w-md ${
                            isMine
                              ? 'rounded-br-sm bg-royal-blue text-white'
                              : 'rounded-bl-sm border border-border bg-white'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={`mt-1 text-xs ${
                              isMine ? 'text-blue-200' : 'text-muted'
                            }`}
                          >
                            {timeAgo(message.createdAt)}
                            <span className="mx-1">•</span>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-3 border-t border-border bg-white p-4">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  maxLength={5000}
                  placeholder="Type a message..."
                  className="input flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!text.trim() || sending}
                  className="btn-primary rounded-xl px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? 'Sending...' : <Send size={18} />}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-royal-blue">Loading chat...</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

