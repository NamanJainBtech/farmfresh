import { useEffect } from 'react'
import './Notification.css'

function Notification({ message = '', type = 'success', duration = 2200, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className={`app-notification ${type}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}

export default Notification
