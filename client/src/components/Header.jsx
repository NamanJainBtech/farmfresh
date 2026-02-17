import { Link } from 'react-router-dom'
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
}) {
  return (
    <header className="home-header">
      <Link to="/" className="brand-logo" aria-label="FarmFresh Home">
        <img src="/logo.svg" alt="FarmFresh logo" />
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
        <button type="button" className="cart-btn" aria-label="Open cart" onClick={onCartClick}>
          <img src="/cart.svg" alt="Cart" />
        </button>

        {currentUser ? (
          <div className="user-actions">
            {currentUser.role === 'admin' ? (
              <button type="button" className="admin-btn" onClick={onAdminClick}>
                Admin
              </button>
            ) : null}
            <div className="user-pill">
              <img src="/defaultuserimg.svg" alt="Default user avatar" />
              <span>{currentUser.name || 'User'}</span>
            </div>
            <button type="button" className="logout-btn" onClick={onLogout}>
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
  )
}

export default Header
