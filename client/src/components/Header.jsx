import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css'

function Header({
  searchText = '',
  onSearchChange,
  showSearch = false,
  showFilter = false,
  showCategoryFilter = false,
  onToggleCategoryFilter,
  categories = [],
  selectedCategories = ['all'],
  onCategoryToggle,
  currentUser = null,
  onCartClick,
  onLogout,
  onAdminClick,
  onAccountClick,
  onOrderHistoryClick,
}) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const handleCartPress = () => {
    if (onCartClick) {
      onCartClick()
      return
    }
    navigate('/cart')
  }

  const handleAccountPress = () => {
    setMenuOpen(false)
    if (onAccountClick) {
      onAccountClick()
      return
    }
    navigate('/account')
  }

  const handleOrderHistoryPress = () => {
    setMenuOpen(false)
    if (onOrderHistoryClick) {
      onOrderHistoryClick()
      return
    }
    navigate('/order-history')
  }

  const handleLogoutPress = () => {
    setMenuOpen(false)
    onLogout?.()
  }

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev)
  }

  return (
    <header className="home-header">
      <Link to="/" className="brand-logo" aria-label="FarmFresh Home">
        <img src="/logo.svg" alt="FarmFresh logo" className="logo-full" />
      </Link>

      {showSearch ? (
        <div className="search-filter-wrap">
          <div className="search-bar">
            <img src="/search.svg" alt="" aria-hidden="true" className="search-icon" />
            <input
              type="text"
              placeholder="Search fruits..."
              aria-label="Search fruits"
              value={searchText}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
            {showFilter ? (
              <div className="filter-box">
                <button
                  type="button"
                  className="filter-trigger"
                  onClick={onToggleCategoryFilter}
                  aria-label="Filter fruits by categories"
                >
                  <img src="/filter.svg" alt="" aria-hidden="true" className="filter-icon" />
                  <span>Filter</span>
                </button>

                {showCategoryFilter ? (
                  <div className="category-filter-panel">
                    <table className="category-filter-table">
                      <tbody>
                        <tr>
                          <td className="check-col">
                            <input
                              id="category-all"
                              type="checkbox"
                              checked={selectedCategories.includes('all')}
                              onChange={() => onCategoryToggle?.('all')}
                            />
                          </td>
                          <td>
                            <label htmlFor="category-all" className="category-name">
                              All
                            </label>
                          </td>
                        </tr>
                        {categories.map((category) => (
                          <tr key={category._id}>
                            <td className="check-col">
                              <input
                                id={`category-${category._id}`}
                                type="checkbox"
                                checked={selectedCategories.includes(category.name)}
                                onChange={() => onCategoryToggle?.(category.name)}
                              />
                            </td>
                            <td>
                              <label htmlFor={`category-${category._id}`} className="category-name">
                                {category.name}
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="header-actions">
        <button type="button" className="cart-btn" aria-label="Open cart" onClick={handleCartPress}>
          <img src="/cart.svg" alt="Cart" />
        </button>

        {currentUser ? (
          <div className="user-area" ref={menuRef}>
            {currentUser.role === 'admin' ? (
              <button type="button" className="admin-btn" onClick={onAdminClick}>
                Admin
              </button>
            ) : null}
            <button
              type="button"
              className="user-pill"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={toggleMenu}
            >
              <img src="/defaultuserimg.svg" alt="User avatar" />
              <span>{currentUser.name || 'User'}</span>
              <span className="user-pill-arrow">{menuOpen ? '▴' : '▾'}</span>
            </button>
            {menuOpen && (
              <div className="user-menu" role="menu">
                <div className="user-menu-info">
                  <strong>{currentUser.name || 'User'}</strong>
                  <span>{currentUser.email}</span>
                </div>
                <button type="button" className="user-menu-item" onClick={handleAccountPress}>
                  Account details
                </button>
                <button type="button" className="user-menu-item" onClick={handleOrderHistoryPress}>
                  Order history
                </button>
                <button type="button" className="user-menu-item logout" onClick={handleLogoutPress}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-btn">
            <img src="/defaultuserimg.svg" alt="Default user avatar" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header
