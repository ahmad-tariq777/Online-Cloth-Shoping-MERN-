import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errorMessage, saveSession } from '../../api/client';
import "../../css/Signup.css";

const validateEmail = (val) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(val);
const validatePassword = (val) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(val);

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showMessage('', '');

    if (fullName.trim().length < 2) return showMessage('Full name must be at least 2 characters long', 'error');
    if (!validateEmail(email)) return showMessage('Please enter a valid email address', 'error');
    if (!validatePassword(password))
      return showMessage(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
        'error'
      );
    if (password !== confirmPassword) return showMessage('Passwords do not match', 'error');

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      showMessage('Account created successfully!', 'success');
      saveSession(data);
      window.dispatchEvent(new Event('userUpdated'));
      setTimeout(() => navigate('/'), 800);
    } catch (error) {
      showMessage(
        error.response
          ? errorMessage(error, 'Registration failed')
          : 'Network error. Please check your connection and try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          type="text"
          placeholder="Full Name"
          required
          disabled={isLoading}
          maxLength={100}
        />
        <br />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
          disabled={isLoading}
        />
        <br />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
          disabled={isLoading}
        />
        <br />
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          placeholder="Confirm Password"
          required
          disabled={isLoading}
        />
        <br />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      {message && (
        <p style={{ color: messageType === 'success' ? 'green' : 'red', marginTop: '10px' }}>
          {message}
        </p>
      )}

      <p style={{ fontSize: '0.85em', color: '#666', marginTop: '10px' }}>
        Password must contain at least 8 characters, one uppercase, one lowercase, one number,
        and one special character (@$!%*?&#).
      </p>
      <p style={{ marginTop: '12px', fontSize: '0.9em' }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
};

export default Signup;
