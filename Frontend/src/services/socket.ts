/**
 * socket.ts
 * ---------
 * Single Socket.IO client instance for the entire LABES frontend.
 *
 * Rules:
 *  • One socket, shared across all components via useSocket().
 *  • Auto-connects when a token exists; disconnects on logout.
 *  • useSocket() returns the same socket reference every time.
 *
 * Usage:
 *   const socket = useSocket()
 *   useEffect(() => {
 *     socket.on('machine:health-updated', handler)
 *     return () => { socket.off('machine:health-updated', handler) }
 *   }, [socket])
 */

import { io, type Socket } from 'socket.io-client'

const API_ROOT =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:5000'

// Normalise so we always connect to the server root (no /api suffix)
const SOCKET_URL = API_ROOT.replace(/\/api\/?$/, '')

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,        // we connect manually after auth
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

/** Call after a successful login to start receiving real-time events. */
export function connectSocket(): void {
  const s = getSocket()
  if (!s.connected) s.connect()
}

/** Call after logout. */
export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect()
}
