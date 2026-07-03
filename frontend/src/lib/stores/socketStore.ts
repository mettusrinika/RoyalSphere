import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  connect: (token: string) => void;
  disconnect: () => void;
  setUnreadNotifications: (count: number) => void;
  setUnreadMessages: (count: number) => void;
  incrementUnreadMessages: () => void;
  resetUnreadMessages: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  unreadNotifications: 0,
  unreadMessages: 0,

  connect: (token: string) => {
    const existing = get().socket;

    if (existing) {
  const existingAuth =
    typeof existing.auth === 'object'
      ? existing.auth
      : {};

  if (existingAuth.token === token) {
    if (!existing.connected) {
      existing.connect();
    }

    return;
  }

  existing.removeAllListeners();
  existing.disconnect();
}

    const baseUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

    const socket = io(`${baseUrl}/socket`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));
    socket.on('connect_error', () => set({ connected: false }));
    socket.on('notification', () =>
      set((state) => ({
        unreadNotifications: state.unreadNotifications + 1,
      })),
    );

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    socket?.removeAllListeners();
    socket?.disconnect();
    set({ socket: null, connected: false });
  },

  setUnreadNotifications: (count) =>
    set({ unreadNotifications: Math.max(0, count) }),
  setUnreadMessages: (count) =>
    set({ unreadMessages: Math.max(0, count) }),
  incrementUnreadMessages: () =>
    set((state) => ({ unreadMessages: state.unreadMessages + 1 })),
  resetUnreadMessages: () => set({ unreadMessages: 0 }),
}));
