import React, { useState } from 'react';
import api, { errorMessage } from '../../api/client';
import '../../css/Checkout.css';

const CITIES_PK = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad','Bahawalpur','Sargodha','Sukkur'];

const steps = ['Delivery', 'Payment', 'Review'];

const Checkout = ({ cartItems = [], onSuccess }) => {
  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState({
    fullName: '', phoneNumber: '', address: '', city: '', postalCode: '', country: 'Pakistan',
  });
  const [payment, setPayment] = useState({
    method: '', transactionId: '', senderNumber: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const DELIVERY_FEE = 150;
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const validateDelivery = () => {
    const e = {};
    if (!delivery.fullName.trim() || delivery.fullName.length < 3) e.fullName = 'Full name required (min 3 chars)';
    if (!/^(\+92|0)[0-9]{10}$/.test(delivery.phoneNumber)) e.phoneNumber = 'Enter valid Pakistani number (e.g. 03001234567)';
    if (!delivery.address.trim() || delivery.address.length < 10) e.address = 'Please enter a full address (min 10 chars)';
    if (!delivery.city) e.city = 'Select your city';
    if (!/^[0-9]{5}$/.test(delivery.postalCode)) e.postalCode = 'Enter 5-digit postal code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e = {};
    if (!payment.method) e.method = 'Select a payment method';
    if (['easypaisa', 'jazzcash'].includes(payment.method)) {
      if (!payment.transactionId.trim()) e.transactionId = 'Transaction ID is required';
      if (!/^(\+92|0)[0-9]{10}$/.test(payment.senderNumber)) e.senderNumber = 'Enter valid sender phone number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateDelivery()) return;
    if (step === 1 && !validatePayment()) return;
    setStep(s => s + 1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        items: cartItems.map(({ productId, _id, quantity, size }) => ({ productId: productId || _id, quantity, size: size || undefined })),
        deliveryDetails: delivery,
        payment: {
          method: payment.method,
          transactionId: payment.transactionId || undefined,
          senderNumber: payment.senderNumber || undefined,
          notes: payment.notes || undefined,
        },
      });

      setOrderResult(res.data.order);
      onSuccess?.(res.data.order);
    } catch (err) {
      alert(errorMessage(err, 'Failed to place order. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (orderResult) {
    return (
      <div className="checkout-success">
        <div className="success-icon-wrap">
          <div className="success-circle">✓</div>
          <div className="success-ripple" />
        </div>
        <h2>Order Placed!</h2>
        <p className="success-order-num">Order #{orderResult.orderNumber}</p>
        {orderResult.paymentMethod !== 'cash_on_delivery' && (
          <div className="success-notice">
            📋 Your <strong>{orderResult.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'}</strong> payment is being verified by our team. We'll notify you shortly.
          </div>
        )}
        {orderResult.paymentMethod === 'cash_on_delivery' && (
          <div className="success-notice cod">
            💵 Pay <strong>PKR {orderResult.total?.toLocaleString()}</strong> when your order is delivered.
          </div>
        )}
        <button className="btn-primary" onClick={() => window.location.href = '/orders'}>
          View Order History
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">

      <div className="stepper">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`stepper-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="stepper-circle">
                {i < step ? '✓' : i + 1}
              </div>
              <span className="stepper-label">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`stepper-line ${i < step ? 'done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <div className="checkout-section">
          <h2 className="section-heading">Delivery Details</h2>
          <div className="form-grid">
            <div className="form-group span-2">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ahmed Ali"
                value={delivery.fullName}
                onChange={e => setDelivery(d => ({ ...d, fullName: e.target.value }))}
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="03001234567"
                value={delivery.phoneNumber}
                onChange={e => setDelivery(d => ({ ...d, phoneNumber: e.target.value }))}
                className={errors.phoneNumber ? 'error' : ''}
              />
              {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
            </div>

            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                placeholder="44000"
                maxLength={5}
                value={delivery.postalCode}
                onChange={e => setDelivery(d => ({ ...d, postalCode: e.target.value.replace(/\D/,'') }))}
                className={errors.postalCode ? 'error' : ''}
              />
              {errors.postalCode && <span className="field-error">{errors.postalCode}</span>}
            </div>

            <div className="form-group span-2">
              <label>Address</label>
              <textarea
                placeholder="House/Flat No., Street, Area"
                rows={3}
                value={delivery.address}
                onChange={e => setDelivery(d => ({ ...d, address: e.target.value }))}
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>

            <div className="form-group">
              <label>City</label>
              <select
                value={delivery.city}
                onChange={e => setDelivery(d => ({ ...d, city: e.target.value }))}
                className={errors.city ? 'error' : ''}
              >
                <option value="">Select city…</option>
                {CITIES_PK.map(c => <option key={c}>{c}</option>)}
              </select>
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label>Country</label>
              <input type="text" value="Pakistan" readOnly className="readonly" />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="checkout-section">
          <h2 className="section-heading">Payment Method</h2>

          <div className="payment-methods">
            {[
              { id: 'cash_on_delivery', icon: '💵', title: 'Cash on Delivery', desc: 'Pay when your order arrives' },
              { id: 'easypaisa',        icon: '📱', title: 'EasyPaisa',          desc: 'Transfer to 03XX-XXXXXXX' },
              { id: 'jazzcash',         icon: '🎵', title: 'JazzCash',           desc: 'Transfer to 03XX-XXXXXXX' },
            ].map(m => (
              <div
                key={m.id}
                className={`payment-card ${payment.method === m.id ? 'selected' : ''}`}
                onClick={() => setPayment(p => ({ ...p, method: m.id }))}
              >
                <div className="payment-card-icon">{m.icon}</div>
                <div className="payment-card-body">
                  <div className="payment-card-title">{m.title}</div>
                  <div className="payment-card-desc">{m.desc}</div>
                </div>
                <div className="payment-card-radio">
                  {payment.method === m.id && <div className="radio-dot" />}
                </div>
              </div>
            ))}
          </div>
          {errors.method && <span className="field-error">{errors.method}</span>}

          {['easypaisa', 'jazzcash'].includes(payment.method) && (
            <div className="digital-payment-form">
              <div className="payment-instructions">
                <h4>How to pay via {payment.method === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'}</h4>
                <ol>
                  <li>Open your {payment.method === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} app</li>
                  <li>Send <strong>PKR {total.toLocaleString()}</strong> to <strong>0300-1234567</strong></li>
                  <li>Enter the transaction ID from your receipt below</li>
                </ol>
              </div>

              <div className="form-group">
                <label>Transaction ID <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. TXN123456789"
                  value={payment.transactionId}
                  onChange={e => setPayment(p => ({ ...p, transactionId: e.target.value }))}
                  className={errors.transactionId ? 'error' : ''}
                />
                {errors.transactionId && <span className="field-error">{errors.transactionId}</span>}
              </div>

              <div className="form-group">
                <label>Sender Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  placeholder="03001234567"
                  value={payment.senderNumber}
                  onChange={e => setPayment(p => ({ ...p, senderNumber: e.target.value }))}
                  className={errors.senderNumber ? 'error' : ''}
                />
                {errors.senderNumber && <span className="field-error">{errors.senderNumber}</span>}
              </div>

              <div className="form-group">
                <label>Additional Notes (optional)</label>
                <input
                  type="text"
                  placeholder="Any extra info for verification"
                  value={payment.notes}
                  onChange={e => setPayment(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <p className="verification-notice">
                ⏱ Digital payments are verified within 30–60 minutes. Your order will be processed after verification.
              </p>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="checkout-section">
          <h2 className="section-heading">Review Order</h2>

          <div className="review-grid">
            <div className="review-block">
              <h4>Items ({cartItems.length})</h4>
              {cartItems.map((item, i) => (
                <div key={i} className="review-item">
                  {item.image && <img src={item.image} alt={item.name} className="review-item-img" />}
                  <span className="review-item-name">{item.name} {item.size && `(${item.size})`}</span>
                  <span className="review-item-qty">×{item.quantity}</span>
                  <span className="review-item-price">PKR {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="review-block">
              <h4>Delivery To</h4>
              <p className="review-name">{delivery.fullName}</p>
              <p>{delivery.address}</p>
              <p>{delivery.city}, {delivery.postalCode}</p>
              <p>{delivery.country}</p>
              <p>📞 {delivery.phoneNumber}</p>
            </div>
          </div>

          <div className="order-summary">
            <div className="summary-row"><span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span></div>
            <div className="summary-row"><span>Delivery Fee</span><span>PKR {DELIVERY_FEE}</span></div>
            <div className="summary-row total-row"><span>Total</span><span>PKR {total.toLocaleString()}</span></div>
            <div className="summary-row">
              <span>Payment</span>
              <span className="payment-chip">
                {payment.method === 'cash_on_delivery' ? '💵 Cash on Delivery' :
                 payment.method === 'easypaisa' ? '📱 EasyPaisa' : '🎵 JazzCash'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="checkout-nav">
        {step > 0 && (
          <button className="btn-back" onClick={() => setStep(s => s - 1)}>
            ← Back
          </button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn-primary" onClick={handleNext}>
            Continue →
          </button>
        ) : (
          <button className="btn-place-order" onClick={handlePlaceOrder} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Placing Order…' : '🛒 Place Order'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Checkout;