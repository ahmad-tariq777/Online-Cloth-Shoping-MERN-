import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api, { errorMessage } from '../../api/client';
import '../../css/font.css';
import '../../css/AddDetails.css';

const PAYMENT_METHODS = [
  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
  { value: 'easypaisa',        label: 'Easypaisa' },
  { value: 'jazzcash',         label: 'JazzCash' },
];

const AddDetails = ({ cartItems, userId, onOrderPlaced }) => {
  const [fullName,       setFullName]       = useState('');
  const [phoneNumber,    setPhoneNumber]    = useState('');
  const [address,        setAddress]        = useState('');
  const [city,           setCity]           = useState('');
  const [postalCode,     setPostalCode]     = useState('');
  const [country,        setCountry]        = useState('Pakistan');

  const [paymentMethod,    setPaymentMethod]    = useState('cash_on_delivery');
  const [transactionId,    setTransactionId]    = useState('');
  const [senderNumber,     setSenderNumber]     = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const isDigital = paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!userId) {
      setError('User is not logged in.');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (isDigital && (!transactionId.trim() || !senderNumber.trim())) {
      setError('Transaction ID and sender number are required for digital payments.');
      return;
    }

    setLoading(true);

    const deliveryDetails = {
      fullName,
      phoneNumber,
      address,
      city,
      postalCode,
      country: country || 'Pakistan',
    };

    const items = cartItems.map(item => ({
      productId: item.productId || item._id,
      quantity:  parseInt(item.quantity, 10),
      size:      item.size || undefined,
    }));

    const payment = {
      method: paymentMethod,
      ...(isDigital && {
        transactionId: transactionId.trim(),
        senderNumber:  senderNumber.trim(),
      }),
    };

    try {
      await api.post('/orders', { items, deliveryDetails, payment });

      setSuccess(true);

      setFullName('');
      setPhoneNumber('');
      setAddress('');
      setCity('');
      setPostalCode('');
      setCountry('Pakistan');
      setPaymentMethod('cash_on_delivery');
      setTransactionId('');
      setSenderNumber('');

      onOrderPlaced();
    } catch (err) {
      setError(errorMessage(err, 'Failed to place order. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-details-form">
      <h2>Delivery Details</h2>

      {error   && <p className="error-message">{error}</p>}
      {success && <p className="success-message">Order placed successfully!</p>}

      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        required
      />
      <input
        type="tel"
        placeholder="Phone Number"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Address"
        value={address}
        onChange={e => setAddress(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="City"
        value={city}
        onChange={e => setCity(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Postal Code"
        value={postalCode}
        onChange={e => setPostalCode(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Country"
        value={country}
        onChange={e => setCountry(e.target.value)}
        required
      />

      <h2>Payment Method</h2>

      <select
        value={paymentMethod}
        onChange={e => setPaymentMethod(e.target.value)}
        required
      >
        {PAYMENT_METHODS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {isDigital && (
        <>
          <input
            type="text"
            placeholder="Transaction ID"
            value={transactionId}
            onChange={e => setTransactionId(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Sender Number (e.g. 03001234567)"
            value={senderNumber}
            onChange={e => setSenderNumber(e.target.value)}
            required
          />
        </>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </form>
  );
};

AddDetails.propTypes = {
  cartItems:    PropTypes.array.isRequired,
  userId:       PropTypes.string.isRequired,
  onOrderPlaced: PropTypes.func.isRequired,
};

export default AddDetails;