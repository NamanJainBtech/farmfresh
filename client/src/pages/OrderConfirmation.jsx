import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderConfirmation.css';

function OrderConfirmation() {
  const navigate = useNavigate();

  return (
    <div className="order-confirmation-page">
      <div className="order-confirmation-card">
        <div className="confirmation-icon" aria-hidden="true">
          ✓
        </div>
        <h1>Order Confirmed!</h1>
        <p>
          Thanks for shopping with FarmFresh. We’re packing your favorites and
          will deliver in the slot you selected.
        </p>
        <div className="confirmation-actions">
          <button
            type="button"
            className="confirmation-btn primary"
            onClick={() => navigate('/order-history')}
          >
            View Order History
          </button>
          <button
            type="button"
            className="confirmation-btn ghost"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
