import React, { useEffect, useState, useCallback } from 'react';
import api, { assetUrl, errorMessage } from '../../api/client';
import {
  FiPackage,
  FiClock,
  FiRefreshCw,
  FiCheck,
  FiTruck,
  FiX,
  FiAlertCircle,
  FiDollarSign,
  FiMapPin,
  FiPhone,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiAlertTriangle,
} from 'react-icons/fi';
import '../../css/OrderHistory.css';

const STATUS_CONFIG = {
  Pending:            { colorClass: 'st--pending',   icon: <FiClock />,       label: 'Pending' },
  'In Process':       { colorClass: 'st--process',   icon: <FiRefreshCw />,   label: 'Processing' },
  Confirmed:          { colorClass: 'st--confirmed', icon: <FiCheck />,       label: 'Confirmed' },
  Shipped:            { colorClass: 'st--shipped',   icon: <FiTruck />,       label: 'Shipped' },
  Delivered:          { colorClass: 'st--delivered', icon: <FiPackage />,     label: 'Delivered' },
  Rejected:           { colorClass: 'st--rejected',  icon: <FiX />,           label: 'Rejected' },
  Cancelled:          { colorClass: 'st--cancelled', icon: <FiAlertCircle />, label: 'Cancelled' },
  'Refund Requested': { colorClass: 'st--refund',    icon: <FiDollarSign />,  label: 'Refund' },
};

const PAYMENT_LABELS = {
  cash_on_delivery: { label: 'Cash on Delivery', icon: <FiDollarSign /> },
  easypaisa:        { label: 'EasyPaisa',        icon: <FiShoppingBag /> },
  jazzcash:         { label: 'JazzCash',         icon: <FiShoppingBag /> },
};

const PROGRESS_STEPS = ['Pending', 'In Process', 'Confirmed', 'Shipped', 'Delivered'];
const FILTERS = ['All', 'Pending', 'In Process', 'Confirmed', 'Shipped', 'Delivered', 'Refund Requested', 'Rejected', 'Cancelled'];

