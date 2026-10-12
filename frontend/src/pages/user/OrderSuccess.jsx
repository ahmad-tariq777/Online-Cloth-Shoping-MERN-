
import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1>🎉 Thank You for Your Order!</h1>
      <p>Your order has been placed successfully.</p>
      <button onClick={() => navigate('/')} style={styles.button}>
        Go to Home
      </button>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  button: {
    marginTop: '30px',
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#264653',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default OrderSuccess;
