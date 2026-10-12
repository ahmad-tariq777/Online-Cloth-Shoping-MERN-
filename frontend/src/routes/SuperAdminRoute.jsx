import React from 'react';
import { Navigate } from 'react-router-dom';

const SuperAdminRoute = ({ children }) => {
  const storedUser = JSON.parse(localStorage.getItem('user'));

  
  if (!storedUser || storedUser.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SuperAdminRoute;