import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveSession } from '../../api/client';
import "../../css/Login.css";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  const redirectByRole = (role) => {
    if (role === 'super_admin') navigate('/super-admin/dashboard');
    else if (role === 'moderator') navigate('/moderator/dashboard');
    else navigate('/user/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showMessage('', '');

    if (!email.trim() || !password.trim()) {
      return showMessage('Please enter both email and password', 'error');
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      showMessage(data.message || 'Login successful!', 'success');
      saveSession(data);
      window.dispatchEvent(new Event('userUpdated'));
      setTimeout(() => redirectByRole(data.user?.role), 600);
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;
      if (!error.response) showMessage('Network error. Please check your connection and try again.', 'error');
      else if (status === 429) showMessage('Too many login attempts. Please try again later.', 'error');
      else showMessage(serverMessage || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
          disabled={isLoading}
          autoComplete="email"
        />
        <br />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />
        <br />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && (
        <p style={{ color: messageType === 'success' ? 'green' : 'red', marginTop: '10px', fontWeight: '500' }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: '15px' }}>
        Don&apos;t have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
};

export default Login;