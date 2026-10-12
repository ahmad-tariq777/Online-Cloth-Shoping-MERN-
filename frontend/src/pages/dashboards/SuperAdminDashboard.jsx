import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl, errorMessage, getStoredUser } from '../../api/client';
import {
  Zap,
  Home,
  Lock,
  Users,
  Package,
  Shirt,
  DollarSign,
  BarChart2,
  ShieldCheck,
  PlusCircle,
  Image,
  ClipboardList,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import '../../css/SuperAdminDashboard.css';

const ROLE_META = {
  super_admin: { colorClass: 'role--super',     label: 'Super Admin' },
  moderator:   { colorClass: 'role--moderator', label: 'Moderator'   },
  customer:    { colorClass: 'role--user',      label: 'Customer'    },
};

const STATUS_META = {
  Pending:            { colorClass: 'sst-pending',    label: 'Pending'    },
  'In Process':       { colorClass: 'sst-processing', label: 'Processing' },
  Confirmed:          { colorClass: 'sst-processing', label: 'Confirmed'  },
  Shipped:            { colorClass: 'sst-shipped',    label: 'Shipped'    },
  Delivered:          { colorClass: 'sst-delivered',  label: 'Delivered'  },
  Rejected:           { colorClass: 'sst-cancelled',  label: 'Rejected'   },
  Cancelled:          { colorClass: 'sst-cancelled',  label: 'Cancelled'  },
  'Refund Requested': { colorClass: 'sst-pending',    label: 'Refund'     },
};

const RoleBadge = ({ role }) => {
  const meta = ROLE_META[role] || { colorClass: '', label: role };
  return <span className={`sa-role-badge ${meta.colorClass}`}>{meta.label}</span>;
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { colorClass: '', label: status };
  return <span className={`sa-status-badge ${meta.colorClass}`}>{meta.label}</span>;
};

export default function SuperAdminDashboard() {
  const currentUser = getStoredUser() || {};
  const [users,         setUsers]         = useState([]);
  const [orders,        setOrders]        = useState([]);
  const [statusStats,   setStatusStats]   = useState([]);
  const [totalOrders,   setTotalOrders]   = useState(0);
  const [products,      setProducts]      = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('overview');

  const fetchAll = async () => {
    try {
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/orders/admin/all', { params: { limit: 20 } }),
        api.get('/products', { params: { limit: 20 } }),
      ]);
      setUsers(usersRes.data.users);
      setOrders(ordersRes.data.orders);
      setStatusStats(ordersRes.data.stats);
      setTotalOrders(ordersRes.data.stats.reduce((sum, item) => sum + item.count, 0));
      setProducts(productsRes.data.products);
      setTotalProducts(productsRes.data.total);
    } catch {
      setUsers([]); setOrders([]); setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const statusCount = (status) => statusStats.find(item => item._id === status)?.count || 0;
  const totalRevenue = statusStats.find(item => item._id === 'Delivered')?.revenue || 0;

  const stats = [
    {
      label:      'Total Users',
      value:      users.length,
      icon:       <Users size={22} />,
      colorClass: 'sa-stat--indigo',
      sub:        `${users.filter(u => u.role === 'moderator').length} moderators`,
    },
    {
      label:      'Total Orders',
      value:      totalOrders,
      icon:       <Package size={22} />,
      colorClass: 'sa-stat--amber',
      sub:        `${statusCount('Pending')} pending`,
    },
    {
      label:      'Total Products',
      value:      totalProducts,
      icon:       <Shirt size={22} />,
      colorClass: 'sa-stat--emerald',
      sub:        'across all categories',
    },
    {
      label:      'Revenue',
      value:      `Rs. ${totalRevenue.toLocaleString()}`,
      icon:       <DollarSign size={22} />,
      colorClass: 'sa-stat--rose',
      sub:        `${statusCount('Delivered')} delivered`,
    },
  ];

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert(errorMessage(err, 'Failed to update user role'));
    }
  };

  const TABS = ['overview', 'users', 'orders', 'products'];
  const TAB_META = {
    overview: { label: 'Overview',  icon: <BarChart2 size={15} /> },
    users:    { label: 'Users',     icon: <Users     size={15} /> },
    orders:   { label: 'Orders',    icon: <Package   size={15} /> },
    products: { label: 'Products',  icon: <Shirt     size={15} /> },
  };

  const QUICK_ACTIONS = [
    { label: 'User Management',     icon: <Users size={18} />,         to: '/super-admin/users'       },
    { label: 'All Orders',          icon: <ClipboardList size={18} />, to: '/admin/orders'            },
    { label: 'Product List',        icon: <Shirt size={18} />,         to: '/products'                },
    { label: 'Add Product',         icon: <PlusCircle size={18} />,    to: '/add-product'             },
    { label: 'Carousel Admin',      icon: <Image size={18} />,         to: '/admin/carousel'          },
    { label: 'Moderator Dashboard', icon: <ShieldCheck size={18} />,   to: '/moderator/dashboard'     },
  ];

  return (
    <div className="sa-page">

      <div className="sa-topbar">
        <div className="sa-topbar-left">
          <div className="sa-super-badge">
            <Zap size={13} />
            Super Admin
          </div>
          <h1 className="sa-title">Admin Panel</h1>
        </div>
        <div className="sa-topbar-right">
          <span className="sa-user-label">
            <Lock size={13} />
            {currentUser.fullName || currentUser.email}
          </span>
          <Link to="/" className="sa-home-btn">
            <Home size={14} /> Home
          </Link>
        </div>
      </div>

      <div className="sa-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`sa-stat-card ${s.colorClass}`}>
            <div className="sa-stat-icon-wrap">{s.icon}</div>
            <div className="sa-stat-body">
              <p className="sa-stat-value">{loading ? '—' : s.value}</p>
              <p className="sa-stat-label">{s.label}</p>
              <p className="sa-stat-sub">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="sa-tabs-wrap">
        <div className="sa-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`sa-tab ${activeTab === tab ? 'sa-tab--active' : ''}`}
            >
              {TAB_META[tab].icon}
              {TAB_META[tab].label}
            </button>
          ))}
        </div>
      </div>

      <div className="sa-content">

        {activeTab === 'overview' && (
          <div className="sa-overview">
            <div className="sa-two-col">

              <div className="sa-card">
                <h3 className="sa-card-title">
                  <Users size={16} className="sa-card-title-icon" />
                  User Role Distribution
                </h3>
                {Object.entries(ROLE_META).map(([role, meta]) => {
                  const count = users.filter(u => u.role === role).length;
                  const pct   = users.length ? Math.round((count / users.length) * 100) : 0;
                  return (
                    <div key={role} className="sa-dist-row">
                      <span className={`sa-dist-dot ${meta.colorClass}`} />
                      <span className="sa-dist-label">{meta.label}</span>
                      <div className="sa-dist-bar">
                        <div className={`sa-dist-fill ${meta.colorClass}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="sa-dist-count">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="sa-card">
                <h3 className="sa-card-title">
                  <TrendingUp size={16} className="sa-card-title-icon" />
                  Order Status Overview
                </h3>
                {Object.entries(STATUS_META).map(([status, meta]) => {
                  const count = statusCount(status);
                  const pct   = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
                  return (
                    <div key={status} className="sa-dist-row">
                      <span className={`sa-dist-dot ${meta.colorClass}`} />
                      <span className="sa-dist-label">{meta.label}</span>
                      <div className="sa-dist-bar">
                        <div className={`sa-dist-fill ${meta.colorClass}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="sa-dist-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sa-card">
              <h3 className="sa-card-title">
                <Zap size={16} className="sa-card-title-icon" />
                Admin Quick Actions
              </h3>
              <div className="sa-quick-grid">
                {QUICK_ACTIONS.map((l, i) => (
                  <Link key={i} to={l.to} className="sa-quick-item">
                    <span className="sa-quick-icon">{l.icon}</span>
                    <span className="sa-quick-label">{l.label}</span>
                    <ChevronRight size={13} className="sa-quick-arrow" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="sa-card">
            <div className="sa-card-header">
              <h3 className="sa-card-title">
                <Users size={16} className="sa-card-title-icon" />
                All Users ({users.length})
              </h3>
              <Link to="/super-admin/users" className="sa-view-all">
                Full Management <ExternalLink size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="sa-loading">
                {[1,2,3,4,5].map(i => <div key={i} className="sa-skeleton" />)}
              </div>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Change Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 20).map(u => (
                      <tr key={u._id} className="sa-tr">
                        <td className="sa-td">{u.fullName || '—'}</td>
                        <td className="sa-td sa-td--muted">{u.email}</td>
                        <td className="sa-td"><RoleBadge role={u.role} /></td>
                        <td className="sa-td">
                          {u._id !== currentUser.userId && (
                            <select
                              value={u.role}
                              onChange={e => updateUserRole(u._id, e.target.value)}
                              className="sa-select"
                            >
                              <option value="customer">Customer</option>
                              <option value="moderator">Moderator</option>
                            </select>
                          )}
                          {u._id === currentUser.userId && (
                            <span className="sa-you-label">You</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="sa-card">
            <div className="sa-card-header">
              <h3 className="sa-card-title">
                <Package size={16} className="sa-card-title-icon" />
                All Orders ({totalOrders})
              </h3>
              <Link to="/admin/orders" className="sa-view-all">
                Manage All <ExternalLink size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="sa-loading">
                {[1,2,3,4,5].map(i => <div key={i} className="sa-skeleton" />)}
              </div>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 20).map(o => (
                      <tr key={o._id} className="sa-tr">
                        <td className="sa-td sa-td--mono">{o.orderNumber}</td>
                        <td className="sa-td">{o.deliveryDetails?.fullName || '—'}</td>
                        <td className="sa-td sa-td--amount">Rs. {o.total?.toLocaleString()}</td>
                        <td className="sa-td"><StatusBadge status={o.status} /></td>
                        <td className="sa-td sa-td--muted">
                          {new Date(o.createdAt).toLocaleDateString('en-PK', {
                            day: 'numeric', month: 'short',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="sa-card">
            <div className="sa-card-header">
              <h3 className="sa-card-title">
                <Shirt size={16} className="sa-card-title-icon" />
                All Products ({totalProducts})
              </h3>
              <Link to="/add-product" className="sa-add-btn">
                <PlusCircle size={14} /> Add Product
              </Link>
            </div>
            {loading ? (
              <div className="sa-loading">
                {[1,2,3,4,5].map(i => <div key={i} className="sa-skeleton" />)}
              </div>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Gender</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 20).map(p => (
                      <tr key={p._id} className="sa-tr">
                        <td className="sa-td">
                          <img
                            src={assetUrl(p.images?.[0])}
                            alt={p.name}
                            className="sa-product-thumb"
                          />
                        </td>
                        <td className="sa-td">{p.name}</td>
                        <td className="sa-td sa-td--amount">Rs. {(p.effectivePrice ?? p.price)?.toLocaleString()}</td>
                        <td className="sa-td sa-td--muted">{p.gender || '—'}</td>
                        <td className="sa-td">
                          <Link to={`/product/${p._id}`} className="sa-link">
                            View <ExternalLink size={11} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}