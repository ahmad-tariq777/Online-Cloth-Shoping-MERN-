import React, { useEffect, useState } from 'react';
import api from '../../api/client';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleClick = () => {
    setOpen(!open);
    if (!open) {
      fetchNotifications();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={handleClick} style={{ fontSize: '18px' }}>
        🔔
        {notifications.some((n) => !n.read) && <span style={{ color: 'red', fontWeight: 'bold' }}>•</span>}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '30px',
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            padding: '10px',
            width: '300px',
            zIndex: 1000,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h4>Notifications</h4>
          {notifications.length === 0 ? (
            <p>No new notifications</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {notifications.map((n, idx) => (
                <li key={n._id || idx} style={{ marginBottom: '10px' }}>
                  <div>{n.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
