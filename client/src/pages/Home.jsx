import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addToCart, getCart, getPublicCategories, getPublicProducts, updateCartItem } from '../../services/api'
import Header from '../components/Header'
import Notification from '../components/Notification'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState(['all'])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cartQuantities, setCartQuantities] = useState({})
  const [notification, setNotification] = useState({ message: '', type: 'success' })
  const [actionProductId, setActionProductId] = useState('')
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (!token || !storedUser) return null

    try {
      return JSON.parse(storedUser)
    } catch {
      return null
    }
  })

  useEffect(() => {
    const loadHomeData = async () => {
      setLoadingProducts(true)
      setLoadError('')
      try {
        const [productData, categoryData] = await Promise.all([
          getPublicProducts(),
          getPublicCategories(),
        ])

        setProducts(productData)
        setCategories(categoryData)
      } catch (error) {
        setLoadError(error.response?.data?.message || 'Failed to load fruits')
      } finally {
        setLoadingProducts(false)
      }
    }

    loadHomeData()
  }, [])

  useEffect(() => {
    const loadCartQuantities = async () => {
      if (!currentUser) {
        setCartQuantities({})
        return
      }

      try {
        const cart = await getCart()
        const quantityMap = {}
        cart.items.forEach((item) => {
          quantityMap[item.product._id] = item.quantity
        })
        setCartQuantities(quantityMap)
      } catch {
        setCartQuantities({})
      }
    }

    loadCartQuantities()
  }, [currentUser])

  const filteredProducts = useMemo(() => {
    const searchValue = searchText.trim().toLowerCase()
    const allSelected = selectedCategories.includes('all')

    return products.filter((product) => {
      const matchesSearch = product.name?.toLowerCase().includes(searchValue)
      const matchesCategory = allSelected || selectedCategories.includes(product.category)
      return matchesSearch && matchesCategory
    })
  }, [products, searchText, selectedCategories])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCurrentUser(null)
  }

  const handleCategoryToggle = (categoryName) => {
    if (categoryName === 'all') {
      setSelectedCategories(['all'])
      return
    }

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((item) => item !== 'all')

      if (withoutAll.includes(categoryName)) {
        const updated = withoutAll.filter((item) => item !== categoryName)
        return updated.length ? updated : ['all']
      }

      return [...withoutAll, categoryName]
    })
  }

  const handleCartClick = () => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    navigate('/cart')
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

  const syncCartQuantities = (cartData) => {
    const quantityMap = {}
    cartData.items.forEach((item) => {
      quantityMap[item.product._id] = item.quantity
    })
    setCartQuantities(quantityMap)
  }

  const setLocalQuantity = (productId, quantity) => {
    setCartQuantities((prev) => {
      const next = { ...prev }
      if (quantity <= 0) {
        delete next[productId]
      } else {
        next[productId] = quantity
      }
      return next
    })
  }

  const handleAddToCart = async (product) => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    if (actionProductId === product._id) return

    const previousQty = cartQuantities[product._id] || 0
    const optimisticQty = previousQty + 1
    setLocalQuantity(product._id, optimisticQty)
    setNotification({ message: '', type: 'success' })
    setActionProductId(product._id)
    try {
      const cartData = await addToCart({ productId: product._id, quantity: 1 })
      syncCartQuantities(cartData)
      setNotification({ message: 'Added to cart', type: 'success' })
    } catch (error) {
      setLocalQuantity(product._id, previousQty)
      setNotification({
        message: error.response?.data?.message || 'Failed to add item to cart',
        type: 'error',
      })
    } finally {
      setActionProductId('')
    }
  }

  const handleIncreaseQuantity = async (product) => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    if (actionProductId === product._id) return

    const currentQty = cartQuantities[product._id] || 0
    if (currentQty >= Number(product.stock)) return
    const nextQty = currentQty + 1

    setLocalQuantity(product._id, nextQty)
    setActionProductId(product._id)
    try {
      const cartData = currentQty
        ? await updateCartItem(product._id, currentQty + 1)
        : await addToCart({ productId: product._id, quantity: 1 })
      syncCartQuantities(cartData)
    } catch (error) {
      setLocalQuantity(product._id, currentQty)
      setNotification({
        message: error.response?.data?.message || 'Failed to update quantity',
        type: 'error',
      })
    } finally {
      setActionProductId('')
    }
  }

  const handleDecreaseQuantity = async (productId) => {
    if (actionProductId === productId) return
    const currentQty = cartQuantities[productId] || 0
    if (currentQty <= 0) return
    const nextQty = currentQty - 1

    setLocalQuantity(productId, nextQty)
    setActionProductId(productId)
    try {
      const cartData = await updateCartItem(productId, nextQty)
      syncCartQuantities(cartData)
      if (currentQty === 1) {
        setNotification({ message: 'Removed from cart', type: 'success' })
      }
    } catch (error) {
      setLocalQuantity(productId, currentQty)
      setNotification({
        message: error.response?.data?.message || 'Failed to update quantity',
        type: 'error',
      })
    } finally {
      setActionProductId('')
    }
  }

  return (
    <div className="home-page">
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: 'success' })}
      />

      <Header
        showSearch
        showFilter
        searchText={searchText}
        onSearchChange={setSearchText}
        showCategoryFilter={showCategoryFilter}
        onToggleCategoryFilter={() => setShowCategoryFilter((prev) => !prev)}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        currentUser={currentUser}
        onCartClick={handleCartClick}
        onLogout={handleLogout}
        onAdminClick={() => navigate('/admin')}
        onAccountClick={handleAccountClick}
        onOrderHistoryClick={handleOrderHistoryClick}
      />

      <section className="home-content">
        <h2>Fresh Fruits</h2>
        {loadError ? <p>{loadError}</p> : null}
        {loadingProducts ? <p>Loading fruits...</p> : null}
        {!loadingProducts && !loadError ? (
          filteredProducts.length ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article key={product._id} className="product-card">
                  <img
                    src={product.image || '/logo.svg'}
                    alt={product.name}
                    className="product-image"
                  />
                  <h3>{product.name}</h3>
                  <p className="product-meta">{product.category}</p>
                  <p className="product-desc">{product.description || 'No description available'}</p>
                  <p className="product-stock">Stock: {product.stock}</p>
                  <div className="product-footer">
                    <p className="product-price">₹ {product.price}/kg</p>
                    {cartQuantities[product._id] ? (
                      <div className="quantity-controls">
                      <button
                        type="button"
                        onClick={() => handleDecreaseQuantity(product._id)}
                      >
                        -
                      </button>
                        <span>{cartQuantities[product._id]}</span>
                        <button
                          type="button"
                          onClick={() => handleIncreaseQuantity(product)}
                          disabled={cartQuantities[product._id] >= Number(product.stock)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="add-cart-btn"
                        onClick={() => handleAddToCart(product)}
                        disabled={Number(product.stock) <= 0}
                      >
                      Add
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>No fruits found.</p>
          )
        ) : null}
      </section>
    </div>
  )
}

export default Home
