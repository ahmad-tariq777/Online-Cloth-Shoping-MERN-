import React, { useState, useEffect, useCallback } from 'react';
import api, { errorMessage } from '../../api/client';
import '../../css/UserManagement.css';

const EMPTY_FORM = { fullName: '', email: '', password: '', role: 'customer' };

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'super_admin':
      return 'badge-super-admin';
    case 'moderator':
      return 'badge-moderator';
    case 'customer':
      return 'badge-customer';
    default:
      return 'badge-default';
  }
};

const formatRole = (role) => role.replace('_', ' ').toUpperCase();

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const notify = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/auth/users', { params });
      setUsers(data.users);
    } catch (error) {
      notify(errorMessage(error, 'Failed to fetch users'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const runAction = async (request, failure) => {
    try {
      const { data } = await request();
      notify(data.message, 'success');
      await fetchUsers();
      return true;
    } catch (error) {
      notify(errorMessage(error, failure), 'error');
      return false;
    }
  };

  const handleRoleChange = (user, role) =>
    runAction(() => api.put(`/auth/users/${user._id}/role`, { role }), 'Failed to update role');

  const handleToggleStatus = (user) =>
    runAction(() => api.put(`/auth/users/${user._id}/toggle-status`), 'Failed to toggle user status');

  const confirmDelete = async () => {
    const user = pendingDelete;
    setPendingDelete(null);
    await runAction(() => api.delete(`/auth/users/${user._id}`), 'Failed to delete user');
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditor({ mode: 'create' });
  };

  const openEdit = (user) => {
    setForm({ fullName: user.fullName, email: user.email, password: '', role: user.role });
    setFormError('');
    setEditor({ mode: 'edit', user });
  };

  const closeEditor = () => {
    if (!saving) setEditor(null);
  };

  const handleFormChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = { fullName: form.fullName, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;

      const { data } =
        editor.mode === 'create'
          ? await api.post('/auth/users', payload)
          : await api.put(`/auth/users/${editor.user._id}`, payload);

      notify(data.message, 'success');
      setEditor(null);
      await fetchUsers();
    } catch (error) {
      setFormError(errorMessage(error, 'Failed to save user'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="user-management-container">Loading users...</div>;
  }

  return (
    <div className="user-management-container">
      <div className="um-header">
        <div>
          <h1>User Management</h1>
          <p className="subtitle">Create, search, update and remove users</p>
        </div>
        <button className="btn btn-create" onClick={openCreate}>
          + Add User
        </button>
      </div>

      {message && <div className={`alert alert-${messageType}`}>{message}</div>}

      <div className="um-toolbar">
        <input
          type="search"
          className="um-search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="um-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="moderator">Moderators</option>
        </select>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>{formatRole(user.role)}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {user.role === 'customer' && (
                        <button className="btn btn-promote" onClick={() => handleRoleChange(user, 'moderator')}>
                          Make Moderator
                        </button>
                      )}
                      {user.role === 'moderator' && (
                        <button className="btn btn-demote" onClick={() => handleRoleChange(user, 'customer')}>
                          Make Customer
                        </button>
                      )}
                      <button className="btn btn-edit" onClick={() => openEdit(user)}>
                        Edit
                      </button>
                      <button
                        className={`btn ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-delete" onClick={() => setPendingDelete(user)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>{users.filter((u) => u.role === 'moderator').length}</h3>
          <p>Moderators</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter((u) => u.role === 'customer').length}</h3>
          <p>Customers</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter((u) => u.isActive).length}</h3>
          <p>Active Users</p>
        </div>
      </div>

      {editor && (
        <div className="um-modal-backdrop" onClick={closeEditor}>
          <form className="um-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2>{editor.mode === 'create' ? 'Add User' : 'Edit User'}</h2>

            <label>
              Full name
              <input value={form.fullName} onChange={handleFormChange('fullName')} maxLength={100} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={handleFormChange('email')} required />
            </label>
            <label>
              {editor.mode === 'create' ? 'Password' : 'New password (leave blank to keep current)'}
              <input
                type="password"
                value={form.password}
                onChange={handleFormChange('password')}
                required={editor.mode === 'create'}
                autoComplete="new-password"
              />
            </label>
            <label>
              Role
              <select value={form.role} onChange={handleFormChange('role')}>
                <option value="customer">Customer</option>
                <option value="moderator">Moderator</option>
              </select>
            </label>

            {formError && <p className="um-form-error">{formError}</p>}

            <div className="um-modal-actions">
              <button type="button" className="btn btn-cancel" onClick={closeEditor} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-create" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {pendingDelete && (
        <div className="um-modal-backdrop" onClick={() => setPendingDelete(null)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete user</h2>
            <p>
              Delete <strong>{pendingDelete.fullName}</strong> ({pendingDelete.email})? Their reviews and
              notifications will be removed too. Their order history is kept. This cannot be undone.
            </p>
            <div className="um-modal-actions">
              <button className="btn btn-cancel" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button className="btn btn-delete-solid" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
