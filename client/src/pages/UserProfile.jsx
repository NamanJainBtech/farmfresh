import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getAddresses, addAddress, deleteAddress } from '../../services/api';
import './UserProfile.css';

function UserProfile() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formValues, setFormValues] = useState({
    line1: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    const loadAddresses = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAddresses();
        setAddresses(data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load addresses');
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [currentUser, navigate]);

  const handleCartClick = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate('/cart');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleAccountClick = () => {
    navigate('/account');
  };

  const handleOrderHistoryClick = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate('/order-history');
  };

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = async (event) => {
    event.preventDefault();
    if (!formValues.line1.trim() || !formValues.city.trim()) {
      setFormError('Line 1 and city are required');
      return;
    }
    try {
      setFormError('');
      setSaving(true);
      const updated = await addAddress(formValues);
      setAddresses(updated);
      setFormValues({ line1: '', city: '', state: '', zip: '', country: '' });
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!addressId) return;
    try {
      setDeleteLoadingId(addressId);
      const updated = await deleteAddress(addressId);
      setAddresses(updated);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete address');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const hasAddresses = addresses.length > 0;

  return (
    <div className="profile-page">
      <Header
        currentUser={currentUser}
        onCartClick={handleCartClick}
        onLogout={handleLogout}
        onAdminClick={handleAdminClick}
        onAccountClick={handleAccountClick}
        onOrderHistoryClick={handleOrderHistoryClick}
      />

      <section className="profile-content">
        <div className="profile-card profile-summary">
          <p className="profile-eyebrow">Account details</p>
          <h1>{currentUser?.name || 'User'}</h1>
          <p className="profile-email">{currentUser?.email || 'No email registered'}</p>
          <div className="profile-actions">
            <button
              type="button"
              className="profile-btn"
              onClick={handleOrderHistoryClick}
            >
              View Order History
            </button>
          </div>
        </div>

        <div className="profile-card profile-addresses">
          <div className="address-header">
            <div>
              <p className="profile-eyebrow">Delivery addresses</p>
              <h2>Where should we deliver?</h2>
            </div>
            <p className="profile-subtitle">
              Add, edit, or delete addresses so we always send fresh fruits your way.
            </p>
          </div>

          {error && <p className="profile-error">{error}</p>}

          {loading ? (
            <p className="profile-loading">Loading addresses…</p>
          ) : (
            <>
              {hasAddresses ? (
                <div className="address-grid">
                  {addresses.map((address) => (
                    <article key={address._id} className="address-card">
                      <div>
                        <p className="address-line">{address.line1}</p>
                        <p className="address-meta">
                          {address.city}, {address.state} {address.zip}
                        </p>
                        <p className="address-meta">{address.country}</p>
                      </div>
                      <button
                        type="button"
                        className="address-delete-btn"
                        onClick={() => handleDeleteAddress(address._id)}
                        disabled={deleteLoadingId === address._id}
                      >
                        {deleteLoadingId === address._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="profile-empty">No addresses saved yet.</p>
              )}

              <form className="address-form" onSubmit={handleAddAddress}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="House / flat / street"
                    value={formValues.line1}
                    onChange={(e) => handleChange('line1', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={formValues.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="State"
                    value={formValues.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="ZIP / PIN"
                    value={formValues.zip}
                    onChange={(e) => handleChange('zip', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Country"
                    value={formValues.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <button type="submit" className="address-submit-btn" disabled={saving}>
                  {saving ? 'Saving address…' : 'Save new address'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default UserProfile;
