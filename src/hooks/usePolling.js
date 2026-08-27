import { useEffect, useState } from 'react'

export default function usePolling(fetchFn, intervalMs = 10000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    let timer

    async function poll() {
      try {
        const result = await fetchFn()
        if (active) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    poll()
    timer = setInterval(poll, intervalMs)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [fetchFn, intervalMs])

  return { data, loading, error }
}
