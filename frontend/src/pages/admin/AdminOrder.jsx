import React, { useEffect, useState, useCallback } from 'react';
import api, { assetUrl } from '../../api/client';
import {
  FiRefreshCw,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCheck,
  FiTruck,
  FiPackage,
  FiClock,
  FiAlertCircle,
  FiDollarSign,
  FiShoppingBag,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiCircle,
} from 'react-icons/fi';
import '../../css/AdminOrders.css';

const STATUS_CONFIG = {
  Pending:            { colorClass: 'status--pending',   icon: <FiClock /> },
  'In Process':       { colorClass: 'status--process',   icon: <FiRefreshCw /> },
  Confirmed:          { colorClass: 'status--confirmed', icon: <FiCheck /> },
  Shipped:            { colorClass: 'status--shipped',   icon: <FiTruck /> },
  Delivered:          { colorClass: 'status--delivered', icon: <FiPackage /> },
  Rejected:           { colorClass: 'status--rejected',  icon: <FiX /> },
  Cancelled:          { colorClass: 'status--cancelled', icon: <FiAlertCircle /> },
  'Refund Requested': { colorClass: 'status--refund',    icon: <FiDollarSign /> },
};

const PAYMENT_CONFIG = {
  cash_on_delivery: { label: 'COD',       colorClass: 'pay--cod',       icon: <FiDollarSign /> },
  easypaisa:        { label: 'EasyPaisa', colorClass: 'pay--easypaisa', icon: <FiShoppingBag /> },
  jazzcash:         { label: 'JazzCash',  colorClass: 'pay--jazzcash',  icon: <FiShoppingBag /> },
};

const VALID_TRANSITIONS = {
  Pending:            ['In Process', 'Rejected', 'Cancelled'],
  'In Process':       ['Confirmed', 'Rejected', 'Cancelled'],
  Confirmed:          ['Shipped', 'Cancelled'],
  Shipped:            ['Delivered'],
  Delivered:          [],
  Rejected:           [],
  Cancelled:          [],
  'Refund Requested': ['Cancelled'],
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { colorClass: '', icon: <FiCircle /> };
  return (
    <span className={`ao-status-badge ${cfg.colorClass}`}>
      <span className="badge-icon">{cfg.icon}</span>
      {status}
    </span>
  );
};

