import { Navigate } from 'react-router-dom'

function Cart() {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: '#f7fbf4' }}>
      <h1 style={{ margin: 0, color: '#1d4b27' }}>Cart</h1>
      <p style={{ color: '#5a6e5f' }}>Your cart items will appear here.</p>
    </div>
  )
}

export default Cart
