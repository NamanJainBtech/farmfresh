import { Link } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicCategories, getPublicProducts } from '../../services/api'
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

  return (
    <div className="home-page">
      <header className="home-header">
        <Link to="/" className="brand-logo" aria-label="FarmFresh Home">
          <img src="/logo.svg" alt="FarmFresh logo" />
        </Link>

        <div className="search-filter-wrap">
          <div className="search-bar">
            <img src="/search.svg" alt="" aria-hidden="true" className="search-icon" />
            <input
              type="text"
              placeholder="Search fruits..."
              aria-label="Search fruits"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="filter-box">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setShowCategoryFilter((prev) => !prev)}
              aria-label="Filter fruits by categories"
            >
              <img src="/filter.svg" alt="" aria-hidden="true" className="filter-icon" />
              <span>Filter</span>
            </button>

            {showCategoryFilter ? (
              <div className="category-filter-panel">
                <label className="category-check">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes('all')}
                    onChange={() => handleCategoryToggle('all')}
                  />
                  <span>All</span>
                </label>
                {categories.map((category) => (
                  <label key={category._id} className="category-check">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => handleCategoryToggle(category.name)}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="cart-btn" aria-label="Open cart" onClick={handleCartClick}>
            <img src="/cart.svg" alt="Cart" />
          </button>

          {currentUser ? (
            <div className="user-actions">
              {currentUser.role === 'admin' ? (
                <button type="button" className="admin-btn" onClick={() => navigate('/admin')}>
                  Admin
                </button>
              ) : null}
              <div className="user-pill">
                <img src="/defaultuserimg.svg" alt="Default user avatar" />
                <span>{currentUser.name || 'User'}</span>
              </div>
              <button type="button" className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              <img src="/defaultuserimg.svg" alt="Default user avatar" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </header>

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
                  <p className="product-price">Rs {product.price}/kg</p>
                  <p className="product-desc">{product.description || 'No description available'}</p>
                  <p className="product-stock">Stock: {product.stock}</p>
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
