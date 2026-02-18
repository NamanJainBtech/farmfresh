import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { getCart, removeCartItem, updateCartItem } from '../../services/api'
import './Cart.css'

function Cart() {
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const [cart, setCart] = useState({ items: [], totalAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [currentUser, setCurrentUser] = useState(() => {
    const rawUser = localStorage.getItem('user')
    if (!rawUser) return null
    try {
      return JSON.parse(rawUser)
    } catch {
      return null
    }
  })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const loadCart = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCart()
      setCart(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCurrentUser(null)
    navigate('/login')
  }

  const handleAccountClick = () => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    navigate('/account')
  }

  const handleOrderHistoryClick = () => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    navigate('/order-history')
  }

  const handleQuantityChange = async (productId, nextQuantity) => {
    if (actionLoadingId === productId) return
    const previousCart = cart
    const optimisticItems = previousCart.items
      .map((item) => {
        if (item.product._id !== productId) return item
        if (nextQuantity <= 0) return null
        return {
          ...item,
          quantity: nextQuantity,
          subtotal: Number(item.product.price || 0) * nextQuantity,
        }
      })
      .filter(Boolean)

    const optimisticTotal = optimisticItems.reduce((sum, item) => sum + item.subtotal, 0)
    setCart({ items: optimisticItems, totalAmount: optimisticTotal })
    setActionLoadingId(productId)
    setError('')
    try {
      const data = await updateCartItem(productId, nextQuantity)
      setCart(data)
    } catch (err) {
      setCart(previousCart)
      setError(err.response?.data?.message || 'Failed to update quantity')
    } finally {
      setActionLoadingId('')
    }
  }

  const handleRemove = async (productId) => {
    if (actionLoadingId === productId) return
    const previousCart = cart
    const optimisticItems = previousCart.items.filter((item) => item.product._id !== productId)
    const optimisticTotal = optimisticItems.reduce((sum, item) => sum + item.subtotal, 0)
    setCart({ items: optimisticItems, totalAmount: optimisticTotal })
    setActionLoadingId(productId)
    setError('')
    try {
      const data = await removeCartItem(productId)
      setCart(data)
    } catch (err) {
      setCart(previousCart)
      setError(err.response?.data?.message || 'Failed to remove item')
    } finally {
      setActionLoadingId('')
    }
  }

  return (
    <div className="cart-page">
      <Header
        currentUser={currentUser}
        onCartClick={() => navigate('/cart')}
        onLogout={handleLogout}
        onAdminClick={() => navigate('/admin')}
        onAccountClick={handleAccountClick}
        onOrderHistoryClick={handleOrderHistoryClick}
      />

      <section className="cart-content">
        <h1>Cart</h1>
        {error ? <p className="cart-error">{error}</p> : null}
        {loading ? <p>Loading cart...</p> : null}

        {!loading ? (
          cart.items.length ? (
            <>
              <div className="cart-list">
                {cart.items.map((item) => (
                  <article key={item.product._id} className="cart-row">
                    <div className="cart-item-main">
                      <img
                        src={item.product.image || '/logo.svg'}
                        alt={item.product.name}
                        className="cart-item-image"
                      />
                      <div>
                        <h3>{item.product.name}</h3>
                        <p>₹ {item.product.price}/kg</p>
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <div className="qty-box">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="cart-subtotal">₹ {item.subtotal}</p>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemove(item.product._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="cart-total">
                <strong>Total: ₹ {cart.totalAmount}</strong>
              </div>
              <div className="cart-checkout-btn-box">
                <button
                  className="cart-checkout-btn"
                  onClick={() => navigate('/checkout')}
                  disabled={cart.items.length === 0}
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          ) : (
            <p>Your cart is empty.</p>
          )
        ) : null}
      </section>
    </div>
  )
}

export default Cart
