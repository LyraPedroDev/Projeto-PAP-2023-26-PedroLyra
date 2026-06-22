/**
 * Singleton do Socket.IO.
 *
 * USA localhost:5000 — deve ser idêntico à origem do backend.
 * Cookie de sessão Flask só funciona se host/porta forem iguais no login e no socket.
 *
 * autoConnect: false — liga manualmente em App.tsx DEPOIS do login
 * (após o browser guardar o Set-Cookie do /api/login).
 */
import { io } from 'socket.io-client';

const SOCKET_URL = '';

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['polling', 'websocket'], // polling primeiro → cookie chega no handshake
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});
