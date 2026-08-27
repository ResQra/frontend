import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_EVENTS = 50

export default function useWebSocket(url) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const [events, setEvents] = useState([])
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const urlRef = useRef(url)

  urlRef.current = url

  const connect = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close() } catch {}
    }

    const ws = new WebSocket(urlRef.current)
    wsRef.current = ws

    ws.onopen = () => {
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
          ws.send(JSON.stringify({ type: 'pong' }))
          return
        }
        if (msg.type === 'snapshot') {
          setEvents([{ type: 'snapshot', data: msg.data, ts: Date.now() }])
          setLastEvent({ type: 'snapshot', data: msg.data })
          return
        }
        const entry = { type: msg.type, data: msg.data, ts: Date.now() }
        setLastEvent(entry)
        setEvents((prev) => [...prev.slice(-(MAX_EVENTS - 1)), entry])
      } catch {}
    }

    ws.onclose = () => {
      setConnected(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  return { connected, lastEvent, events }
}
