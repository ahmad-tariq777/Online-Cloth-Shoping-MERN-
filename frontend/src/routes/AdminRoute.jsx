import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const storedUser = JSON.parse(localStorage.getItem('user'));

  
  if (!storedUser || (storedUser.role !== 'moderator' && storedUser.role !== 'super_admin')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;