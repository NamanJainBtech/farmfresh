import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getOrderHistory } from '../../services/api';
import './OrderHistory.css';

const SLOT_LABELS = {
  'slot-6-9': '6:00 AM - 9:00 AM',
  'slot-9-12': '9:00 AM - 12:00 PM',
  'slot-12-17': '12:00 PM - 5:00 PM',
};

function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    async function loadOrders() {
      try {
        setLoading(true);
        setError('');
        const data = await getOrderHistory();
        setOrders(data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

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
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate('/account');
  };

  const handleOrderHistoryClick = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate('/order-history');
  };

  const formatDate = (value) => {
    if (!value) return 'Unknown date';
    return new Date(value).toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusClass = (status) => {
    if (!status) return 'order-status';
    return `order-status order-status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const slotLabel = (slot) => SLOT_LABELS[slot] || slot || 'N/A';

  return (
    <div className="order-history-page">
      <Header
        currentUser={currentUser}
        onCartClick={handleCartClick}
        onLogout={handleLogout}
        onAdminClick={handleAdminClick}
        onAccountClick={handleAccountClick}
        onOrderHistoryClick={handleOrderHistoryClick}
      />

      <section className="order-history-content">
        <div className="order-history-card">
          <div className="order-history-heading">
            <div>
              <p className="order-history-eyebrow">Past orders</p>
              <h1>Order history</h1>
            </div>
            <p className="order-history-subtitle">
              Every order you place with FarmFresh shows up here along with its
              status, delivery slot, and payment method.
            </p>
          </div>

          {error && <p className="order-history-error">{error}</p>}

          {loading ? (
            <p className="order-history-loading">Loading your orders…</p>
          ) : orders.length === 0 ? (
            <div className="order-history-empty">
              You have no past orders. Head over to the homepage to shop fresh
              fruits.
            </div>
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <article key={order._id} className="order-entry">
                  <div className="order-entry-header">
                    <div>
                      <p className="order-id">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="order-date">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className={statusClass(order.status)}>{order.status || 'Unknown'}</span>
                  </div>

                  <div className="order-entry-info">
                    <div className="order-items">
                      {order.items.map((item) => (
                        <span key={`${item.product}-${item.quantity}`}>
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="order-meta">
                      <span className="order-total">₹{order.totalAmount}</span>
                      <span className="order-payment">
                        {order.paymentMethod || 'Cash on Delivery'}
                      </span>
                    </div>
                  </div>
                  <p className="order-slot">
                    Delivery: {order.address} · Slot {slotLabel(order.slot)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default OrderHistory;
