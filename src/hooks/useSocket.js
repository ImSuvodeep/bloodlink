/**
 * useSocket — Socket.IO client hook (Production Edition)
 *
 * Creates and manages a single socket connection to the dispatch server.
 * JWT token is attached to the handshake auth so the server can identify the user type.
 * Reconnects automatically if the connection drops.
 */

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../api/client.js';

// In dev: Vite proxies /socket.io → localhost:3001 via vite.config.js
// In prod: React is served by Express on the same origin, so '' works
const SERVER_URL = import.meta.env.VITE_SOCKET_URL || '';

let sharedSocket = null;

export function getSocket() {
  if (!sharedSocket || sharedSocket.disconnected) {
    sharedSocket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 15,
      transports: ['websocket', 'polling'],
      auth: { token: getToken() }, // JWT for server-side user identification
    });
  }
  return sharedSocket;
}

/** Call this after login to refresh the socket with the new JWT */
export function resetSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}

/**
 * useSocket(eventHandlers)
 * @param {Object} handlers – { 'event:name': (payload) => {} }
 * @returns {Object} { socket, emit }
 */
export function useSocket(handlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler);
    }

    // If socket was already connected before handlers attached, fire 'connect' now
    if (socket.connected && handlers['connect']) {
      handlers['connect']();
    }

    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        socket.off(event, handler);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = useCallback((event, payload) => {
    if (socketRef.current) socketRef.current.emit(event, payload);
  }, []);

  return { socket: socketRef, emit };
}
