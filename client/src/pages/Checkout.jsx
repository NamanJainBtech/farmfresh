import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCart,
  placeOrder,
  getAddresses,
  getDeliverySlots,
  addAddress,
} from '../../services/api';
import './Checkout.css';

const DELIVERY_SLOTS = [
  { id: 'slot-6-9', label: '6:00 AM - 9:00 AM' },
  { id: 'slot-9-12', label: '9:00 AM - 12:00 PM' },
  { id: 'slot-12-17', label: '12:00 PM - 5:00 PM' },
];

const currencySymbol = '₹';

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  return `${currencySymbol}${amount.toFixed(2)}`;
};

function Checkout() {
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [slots, setSlots] = useState(DELIVERY_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    line1: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadCart() {
      try {
        setError('');
        setLoading(true);
        const cartData = await getCart();
        if (isMounted) {
          setCart(cartData);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || 'Failed to load checkout data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    async function loadAddresses() {
      try {
        const addressData = await getAddresses();
        if (!isMounted) return;
        setAddresses(addressData);
        if (!selectedAddress && addressData.length) {
          setSelectedAddress(addressData[0]._id);
        }
      } catch {
        if (isMounted) {
          setAddresses([]);
        }
      }
    }

    async function loadSlots() {
      try {
        const slotData = await getDeliverySlots();
        if (!isMounted) return;
        if (slotData?.length) {
          setSlots(slotData);
        } else {
          setSlots(DELIVERY_SLOTS);
        }
      } catch {
        if (isMounted) {
          setSlots(DELIVERY_SLOTS);
        }
      }
    }

    loadCart();
    loadAddresses();
    loadSlots();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOrder = async () => {
    if (!selectedAddress || !selectedSlot) {
      setError('Please select address and delivery slot');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await placeOrder({
        address: selectedAddress,
        slot: selectedSlot,
        paymentMethod,
      });
      navigate('/order-confirmation');
    } catch (err) {
      setError(err?.response?.data?.message || 'Order failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAddressChange = (field, value) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = async (event) => {
    event.preventDefault();
    if (!newAddress.line1.trim() || !newAddress.city.trim()) {
      setAddressError('Line 1 and city are required');
      return;
    }

    try {
      setAddressError('');
      setAddressSaving(true);
      const updatedAddresses = await addAddress(newAddress);
      setAddresses(updatedAddresses);
      const latest = updatedAddresses[updatedAddresses.length - 1];
      if (latest?._id) {
        setSelectedAddress(latest._id);
      }
      setNewAddress({
        line1: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      });
      setShowNewAddressForm(false);
    } catch (err) {
      setAddressError(err?.response?.data?.message || 'Failed to add address');
    } finally {
      setAddressSaving(false);
    }
  };

  const hasItems = cart.items.length > 0;

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <header className="checkout-header">
          <p className="checkout-eyebrow">Fresh from the farm</p>
          <h1>Checkout</h1>
          <p className="checkout-subtitle">
            Choose delivery details, review your basket, and confirm payment. We will
            pack the juiciest fruits for the slot you pick.
          </p>
        </header>

        {!loading && error && <p className="checkout-error">{error}</p>}

        {loading ? (
          <div className="checkout-loading">Loading checkout details…</div>
        ) : (
          <div className="checkout-grid">
            <div className="checkout-form">
              <section className="checkout-section">
                <div className="section-heading">
                  <span className="section-overline">Delivery</span>
                  <h3>Select address</h3>
                </div>
                <select
                  className="checkout-select"
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                >
                  <option value="">Select address</option>
                  {addresses.map((addr) => (
                    <option key={addr._id} value={addr._id}>
                      {addr.line1}, {addr.city}
                    </option>
                  ))}
                </select>
                <p className="field-helper">We will deliver to this location.</p>
                <div className="address-actions">
                  <button
                    type="button"
                    className="address-toggle-btn"
                    onClick={() => setShowNewAddressForm((prev) => !prev)}
                  >
                    {showNewAddressForm ? 'Hide address form' : 'Add new delivery address'}
                  </button>
                  {showNewAddressForm && (
                    <form className="new-address-form" onSubmit={handleAddAddress}>
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="House / flat / street"
                          value={newAddress.line1}
                          onChange={(e) => handleNewAddressChange('line1', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) => handleNewAddressChange('city', e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="State"
                          value={newAddress.state}
                          onChange={(e) => handleNewAddressChange('state', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="ZIP / PIN"
                          value={newAddress.zip}
                          onChange={(e) => handleNewAddressChange('zip', e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="Country"
                          value={newAddress.country}
                          onChange={(e) =>
                            handleNewAddressChange('country', e.target.value)
                          }
                        />
                      </div>
                      {addressError && <p className="address-error">{addressError}</p>}
                      <button
                        type="submit"
                        className="address-submit-btn"
                        disabled={addressSaving}
                      >
                        {addressSaving ? 'Saving address…' : 'Save address'}
                      </button>
                    </form>
                  )}
                </div>
              </section>

              <section className="checkout-section">
                <div className="section-heading">
                  <span className="section-overline">Delivery</span>
                  <h3>Select slot</h3>
                </div>
                <select
                  className="checkout-select"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                >
                  <option value="">Select slot</option>
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <p className="field-helper">
                  Delivery windows refresh in real time.
                </p>
              </section>

              <section className="checkout-section">
                <div className="section-heading">
                  <span className="section-overline">Payment</span>
                  <h3>Payment method</h3>
                </div>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    <span>
                      Cash on Delivery (COD)
                      <small>Pay when your order arrives</small>
                    </span>
                  </label>
                </div>
              </section>
            </div>

            <aside className="summary-panel">
              <div className="summary-card">
                <div className="summary-header">
                  <h3>Order Summary</h3>
                  <p>
                    {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                <ul className="summary-items">
                  {hasItems ? (
                    cart.items.map((item) => (
                      <li key={item.product._id} className="summary-item">
                        <div>
                          <span>{item.product.name}</span>
                          <small>Qty {item.quantity}</small>
                        </div>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="summary-empty">Your cart is empty.</li>
                  )}
                </ul>

                <div className="summary-total">
                  <span>Total</span>
                  <strong>{formatCurrency(cart.totalAmount)}</strong>
                </div>

                <p className="summary-note">
                  Prices include GST and any applicable delivery charges.
                </p>

                <button
                  type="button"
                  className="place-order-btn"
                  onClick={handleOrder}
                  disabled={!hasItems || !selectedAddress || !selectedSlot}
                >
                  Place order
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;
