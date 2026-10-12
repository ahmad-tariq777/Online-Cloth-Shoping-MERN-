import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AddDetails from './AddDetails';
import { getStoredUser } from '../../api/client';

const AddDetailsWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = location.state?.cartItems || [];
  const userId = getStoredUser()?.userId || null;

  const handleOrderPlaced = () => {
    localStorage.removeItem('cart');
    navigate('/order-success');
  };

  if (!userId) {
    return <p>User not logged in. Please login.</p>;
  }

  if (cartItems.length === 0) {
    return <p style={{ padding: 20 }}>Cart is empty. Please add products.</p>;
  }

  return (
    <AddDetails
      userId={userId}
      cartItems={cartItems}
      onOrderPlaced={handleOrderPlaced}
    />
  );
};

export default AddDetailsWrapper;
