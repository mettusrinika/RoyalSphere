import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { ACCESS_KEY, API_URL } from "./api";

const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, "");

let socket: Socket | null = null;

export async function getSocket() {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  if (!token) return null;

  if (!socket) {
    socket = io(`${SOCKET_URL}/socket`, {
      transports: ["websocket"],
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 15000,
    });
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