const PaymentBadge = ({ method }) => {
  const cfg = PAYMENT_CONFIG[method] || { label: method, colorClass: 'pay--default', icon: <FiDollarSign /> };
  return (
    <span className={`ao-payment-badge ${cfg.colorClass}`}>
      <span className="badge-icon">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

const AdminOrders = () => {
  const [orders, setOrders]           = useState([]);
  const [stats, setStats]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter]           = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus]     = useState('');
  const [adminNote, setAdminNote]     = useState('');
  const [trackingNum, setTrackingNum] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAction, setPaymentAction] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [updatingId, setUpdatingId]   = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter !== 'All') params.set('status', filter);
      if (paymentFilter !== 'All') params.set('paymentMethod', paymentFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await api.get(`/orders/admin/all?${params}`);
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
      setStats(res.data.stats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, paymentFilter, search, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async () => {
    if (!statusModal || !newStatus) return;
    setUpdatingId(statusModal.orderId);
    try {
      await api.put(`/orders/${statusModal.orderId}/status`, {
        status: newStatus,
        adminNotes: adminNote || undefined,
        trackingNumber: trackingNum || undefined,
      });

      setStatusModal(null);
      setNewStatus('');
      setAdminNote('');
      setTrackingNum('');
      fetchOrders();
      if (selectedOrder?._id === statusModal.orderId) {
        setSelectedOrder(o => ({ ...o, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentVerify = async () => {
    if (!paymentModal) return;
    setUpdatingId(paymentModal._id);
    try {
      const verified = paymentAction === 'verify';
      await api.put(`/orders/${paymentModal._id}/payment-verify`, {
        verified,
        rejectionReason: rejectReason || undefined,
      });

      setPaymentModal(null);
      setPaymentAction('');
      setRejectReason('');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const statMap = {};
  stats.forEach(s => { statMap[s._id] = { count: s.count, revenue: s.revenue }; });
  const totalRevenue     = stats.reduce((s, x) => s + (x.revenue || 0), 0);
  const pendingCount     = statMap['Pending']?.count || 0;
  const deliveredRevenue = statMap['Delivered']?.revenue || 0;

  return (
    <div className="ao-container">

      <div className="ao-topbar">
        <div className="ao-topbar-title">
          <h1 className="ao-title">Order Management</h1>
          <p className="ao-subtitle">{total} total orders</p>
        </div>
        <button className="btn-refresh" onClick={fetchOrders}>
          <FiRefreshCw className="btn-icon" /> Refresh
        </button>
      </div>

      <div className="ao-stats-row">
        <div className="ao-stat-card">
          <FiDollarSign className="stat-icon" />
          <div>
            <span className="ao-stat-label">Total Revenue</span>
            <span className="ao-stat-value">PKR {totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="ao-stat-card ao-stat-card--pending">
          <FiClock className="stat-icon" />
          <div>
            <span className="ao-stat-label">Pending</span>
            <span className="ao-stat-value">{pendingCount}</span>
          </div>
        </div>
        <div className="ao-stat-card">
          <FiPackage className="stat-icon" />
          <div>
            <span className="ao-stat-label">Delivered Revenue</span>
            <span className="ao-stat-value">PKR {deliveredRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="ao-stat-card">
          <FiShoppingBag className="stat-icon" />
          <div>
            <span className="ao-stat-label">Total Orders</span>
            <span className="ao-stat-value">{total}</span>
          </div>
        </div>
      </div>

      <div className="ao-filters">
        <div className="ao-search-wrap">
          <FiSearch className="ao-search-icon" />
          <input
            type="text"
            className="ao-search-input"
            placeholder="Search order # or user ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="ao-filter-select"
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}
        >
          <option value="All">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          className="ao-filter-select"
          value={paymentFilter}
          onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}
        >
          <option value="All">All Payments</option>
          <option value="cash_on_delivery">Cash on Delivery</option>
          <option value="easypaisa">EasyPaisa</option>
          <option value="jazzcash">JazzCash</option>
        </select>
      </div>

      <div className="ao-table-wrap">
        {loading ? (
          <div className="ao-loading">
            {[1,2,3,4,5].map(i => <div key={i} className="ao-skeleton" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="ao-empty">
            <FiFileText className="ao-empty-icon" />
            <p>No orders found</p>
          </div>
        ) : (
          <table className="ao-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>User</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr
                  key={order._id}
                  className={`ao-row ${selectedOrder?._id === order._id ? 'ao-row--selected' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="ao-cell-num">
                    <span className="ao-mono">
                      {order.orderNumber?.split('-').slice(-1)[0] || order._id.slice(-6)}
                    </span>
                  </td>
                  <td>
                    <span className="ao-mono ao-small">{order.userId?.slice(-8)}</span>
                  </td>
                  <td>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                  <td className="ao-mono">PKR {order.total?.toLocaleString()}</td>
                  <td><PaymentBadge method={order.payment?.method} /></td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="ao-date">
                    {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="ao-action-btns">
                      {VALID_TRANSITIONS[order.status]?.length > 0 && (
                        <button
                          className="ao-btn-primary"
                          onClick={() => { setStatusModal({ orderId: order._id, currentStatus: order.status, userId: order.userId }); setNewStatus(''); }}
                        >
                          Update
                        </button>
                      )}
                      {['easypaisa', 'jazzcash'].includes(order.payment?.method) &&
                        order.payment?.status === 'awaiting_verification' && (
                          <button
                            className="ao-btn-payment"
                            onClick={() => setPaymentModal(order)}
                          >
                            <FiCheck className="btn-icon-sm" /> Verify
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="ao-pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="ao-page-btn"
          >
            <FiChevronLeft />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`ao-page-btn ${page === p ? 'ao-page-btn--active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="ao-page-btn"
          >
            <FiChevronRight />
          </button>
        </div>
      )}

      {selectedOrder && (
        <div className="ao-panel-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="ao-detail-panel" onClick={e => e.stopPropagation()}>
            <div className="ao-panel-header">
              <div>
                <h3 className="ao-panel-title">Order Details</h3>
                <p className="ao-panel-sub ao-mono">{selectedOrder.orderNumber}</p>
              </div>
              <button className="ao-panel-close" onClick={() => setSelectedOrder(null)}>
                <FiX />
              </button>
            </div>

            <div className="ao-panel-body">
              <div className="ao-panel-badges">
                <StatusBadge status={selectedOrder.status} />
                <PaymentBadge method={selectedOrder.payment?.method} />
              </div>

              <div className="ao-panel-section">
                <h4 className="ao-section-title">
                  <FiPhone className="section-icon" /> Customer
                </h4>
                <p className="ao-mono ao-small">ID: {selectedOrder.userId}</p>
                <p>{selectedOrder.deliveryDetails?.fullName}</p>
                <p>{selectedOrder.deliveryDetails?.phoneNumber}</p>
              </div>

              <div className="ao-panel-section">
                <h4 className="ao-section-title">
                  <FiMapPin className="section-icon" /> Address
                </h4>
                <p>{selectedOrder.deliveryDetails?.address}</p>
                <p>{selectedOrder.deliveryDetails?.city}, {selectedOrder.deliveryDetails?.postalCode}</p>
                <p>{selectedOrder.deliveryDetails?.country}</p>
              </div>

              <div className="ao-panel-section">
                <h4 className="ao-section-title">
                  <FiShoppingBag className="section-icon" /> Items
                </h4>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="ao-panel-item">
                    {item.image && <img src={assetUrl(item.image)} alt="" className="ao-panel-img" />}
                    <span className="ao-item-name">{item.name}{item.size ? ` (${item.size})` : ''}</span>
                    <span className="ao-item-qty">×{item.quantity}</span>
                    <span className="ao-item-price ao-mono">
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="ao-panel-section ao-pricing">
                <div className="ao-pr"><span>Subtotal</span><span>PKR {selectedOrder.subtotal?.toLocaleString()}</span></div>
                <div className="ao-pr"><span>Delivery</span><span>PKR {selectedOrder.deliveryFee || 150}</span></div>
                {selectedOrder.discount > 0 && (
                  <div className="ao-pr ao-pr--discount"><span>Discount</span><span>- PKR {selectedOrder.discount}</span></div>
                )}
                <div className="ao-pr ao-pr--total">
                  <span>Total</span><span>PKR {selectedOrder.total?.toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.payment && (
                <div className="ao-panel-section">
                  <h4 className="ao-section-title">
                    <FiDollarSign className="section-icon" /> Payment
                  </h4>
                  <div className={`ao-pay-status ao-pay-status--${selectedOrder.payment.status}`}>
                    {selectedOrder.payment.status?.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  {selectedOrder.payment.transactionId && (
                    <p className="ao-mono ao-small">TXN: {selectedOrder.payment.transactionId}</p>
                  )}
                  {selectedOrder.payment.senderNumber && (
                    <p>Sender: {selectedOrder.payment.senderNumber}</p>
                  )}
                </div>
              )}

              {selectedOrder.statusHistory?.length > 0 && (
                <div className="ao-panel-section">
                  <h4 className="ao-section-title">
                    <FiFileText className="section-icon" /> Timeline
                  </h4>
                  <div className="ao-timeline">
                    {[...selectedOrder.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="ao-tl-item">
                        <div className="ao-tl-dot" />
                        <div className="ao-tl-content">
                          <span className="ao-tl-status">{h.status}</span>
                          <span className="ao-tl-time">
                            {new Date(h.changedAt).toLocaleString('en-PK', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {h.note && <span className="ao-tl-note">{h.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {VALID_TRANSITIONS[selectedOrder.status]?.length > 0 && (
                <button
                  className="ao-btn-panel-update"
                  onClick={() => setStatusModal({
                    orderId: selectedOrder._id,
                    currentStatus: selectedOrder.status,
                    userId: selectedOrder.userId,
                  })}
                >
                  Update Status <FiChevronRight className="btn-icon-sm" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="ao-modal-overlay" onClick={() => setStatusModal(null)}>
          <div className="ao-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ao-modal-header">
              <h3>Update Order Status</h3>
              <button className="ao-modal-close" onClick={() => setStatusModal(null)}>
                <FiX />
              </button>
            </div>
            <p className="ao-modal-sub">
              Current: <StatusBadge status={statusModal.currentStatus} />
            </p>

            <div className="ao-status-options">
              {VALID_TRANSITIONS[statusModal.currentStatus]?.map(s => {
                const cfg = STATUS_CONFIG[s] || {};
                return (
                  <div
                    key={s}
                    className={`ao-status-option ${cfg.colorClass} ${newStatus === s ? 'ao-status-option--selected' : ''}`}
                    onClick={() => setNewStatus(s)}
                  >
                    <span className="status-option-icon">{cfg.icon}</span>
                    {s}
                  </div>
                );
              })}
            </div>

            {newStatus === 'Shipped' && (
              <input
                className="ao-modal-input"
                type="text"
                placeholder="Tracking number (optional)"
                value={trackingNum}
                onChange={e => setTrackingNum(e.target.value)}
              />
            )}

            <textarea
              className="ao-modal-textarea"
              placeholder="Admin note (optional)"
              rows={3}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
            />

            <div className="ao-modal-actions">
              <button className="ao-btn-secondary" onClick={() => setStatusModal(null)}>Cancel</button>
              <button
                className="ao-btn-confirm"
                onClick={handleStatusUpdate}
                disabled={!newStatus || updatingId}
              >
                {updatingId ? 'Updating…' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentModal && (
        <div className="ao-modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="ao-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ao-modal-header">
              <h3>Verify Payment</h3>
              <button className="ao-modal-close" onClick={() => setPaymentModal(null)}>
                <FiX />
              </button>
            </div>
            <div className="ao-pv-details">
              <div className="ao-pv-row"><span>Method</span><PaymentBadge method={paymentModal.payment?.method} /></div>
              <div className="ao-pv-row"><span>Amount</span><span className="ao-mono">PKR {paymentModal.total?.toLocaleString()}</span></div>
              <div className="ao-pv-row"><span>Transaction ID</span><span className="ao-mono">{paymentModal.payment?.transactionId || '—'}</span></div>
              <div className="ao-pv-row"><span>Sender</span><span>{paymentModal.payment?.senderNumber || '—'}</span></div>
            </div>
            <div className="ao-verify-options">
              <div
                className={`ao-verify-option ao-verify-option--approve ${paymentAction === 'verify' ? 'selected' : ''}`}
                onClick={() => setPaymentAction('verify')}
              >
                <FiCheck className="verify-icon" /> Approve Payment
              </div>
              <div
                className={`ao-verify-option ao-verify-option--reject ${paymentAction === 'reject' ? 'selected' : ''}`}
                onClick={() => setPaymentAction('reject')}
              >
                <FiX className="verify-icon" /> Reject Payment
              </div>
            </div>
            {paymentAction === 'reject' && (
              <input
                className="ao-modal-input"
                type="text"
                placeholder="Rejection reason (shown to customer)"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            )}
            <div className="ao-modal-actions">
              <button className="ao-btn-secondary" onClick={() => setPaymentModal(null)}>Cancel</button>
              <button
                className={`ao-btn-confirm ${paymentAction === 'reject' ? 'ao-btn-confirm--danger' : ''}`}
                onClick={handlePaymentVerify}
                disabled={!paymentAction || updatingId}
              >
                {updatingId ? '…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;