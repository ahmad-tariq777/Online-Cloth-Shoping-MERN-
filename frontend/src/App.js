import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./theme/theme.css"
import WardrobeApp from "./wardobe/WardrobeApp";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/user/Home";
import ProductDetail from "./pages/user/ProductDetail";
import Cart from "./pages/user/Cart";
import Payment from "./pages/user/Payment";
import OrderSuccess from "./pages/user/OrderSuccess";
import Crousal from "./pages/user/Crousal";
import GenderPage from "./pages/user/sections/GenderPage";

import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import Aboutus from "./pages/public/Aboutus";

import AddDetailsWrapper from "./components/forms/AddDetailsWrapper";
import OrderHistory from "./components/order/OrderHistory";
import Contact from "./components/common/Contact";

import AddProduct from "./pages/admin/AddProducts";
import ProductList from "./pages/admin/ProductList";
import AdminOrders from "./pages/admin/AdminOrder";
import CarouselAdmin from "./pages/admin/Carouseladmin";
import DropCollectionAdmin from "./pages/admin/Dropcollectionadmin";
import UserManagement from "./pages/admin/UserManagement";
import ManageSales from "./pages/admin/ManageSales";

import AdminRoute from "./routes/AdminRoute";
import SuperAdminRoute from "./routes/SuperAdminRoute";

import SuperAdminDashboard from "./pages/dashboards/SuperAdminDashboard";
import ModeratorDashboard from "./pages/dashboards/ModeratorDashboard";
import UserDashboard from "./pages/dashboards/UserDashboard";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function ProtectedRoute({ children }) {
  const storedUser = getStoredUser();
  const location = useLocation();
  if (!storedUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function GuestRoute({ children }) {
  const storedUser = getStoredUser();
  if (storedUser) return <Navigate to="/" replace />;
  return children;
}

function RoleDashboard() {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "super_admin") return <SuperAdminDashboard />;
  if (user.role === "moderator") return <ModeratorDashboard />;
  return <UserDashboard />;
}

function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <h2>404 — Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <a href="/">Go Home</a>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/dashboard" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />

        <Route path="/wardrobe/*" element={<ProtectedRoute><WardrobeApp /></ProtectedRoute>} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <>
                <Crousal />
                <Home />
              </>
            </ProtectedRoute>
          }
        />

        <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />

        <Route path="/category/:gender" element={<ProtectedRoute><GenderPage /></ProtectedRoute>} />

        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />

        <Route path="/add-details" element={<ProtectedRoute><AddDetailsWrapper /></ProtectedRoute>} />

        <Route path="/payment/:orderId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />

        <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />

        <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />

        <Route path="/about" element={<ProtectedRoute><Aboutus /></ProtectedRoute>} />

        <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

        <Route
          path="/add-product"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AddProduct />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <ProductList />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/carousel"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <CarouselAdmin />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/drop-collections"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <DropCollectionAdmin />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/moderator/dashboard"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <ModeratorDashboard />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/super-admin/users"
          element={
            <ProtectedRoute>
              <SuperAdminRoute>
                <UserManagement />
              </SuperAdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute>
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sales"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <ManageSales />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;