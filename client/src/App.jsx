import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Cart from './pages/Cart'
import Admin from './pages/Admin'

function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  const rawUser = localStorage.getItem('user')

  if (!token || !rawUser) {
    return <Navigate to="/login" replace />
  }

  try {
    const user = JSON.parse(rawUser)
    if (user.role !== 'admin') {
      return <Navigate to="/" replace />
    }
  } catch {
    return <Navigate to="/login" replace />
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
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
