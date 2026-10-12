import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage, getStoredUser } from '../../api/client';
import {
  FiPackage,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiShoppingBag,
  FiPlusCircle,
  FiImage,
  FiClipboard,
  FiArrowRight,
  FiHome,
  FiUser,
  FiRefreshCw,
  FiXCircle,
} from 'react-icons/fi';
import '../../css/Moderatordashboard.css';

const STATUS_META = {
  Pending:            { colorClass: 'st-pending',    icon: <FiClock />,       label: 'Pending'    },
  'In Process':       { colorClass: 'st-processing', icon: <FiRefreshCw />,   label: 'Processing' },
  Confirmed:          { colorClass: 'st-processing', icon: <FiCheckCircle />, label: 'Confirmed'  },
  Shipped:            { colorClass: 'st-shipped',    icon: <FiTruck />,       label: 'Shipped'    },
  Delivered:          { colorClass: 'st-delivered',  icon: <FiCheckCircle />, label: 'Delivered'  },
  Rejected:           { colorClass: 'st-cancelled',  icon: <FiXCircle />,     label: 'Rejected'   },
  Cancelled:          { colorClass: 'st-cancelled',  icon: <FiXCircle />,     label: 'Cancelled'  },
  'Refund Requested': { colorClass: 'st-pending',    icon: <FiClock />,       label: 'Refund'     },
};

const NEXT_STATUSES = {
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
  const meta = STATUS_META[status] || { colorClass: '', icon: null, label: status };
  return (
    <span className={`mod-status-badge ${meta.colorClass}`}>
      <span className="mod-badge-icon">{meta.icon}</span>
      {meta.label}
    </span>
  );
};

export default function ModeratorDashboard() {
  const user = getStoredUser() || {};
  const [orders,        setOrders]        = useState([]);
  const [statusCounts,  setStatusCounts]  = useState({});
  const [totalOrders,   setTotalOrders]   = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/orders/admin/all', { params: { limit: 10 } }),
        api.get('/products', { params: { limit: 1 } }),
      ]);
      setOrders(ordersRes.data.orders);
      setTotalOrders(ordersRes.data.stats.reduce((sum, item) => sum + item.count, 0));
      setStatusCounts(Object.fromEntries(ordersRes.data.stats.map(item => [item._id, item.count])));
      setTotalProducts(productsRes.data.total);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      await fetchData();
    } catch (err) {
      alert(errorMessage(err, 'Failed to update order status'));
    } finally {
      setUpdatingOrder(null);
    }
  };

  const stats = [
    { label: 'Total Orders',   value: totalOrders,                    icon: <FiPackage />,      colorClass: 'mod-stat--indigo' },
    { label: 'Pending',        value: statusCounts.Pending || 0,      icon: <FiClock />,        colorClass: 'mod-stat--amber'  },
    { label: 'Shipped',        value: statusCounts.Shipped || 0,      icon: <FiTruck />,        colorClass: 'mod-stat--violet' },
    { label: 'Total Products', value: totalProducts,                  icon: <FiShoppingBag />,  colorClass: 'mod-stat--emerald'},
  ];

  const quickLinks = [
    { label: 'Manage Orders', icon: <FiClipboard />, to: '/admin/orders' },
    { label: 'Product List',  icon: <FiShoppingBag />, to: '/products'   },
    { label: 'Add Product',   icon: <FiPlusCircle />, to: '/add-product' },
    { label: 'Carousel',      icon: <FiImage />,      to: '/admin/carousel' },
  ];

  const recentOrders = orders;

  return (
    <div className="mod-page">

      <div className="mod-topbar">
        <div className="mod-topbar-left">
          <div className="mod-role-badge">Moderator</div>
          <h1 className="mod-title">Dashboard</h1>
        </div>
        <div className="mod-topbar-right">
          <span className="mod-user-label">
            <FiUser className="mod-user-icon" />
            {user.fullName || user.email}
          </span>
          <Link to="/" className="mod-home-btn">
            <FiHome className="mod-home-icon" /> Home
          </Link>
        </div>
      </div>

      <div className="mod-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`mod-stat-card ${s.colorClass}`}>
            <div className="mod-stat-icon-wrap">{s.icon}</div>
            <div className="mod-stat-body">
              <p className="mod-stat-value">{loading ? '—' : s.value}</p>
              <p className="mod-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mod-section">
        <h2 className="mod-section-title">Order Status Breakdown</h2>
        <div className="mod-status-breakdown">
          {Object.keys(STATUS_META).map((status) => {
            const count = statusCounts[status] || 0;
            const meta = STATUS_META[status] || {};
            const pct  = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
            return (
              <div key={status} className="mod-status-item">
                <div className="mod-status-top">
                  <span className={`mod-status-dot ${meta.colorClass}`} />
                  <span className="mod-status-name">{meta.label || status}</span>
                  <span className="mod-status-count">{loading ? '—' : count}</span>
                </div>
                <div className="mod-progress-bar">
                  <div
                    className={`mod-progress-fill ${meta.colorClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mod-section">
        <h2 className="mod-section-title">Manage</h2>
        <div className="mod-quick-links">
          {quickLinks.map((l, i) => (
            <Link key={i} to={l.to} className="mod-quick-link">
              <span className="mod-quick-icon">{l.icon}</span>
              <span className="mod-quick-label">{l.label}</span>
              <FiArrowRight className="mod-quick-arrow" />
            </Link>
          ))}
        </div>
      </div>

      <div className="mod-section">
        <div className="mod-section-header">
          <h2 className="mod-section-title">Recent Orders</h2>
          <Link to="/admin/orders" className="mod-view-all">
            View All <FiArrowRight className="mod-view-all-icon" />
          </Link>
        </div>

        {loading ? (
          <div className="mod-loading">
            {[1,2,3,4,5].map(i => <div key={i} className="mod-skeleton" />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="mod-empty-msg">No orders found.</p>
        ) : (
          <div className="mod-table-wrap">
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id} className="mod-tr">
                    <td className="mod-td mod-td--mono">
                      {order.orderNumber}
                    </td>
                    <td className="mod-td">
                      {order.deliveryDetails?.fullName || '—'}
                    </td>
                    <td className="mod-td mod-td--amount">
                      Rs. {order.total?.toLocaleString()}
                    </td>
                    <td className="mod-td mod-td--date">
                      {new Date(order.createdAt).toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short',
                      })}
                    </td>
                    <td className="mod-td">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="mod-td">
                      <select
                        value={order.status}
                        disabled={updatingOrder === order._id}
                        onChange={e => updateOrderStatus(order._id, e.target.value)}
                        className="mod-select"
                      >
                        {[order.status, ...(NEXT_STATUSES[order.status] || [])].map(s => (
                          <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}