const OrderCard = ({ order, onCancel, onRefund }) => {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
  const pm = PAYMENT_LABELS[order.payment?.method] || { label: order.payment?.method, icon: <FiDollarSign /> };
  const canCancel = order.status === 'Pending';
  const canRefund = order.status === 'Delivered';
  const progressIndex = PROGRESS_STEPS.indexOf(order.status);
  const isTerminal = ['Rejected', 'Cancelled'].includes(order.status);

  return (
    <div className={`oh-order-card ${expanded ? 'oh-order-card--expanded' : ''}`}>

      <div className="oh-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="oh-header-left">
          <div className="oh-order-num">
            <span className="oh-hash">#</span>
            {order.orderNumber || order._id?.slice(-8).toUpperCase()}
          </div>
          <div className="oh-order-date">
            {new Date(order.createdAt).toLocaleDateString('en-PK', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </div>
        </div>
        <div className="oh-header-right">
          <span className={`oh-status-badge ${st.colorClass}`}>
            <span className="oh-badge-icon">{st.icon}</span>
            {st.label}
          </span>
          <div className="oh-order-total">PKR {order.total?.toLocaleString()}</div>
          <span className="oh-expand-arrow">
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </div>
      </div>

      {!isTerminal && (
        <div className="oh-progress">
          {PROGRESS_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className={`oh-progress-step ${i <= progressIndex ? 'oh-progress-step--active' : ''}`}>
                <div className="oh-progress-dot" />
                <span className="oh-progress-label">{step}</span>
              </div>
              {i < PROGRESS_STEPS.length - 1 && (
                <div className={`oh-progress-line ${i < progressIndex ? 'oh-progress-line--active' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {expanded && (
        <div className="oh-details">

          <div className="oh-detail-section">
            <h4 className="oh-section-title">
              <FiShoppingBag className="oh-section-icon" /> Items Ordered
            </h4>
            <div className="oh-items-list">
              {order.items?.map((item, i) => (
                <div key={i} className="oh-item-row">
                  {item.image && (
                    <img src={assetUrl(item.image)} alt={item.name} className="oh-item-img" />
                  )}
                  <div className="oh-item-info">
                    <span className="oh-item-name">{item.name}</span>
                    {item.size && <span className="oh-item-size">{item.size}</span>}
                  </div>
                  <div className="oh-item-qty">×{item.quantity}</div>
                  <div className="oh-item-price">
                    PKR {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="oh-detail-section oh-pricing">
            <div className="oh-price-row"><span>Subtotal</span><span>PKR {order.subtotal?.toLocaleString() || '—'}</span></div>
            <div className="oh-price-row"><span>Delivery Fee</span><span>PKR {order.deliveryFee?.toLocaleString() || 150}</span></div>
            {order.discount > 0 && (
              <div className="oh-price-row oh-price-row--discount">
                <span>Discount</span><span>- PKR {order.discount?.toLocaleString()}</span>
              </div>
            )}
            <div className="oh-price-row oh-price-row--total">
              <span>Total</span><span>PKR {order.total?.toLocaleString()}</span>
            </div>
          </div>

          <div className="oh-detail-grid">
            <div className="oh-detail-section">
              <h4 className="oh-section-title">
                <FiMapPin className="oh-section-icon" /> Delivery Address
              </h4>
              <div className="oh-delivery-info">
                <p className="oh-delivery-name">{order.deliveryDetails?.fullName}</p>
                <p>{order.deliveryDetails?.address}</p>
                <p>{order.deliveryDetails?.city}, {order.deliveryDetails?.postalCode}</p>
                <p>{order.deliveryDetails?.country}</p>
                <p className="oh-delivery-phone">
                  <FiPhone className="oh-phone-icon" />
                  {order.deliveryDetails?.phoneNumber}
                </p>
              </div>
            </div>

            <div className="oh-detail-section">
              <h4 className="oh-section-title">
                <FiDollarSign className="oh-section-icon" /> Payment
              </h4>
              <div className="oh-payment-info">
                <div className="oh-payment-method">
                  <span className="oh-pm-icon">{pm.icon}</span>
                  <span>{pm.label}</span>
                </div>
                <div className={`oh-pay-status oh-pay-status--${order.payment?.status}`}>
                  {order.payment?.status?.replace(/_/g, ' ').toUpperCase()}
                </div>
                {order.payment?.transactionId && (
                  <p className="oh-txn">TXN: {order.payment.transactionId}</p>
                )}
              </div>
            </div>
          </div>

          {order.trackingNumber && (
            <div className="oh-detail-section">
              <h4 className="oh-section-title">
                <FiTruck className="oh-section-icon" /> Tracking
              </h4>
              <div className="oh-tracking-badge">
                <FiTruck className="tracking-icon" /> {order.trackingNumber}
              </div>
            </div>
          )}

          {(canCancel || canRefund) && (
            <div className="oh-actions">
              {canCancel && (
                <button className="oh-btn-cancel" onClick={() => onCancel(order._id)}>
                  <FiX className="oh-cancel-icon" /> Cancel Order
                </button>
              )}
              {canRefund && (
                <button className="oh-btn-cancel" onClick={() => onRefund(order._id)}>
                  <FiDollarSign className="oh-cancel-icon" /> Request Refund
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OrderHistory = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('All');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 8 };
      if (filter !== 'All') params.status = filter;

      const res = await api.get('/orders/my', { params });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      if (err.response?.status === 404) {
        setOrders([]);
      } else {
        setError('Failed to load orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancelOrder = async () => {
    if (!cancelModal) return;
    try {
      await api.delete(`/orders/${cancelModal}`, { data: { reason: cancelReason } });
      setCancelModal(null);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      alert(errorMessage(err, 'Could not cancel order. Please try again.'));
    }
  };

  const handleRefund = async (orderId) => {
    const reason = window.prompt('Please tell us why you want a refund.');
    if (!reason || !reason.trim()) return;
    try {
      await api.post(`/orders/${orderId}/refund-request`, { reason: reason.trim() });
      fetchOrders();
    } catch (err) {
      alert(errorMessage(err, 'Could not request a refund. Please try again.'));
    }
  };

  const totalSpent = orders
    .filter(o => ['Confirmed', 'Shipped', 'Delivered'].includes(o.status))
    .reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="oh-container">

      <div className="oh-header">
        <div className="oh-header-content">
          <h1 className="oh-title">Order History</h1>
          <p className="oh-subtitle">Track and manage all your orders</p>
        </div>
        {totalSpent > 0 && (
          <div className="oh-header-stats">
            <div className="oh-stat-chip">
              <span className="oh-stat-label">Total Spent</span>
              <span className="oh-stat-value">PKR {totalSpent.toLocaleString()}</span>
            </div>
            <div className="oh-stat-chip">
              <span className="oh-stat-label">Orders</span>
              <span className="oh-stat-value">{orders.length}</span>
            </div>
          </div>
        )}
      </div>

      <div className="oh-filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`oh-filter-tab ${filter === f ? 'oh-filter-tab--active' : ''}`}
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="oh-loading">
          {[1, 2, 3].map(i => <div key={i} className="oh-skeleton" />)}
        </div>
      ) : error ? (
        <div className="oh-error">
          <FiAlertTriangle className="oh-error-icon" />
          <p>{error}</p>
          <button className="oh-btn-retry" onClick={fetchOrders}>Try Again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="oh-empty">
          <FiPackage className="oh-empty-icon" />
          <h3>No orders found</h3>
          <p>{filter !== 'All' ? `No ${filter} orders` : "You haven't placed any orders yet"}</p>
        </div>
      ) : (
        <>
          <div className="oh-orders-list">
            {orders.map(order => (
              <OrderCard key={order._id} order={order} onCancel={id => setCancelModal(id)} onRefund={handleRefund} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="oh-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="oh-page-btn"
              >
                <FiChevronLeft /> Prev
              </button>
              <span className="oh-page-info">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="oh-page-btn"
              >
                Next <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {cancelModal && (
        <div className="oh-modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="oh-modal-box" onClick={e => e.stopPropagation()}>
            <div className="oh-modal-header">
              <h3>Cancel Order</h3>
              <button className="oh-modal-close" onClick={() => setCancelModal(null)}>
                <FiX />
              </button>
            </div>
            <p className="oh-modal-desc">Please let us know why you're cancelling this order.</p>
            <select
              className="oh-cancel-select"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            >
              <option value="">Select a reason…</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Found a better price">Found a better price</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Delivery time too long">Delivery time too long</option>
              <option value="Other">Other</option>
            </select>
            <div className="oh-modal-actions">
              <button className="oh-btn-go-back" onClick={() => setCancelModal(null)}>Go Back</button>
              <button
                className="oh-btn-confirm-cancel"
                onClick={handleCancelOrder}
                disabled={!cancelReason}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;