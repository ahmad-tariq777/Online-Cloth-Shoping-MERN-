import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetUrl } from '../../api/client';
import '../../css/Cart.css';
import '../../css/font.css';
const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      setCartItems(JSON.parse(stored));
    }
  }, []);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...cartItems];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    navigate('/add-details', { state: { cartItems } });
  };

  return (
    <div className="cart-container">
  <h2>Your Shopping Cart</h2>

  {cartItems.length === 0 ? (
    <p>No items in the cart yet.</p>
  ) : (
    <>
      <div className="cart-list">
        {cartItems.map((item, index) => (
          <div key={index} className="cart-card">
            <img
              src={assetUrl(item.image)}
              alt={item.name}
              className="cart-image"
            />
            <div style={{ flex: 1 }}>
              <h4>{item.name}</h4>
              <p>Price: ${item.price}</p>
              <p>Size: {item.size}</p>
              <p>Quantity: {item.quantity}</p>
            </div>
            <button
              onClick={() => handleRemoveItem(index)}
              className="cart-remove-btn"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <h3>Total: ${getTotalPrice()}</h3>

      <button onClick={handlePlaceOrder} className="cart-checkout-btn">
        Place Order
      </button>
    </>
  )}
</div>

  );
};

export default Cart;
