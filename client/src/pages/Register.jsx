import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/api'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Password and confirm password must match.')
      return
    }

    setLoading(true)

    try {
      await registerUser({ name, email, password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <img src="/logo.svg" alt="FarmFresh logo" className="register-logo" />
        <h1>Create Account</h1>
        <p>Register to order farm-fresh fruits at your doorstep.</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="registerName">Full Name</label>
          <input
            id="registerName"
            type="text"
            placeholder="Enter full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="registerEmail">Email</label>
          <input
            id="registerEmail"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="registerPassword">Password</label>
          <div className="password-field">
            <input
              id="registerPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <label htmlFor="registerConfirmPassword">Confirm Password</label>
          <div className="password-field">
            <input
              id="registerConfirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error ? <p className="register-error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="register-link-row">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
