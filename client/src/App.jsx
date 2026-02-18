import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Cart from './pages/Cart'
import Admin from './pages/Admin'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import OrderConfirmation from './pages/OrderConfirmation'
import UserProfile from './pages/UserProfile'

function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  const rawUser = localStorage.getItem('user')
  let user

  if (!token || !rawUser) {
    return <Navigate to="/login" replace />
  }

  try {
    user = JSON.parse(rawUser)
  } catch {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      <Route path="/order-history" element={<OrderHistory />} />
      <Route path="/order-confirmation" element={<OrderConfirmation />} />
      <Route path="/account" element={<UserProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
