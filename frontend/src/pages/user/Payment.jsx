import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

const PAYMENT_LABELS = {
  pending: 'Pay on delivery',
  awaiting_verification: 'Awaiting verification',
  verified: 'Verified',
  failed: 'Failed',
  refunded: 'Refunded',
};

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch order', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <p>Loading order...</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Order {order.orderNumber}</h2>
      <p><strong>Status:</strong> {order.status}</p>
      <p><strong>Total:</strong> Rs. {order.total.toLocaleString()}</p>
      <p><strong>Payment method:</strong> {order.payment.method.replace(/_/g, ' ')}</p>
      <p><strong>Payment status:</strong> {PAYMENT_LABELS[order.payment.status] || order.payment.status}</p>
      <button onClick={() => navigate('/orders')} style={{ marginTop: 20 }}>View my orders</button>
    </div>
  );
};

export default Payment;
