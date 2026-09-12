/**
 * useSocket
 * ---------
 * Returns the shared Socket.IO client instance.
 * Components subscribe to events inside their own useEffect.
 *
 * Example:
 *   const socket = useSocket()
 *   useEffect(() => {
 *     const handler = (payload) => { ... }
 *     socket.on('machine:health-updated', handler)
 *     return () => { socket.off('machine:health-updated', handler) }
 *   }, [socket])
 */

import { getSocket } from '../services/socket'
import type { Socket } from 'socket.io-client'

export function useSocket(): Socket {
  // getSocket() returns the singleton – safe to call on every render
  return getSocket()
}
