import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../../api/client';
import {
  FiShoppingBag,
  FiShoppingCart,
  FiCreditCard,
  FiClock,
  FiHome,
  FiList,
  FiInfo,
  FiPhone,
  FiPackage,
  FiArrowRight,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import '../../css/UserDashboard.css';

const STATUS_META = {
  Pending:            { colorClass: 'ud-st--pending',    icon: <FiClock />,        label: 'Pending'    },
  'In Process':       { colorClass: 'ud-st--processing', icon: <FiRefreshCw />,    label: 'Processing' },
  Confirmed:          { colorClass: 'ud-st--processing', icon: <FiCheckCircle />,  label: 'Confirmed'  },
  Shipped:            { colorClass: 'ud-st--shipped',    icon: <FiTruck />,        label: 'Shipped'    },
  Delivered:          { colorClass: 'ud-st--delivered',  icon: <FiCheckCircle />,  label: 'Delivered'  },
  Rejected:           { colorClass: 'ud-st--cancelled',  icon: <FiXCircle />,      label: 'Rejected'   },
  Cancelled:          { colorClass: 'ud-st--cancelled',  icon: <FiXCircle />,      label: 'Cancelled'  },
  'Refund Requested': { colorClass: 'ud-st--pending',    icon: <FiClock />,        label: 'Refund'     },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { colorClass: '', icon: null, label: status };
  return (
    <span className={`ud-status-badge ${meta.colorClass}`}>
      <span className="ud-badge-icon">{meta.icon}</span>
      {meta.label}
    </span>
  );
};

const readCartCount = () => {
  try {
    return (JSON.parse(localStorage.getItem('cart')) || []).length;
  } catch {
    return 0;
  }
};

export default function UserDashboard() {
  const user = getStoredUser() || {};
  const [orders,     setOrders]     = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const cartCount = readCartCount();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/orders/my', { params: { limit: 50 } });
        setOrders(res.data.orders);
        setOrderTotal(res.data.total);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalSpent = orders
    .filter(o => !['Cancelled', 'Rejected'].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const stats = [
    { label: 'Total Orders',   value: orderTotal,                                         icon: <FiPackage />,      link: '/orders',  colorClass: 'ud-stat--indigo'  },
    { label: 'Cart Items',     value: cartCount,                                          icon: <FiShoppingCart />, link: '/cart',    colorClass: 'ud-stat--amber'   },
    { label: 'Total Spent',    value: `Rs. ${totalSpent.toLocaleString()}`,               icon: <FiCreditCard />,   link: '/orders',  colorClass: 'ud-stat--emerald' },
    { label: 'Pending Orders', value: orders.filter(o => o.status === 'Pending').length, icon: <FiClock />,        link: '/orders',  colorClass: 'ud-stat--rose'    },
  ];

  const quickActions = [
    { label: 'Browse Shop',   icon: <FiHome />,         to: '/'        },
    { label: 'My Cart',       icon: <FiShoppingCart />, to: '/cart'    },
    { label: 'Order History', icon: <FiList />,         to: '/orders'  },
    { label: 'About Us',      icon: <FiInfo />,         to: '/about'   },
    { label: 'Contact',       icon: <FiPhone />,        to: '/contact' },
  ];

  const recentOrders = orders.slice(0, 5);
  const initials = (user.fullName || user.email || 'U')[0].toUpperCase();

  return (
    <div className="ud-page">

      <div className="ud-header">
        <div className="ud-header-left">
          <div className="ud-avatar">{initials}</div>
          <div className="ud-header-text">
            <h1 className="ud-greeting">
              Welcome back, <span className="ud-name">{user.fullName || 'Shopper'}</span>
            </h1>
            <p className="ud-email">{user.email}</p>
          </div>
        </div>
        <div className="ud-header-actions">
          <Link to="/" className="ud-btn-primary">
            <FiShoppingBag className="ud-btn-icon" /> Shop Now
          </Link>
          <Link to="/orders" className="ud-btn-secondary">
            <FiList className="ud-btn-icon" /> My Orders
          </Link>
        </div>
      </div>

      <div className="ud-stats-grid">
        {stats.map((s, i) => (
          <Link to={s.link} key={i} className={`ud-stat-card ${s.colorClass}`}>
            <div className="ud-stat-icon-wrap">{s.icon}</div>
            <div className="ud-stat-body">
              <div className="ud-stat-value">{loading ? '—' : s.value}</div>
              <div className="ud-stat-label">{s.label}</div>
            </div>
            <FiArrowRight className="ud-stat-arrow" />
          </Link>
        ))}
      </div>

      <div className="ud-section">
        <h2 className="ud-section-title">Quick Actions</h2>
        <div className="ud-quick-grid">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.to} className="ud-quick-card">
              <div className="ud-quick-icon">{a.icon}</div>
              <span className="ud-quick-label">{a.label}</span>
              <FiArrowRight className="ud-quick-arrow" />
            </Link>
          ))}
        </div>
      </div>

      <div className="ud-section">
        <div className="ud-section-header">
          <h2 className="ud-section-title">Recent Orders</h2>
          <Link to="/orders" className="ud-view-all">
            View All <FiArrowRight className="ud-view-all-icon" />
          </Link>
        </div>

        {loading ? (
          <div className="ud-loading">
            {[1,2,3].map(i => <div key={i} className="ud-skeleton" />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="ud-empty-state">
            <FiPackage className="ud-empty-icon" />
            <p className="ud-empty-text">No orders yet. Start shopping!</p>
            <Link to="/" className="ud-btn-primary">
              <FiShoppingBag className="ud-btn-icon" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="ud-order-list">
            {recentOrders.map(order => (
              <div key={order._id} className="ud-order-row">
                <div className="ud-order-left">
                  <p className="ud-order-id">{order.orderNumber}</p>
                  <p className="ud-order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="ud-order-items">
                  {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                </div>
                <div className="ud-order-amount">
                  Rs. {order.total?.toLocaleString()}
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}