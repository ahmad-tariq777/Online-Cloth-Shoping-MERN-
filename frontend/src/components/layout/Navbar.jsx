import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api, { clearSession, getStoredUser } from '../../api/client';
import '../../css/Navbar.css';
import '../../css/font.css';

const ChevronDown = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,3 5,7 8,3" />
  </svg>
);

const NavDropdown = ({ label, children, isActive }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className={`nav-dropdown-wrapper ${open ? 'open' : ''}`} ref={ref}>
      <button
        className={`nav-dropdown-trigger ${isActive ? 'active' : ''}`}
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        {label}
        <ChevronDown />
      </button>
      <div className="nav-dropdown-panel">
        {children}
      </div>
    </div>
  );
};

const NotificationBell = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error updating notifications:', err);
    }
  };

  const toggleNotifications = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button className="notification-bell" onClick={toggleNotifications} title="Notifications" aria-label="Toggle notifications">
        <svg xmlns="http://www.w3.org/2000/svg" className="icon-bell" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 00-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {notifications.length > 0 && (
              <button className="notification-clear" onClick={markAllRead} aria-label="Mark all notifications as read">
                Mark all read
              </button>
            )}
          </div>
          <ul>
            {loading ? (
              <li className="notification-loading">Loading...</li>
            ) : notifications.length === 0 ? (
              <li className="notification-empty">No notifications</li>
            ) : (
              notifications.map((n, i) => (
                <li key={n._id || i} className="notification-item">{n.message}</li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const ROLE_CONFIG = {
  super_admin: { text: 'Super Admin', color: '#dc3545', textColor: '#fff' },
  moderator:   { text: 'Moderator',   color: '#ffc107', textColor: '#000' },
  customer:    { text: 'Customer',    color: '#28a745', textColor: '#fff' },
};

const RoleBadge = ({ role }) => {
  const config = ROLE_CONFIG[role] || { text: 'User', color: '#6c757d', textColor: '#fff' };
  return (
    <span
      className="role-badge"
      style={{
        backgroundColor: config.color,
        color: config.textColor,
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        marginLeft: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {config.text}
    </span>
  );
};

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M6 6h15l-1.5 9h-13L4 4H2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
  </svg>
);

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const p = location.pathname;

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    syncUser();
    window.addEventListener('userUpdated', syncUser);
    return () => window.removeEventListener('userUpdated', syncUser);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [p]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate('/login');
  };

  const isAdmin = user?.role === 'moderator' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isCustomer = user?.role === 'customer';

  const adminCatalogActive = ['/add-product', '/products'].some((r) => p === r);
  const adminOpsActive = ['/admin/orders', '/admin/carousel', '/admin/drop-collections', '/admin/sales'].some((r) => p === r);
  const shopActive = p.startsWith('/wardrobe') || p === '/cart' || p === '/deals';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">احمد</Link>
      </div>

      <div className="navbar-right">
        <button
          className="hamburger"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            <Link to="/" className={p === '/' ? 'active' : ''}>Home</Link>
            <Link to="/about" className={p === '/about' ? 'active' : ''}>About</Link>
            <Link to="/contact" className={p === '/contact' ? 'active' : ''}>Contact</Link>

            {isCustomer && (
              <NavDropdown label="Shop" isActive={shopActive}>
                <Link to="/wardrobe" className={p.startsWith('/wardrobe') ? 'active' : ''}>Wardrobe</Link>
                <Link to="/cart" className={p === '/cart' ? 'active' : ''}>Cart</Link>
                <Link to="/deals" className={p === '/deals' ? 'active' : ''}>Deals</Link>
              </NavDropdown>
            )}

            {isAdmin && (
              <>
                <NavDropdown label="Catalog" isActive={adminCatalogActive}>
                  <Link to="/add-product" className={p === '/add-product' ? 'active' : ''}>Add Product</Link>
                  <Link to="/products" className={p === '/products' ? 'active' : ''}>Product List</Link>
                </NavDropdown>

                <NavDropdown label="Manage" isActive={adminOpsActive}>
                  <Link to="/admin/orders" className={p === '/admin/orders' ? 'active' : ''}>All Orders</Link>
                  <Link to="/admin/carousel" className={p === '/admin/carousel' ? 'active' : ''}>Carousel</Link>
                  <Link to="/admin/drop-collections" className={p === '/admin/drop-collections' ? 'active' : ''}>Drop Collections</Link>
                  <Link to="/admin/sales" className={p === '/admin/sales' ? 'active' : ''}>Sale Manager</Link>
                </NavDropdown>
              </>
            )}

            {isSuperAdmin && (
              <Link to="/super-admin/users" className={`super-admin-link ${p === '/super-admin/users' ? 'active' : ''}`}>Users</Link>
            )}
          </div>

          <div className="navbar-actions">
            {!user ? (
              <>
                <Link to="/login" className="navbar-button">Login</Link>
                <Link to="/signup" className="navbar-button">Signup</Link>
              </>
            ) : (
              <>
                <span className="navbar-welcome">
                  Welcome, {user.fullName}
                  <RoleBadge role={user.role} />
                </span>

                <Link to="/dashboard" className={`navbar-button dashboard-btn ${p === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>

                {isCustomer && (
                  <>
                    <NotificationBell userId={user.userId} />
                    <Link to="/orders" className={`order-history-button ${p === '/orders' ? 'active' : ''}`}>Orders</Link>
                  </>
                )}

                <button onClick={handleLogout} className="logout-button">Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;