import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_EVENTS = 50

export default function useWebSocket(url) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const [events, setEvents] = useState([])
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const retryCount = useRef(0)
  const mountedRef = useRef(true)
  const closedIntentionally = useRef(false)
  const urlRef = useRef(url)

  urlRef.current = url

  const connect = useCallback(() => {
    if (!mountedRef.current || closedIntentionally.current) return
    if (wsRef.current) {
      try { wsRef.current.close() } catch { /* noop */ }
      wsRef.current = null
    }

    let ws
    try {
      ws = new WebSocket(urlRef.current)
    } catch {
      scheduleReconnect()
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      retryCount.current = 0
      setConnected(true)
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg.type === 'ping') {
          try { ws.send(JSON.stringify({ type: 'pong' })) } catch { /* noop */ }
          return
        }
        if (msg.type === 'snapshot') {
          const entry = { type: 'snapshot', data: msg.data, ts: msg.ts || Date.now() }
          if (!mountedRef.current) return
          setEvents([entry])
          setLastEvent(entry)
          return
        }
        const entry = { type: msg.type, data: msg.data ?? msg.payload, ts: msg.ts || Date.now() }
        if (!mountedRef.current) return
        setLastEvent(entry)
        setEvents((prev) => [...prev.slice(-(MAX_EVENTS - 1)), entry])
      } catch { /* ignore malformed frames */ }
    }

    ws.onclose = () => {
      if (!mountedRef.current || closedIntentionally.current) return
      setConnected(false)
      scheduleReconnect()
    }

    ws.onerror = () => {
      try { ws.close() } catch { /* noop */ }
    }
  }, [])

  function scheduleReconnect() {
    if (!mountedRef.current || closedIntentionally.current) return
    retryCount.current += 1
    const delay = Math.min(3000 * 2 ** Math.min(retryCount.current - 1, 4), 30000) + Math.random() * 500
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    reconnectTimer.current = setTimeout(connect, delay)
  }

  useEffect(() => {
    mountedRef.current = true
    closedIntentionally.current = false
    connect()
    return () => {
      mountedRef.current = false
      closedIntentionally.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
      const ws = wsRef.current
      wsRef.current = null
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        try { ws.close() } catch { /* noop */ }
      }
      setConnected(false)
    }
  }, [connect])

  return { connected, lastEvent, events }
}
