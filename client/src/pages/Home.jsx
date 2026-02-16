import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import './Home.css'

const fruits = [
  { id: 1, name: 'Mango', category: 'Seasonal', price: 120, stock: 'In Stock' },
  { id: 2, name: 'Dragon Fruit', category: 'Exotic', price: 180, stock: 'In Stock' },
  { id: 3, name: 'Banana', category: 'Offers', price: 60, stock: 'Low Stock' },
  { id: 4, name: 'Pineapple', category: 'Seasonal', price: 90, stock: 'In Stock' },
  { id: 5, name: 'Avocado', category: 'Exotic', price: 220, stock: 'In Stock' },
]

const categoryOptions = ['All', 'Seasonal', 'Exotic', 'Offers']

function Home() {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
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

  const filteredFruits = useMemo(() => {
    return fruits.filter((fruit) => {
      const matchesSearch = fruit.name.toLowerCase().includes(searchText.toLowerCase())
      const matchesCategory =
        selectedCategory === 'all' || fruit.category.toLowerCase() === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchText, selectedCategory])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCurrentUser(null)
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
            <img src="/filter.svg" alt="" aria-hidden="true" className="filter-icon" />
            <select
              aria-label="Filter fruits by category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentUser ? (
          <div className="user-actions">
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
      </header>

      <section className="fruit-results">
        <h2>Fresh Fruits</h2>
        {filteredFruits.length === 0 ? (
          <p className="no-results">No fruits found for your search/filter.</p>
        ) : (
          <div className="fruit-grid">
            {filteredFruits.map((fruit) => (
              <article key={fruit.id} className="fruit-card">
                <h3>{fruit.name}</h3>
                <p>{fruit.category}</p>
                <p>Rs {fruit.price}/kg</p>
                <span>{fruit.stock}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
